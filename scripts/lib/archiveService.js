const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const store = require('../../api/backup/store');
const { getConfig } = require('../../api/backup/config');
const { SCHEMA_VERSION } = require('../../api/backup/schema');
const { encryptFile, decryptFile, sha256File, md5File } = require('../../api/backup/crypto');
const {
  getDriveContext,
  ensureBackupFolder,
  uploadFile,
  downloadToFile
} = require('../../api/backup/drive');
const { BackupError, safeErrorMessage } = require('../../api/backup/errors');
const { buildManifestFileName, buildYearArchiveFileName } = require('../../api/backup/naming');
const {
  buildArchivePayload,
  validateArchivePayload,
  recordHashesFromPayload,
  compareRecordHashes,
  researchFromArchiveRecord,
  normalizeAuthorDetails
} = require('../../api/backup/archive');
const { connectPgClient } = require('./pgTools');

const ARCHIVE_STATUSES = ['approved', 'rejected'];

const RESEARCH_ROWS_SQL = `
  SELECT to_jsonb(r) AS research,
         p.code AS program_code,
         p.name AS program_name,
         u.username AS submitted_by_username,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'author_id', a.id,
             'name', a.name,
             'email', a.email,
             'affiliation', a.affiliation,
             'orcid', a.orcid,
             'author_order', ra.author_order,
             'is_corresponding', ra.is_corresponding
           ) ORDER BY ra.author_order, a.name)
           FROM research_authors ra
           JOIN authors a ON a.id = ra.author_id
           WHERE ra.research_id = r.id
         ), '[]'::jsonb) AS author_details
  FROM research r
  LEFT JOIN programs p ON p.id = r.program_id
  LEFT JOIN users u ON u.id = r.submitted_by
  WHERE r.year = $1 AND r.status = ANY($2::text[])
  ORDER BY r.code, r.id`;

async function makeTempDir(prefix) {
  const root = process.env.BACKUP_TEMP_DIR || path.join(os.tmpdir(), 'researchhub-backups');
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  return fs.mkdtemp(path.join(root, `${prefix}-`));
}

async function cleanup(dir) {
  if (!dir) return;
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), { mode: 0o600 });
}

async function loadResearchRows(client, year) {
  const { rows } = await client.query(RESEARCH_ROWS_SQL, [year, ARCHIVE_STATUSES]);
  return rows;
}

function alreadyCompletedArchiveResult(archive) {
  if (archive && ['ready', 'completed'].includes(archive.status)) {
    return { skipped: true, archive };
  }
  return null;
}

async function createYearArchive(job) {
  const config = getConfig();
  if (!config.backupDatabaseUrl) {
    throw new BackupError('BACKUP_DATABASE_URL or DATABASE_URL is required for yearly archives.', {
      status: 503,
      code: 'DATABASE_URL_MISSING'
    });
  }
  const payload = job.payload || {};
  const archive = payload.archiveId
    ? await store.getResearchArchive(payload.archiveId)
    : await store.getResearchArchiveByJob(job.id);
  if (!archive) {
    throw new BackupError('Year archive record was not found.', { code: 'ARCHIVE_NOT_FOUND' });
  }
  const existing = alreadyCompletedArchiveResult(archive);
  if (existing) return existing;

  const year = Number(archive.year);
  const cutoffYear = Number(archive.cutoff_year);
  await store.updateResearchArchive(archive.id, { status: 'archiving', error_message: null });

  const ctx = await getDriveContext();
  const folder = await ensureBackupFolder(ctx);
  const version = (await store.countResearchArchivesForYear(year)) || 1;
  const fileName = buildYearArchiveFileName({ year, version });
  const tempDir = await makeTempDir(`archive-${year}-${job.id.slice(0, 8)}`);
  const plaintextPath = path.join(tempDir, fileName.replace(/\.enc$/, ''));
  const encryptedPath = path.join(tempDir, fileName);
  const readBackPath = path.join(tempDir, `readback-${fileName}`);
  const readBackPlainPath = path.join(tempDir, 'readback.json');
  const sidecarPath = path.join(tempDir, `sidecar-${fileName}.json`);

  let dataClient;
  try {
    dataClient = await connectPgClient(config.backupDatabaseUrl);
    await dataClient.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    let rows;
    let dbInfo;
    try {
      dbInfo = await dataClient.query(
        "SELECT current_database() AS name, current_setting('server_version') AS version"
      );
      rows = await loadResearchRows(dataClient, year);
      await dataClient.query('COMMIT');
    } catch (err) {
      await dataClient.query('ROLLBACK').catch(() => {});
      throw err;
    }

    if (!rows.length) {
      throw new BackupError(`No approved or rejected research records were found for ${year}.`, {
        code: 'ARCHIVE_SOURCE_EMPTY'
      });
    }

    const archivePayload = buildArchivePayload({
      year,
      cutoffYear,
      rows,
      database: dbInfo ? dbInfo.rows[0].name : null,
      serverVersion: dbInfo ? dbInfo.rows[0].version : null,
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date(job.created_at || Date.now())
    });
    await writeJsonFile(plaintextPath, archivePayload);
    const plaintextSize = (await fs.stat(plaintextPath)).size;
    const plaintextSha256 = await sha256File(plaintextPath);
    const recordHashes = recordHashesFromPayload(archivePayload);

    const baseManifest = {
      app: 'ResearchHub',
      manifest_version: 1,
      kind: 'research_year',
      archive_version: archivePayload.archive_version,
      schema_version: SCHEMA_VERSION,
      year,
      cutoff_year: cutoffYear,
      created_at: archivePayload.created_at,
      job_id: job.id,
      file_name: fileName,
      plaintext_size: plaintextSize,
      plaintext_sha256: plaintextSha256,
      research_count: archivePayload.counts.research,
      author_link_count: archivePayload.counts.author_links,
      record_hashes: recordHashes,
      encryption: {
        algorithm: 'aes-256-gcm',
        key_version: config.tokenKeyVersion,
        format: 'RHBKUP01'
      }
    };

    let backup = await store.createBackupRecord({
      jobId: job.id,
      kind: 'year_archive',
      triggerType: job.trigger_type,
      fileName,
      format: 'json+aes-256-gcm',
      createdBy: job.requested_by,
      manifest: baseManifest
    });

    const encrypted = await encryptFile(plaintextPath, encryptedPath);
    const finalManifest = {
      ...baseManifest,
      encrypted_size: encrypted.encryptedSize,
      encrypted_sha256: encrypted.fileSha256,
      encrypted_md5: encrypted.fileMd5
    };
    backup = await store.updateBackup(backup.id, {
      encrypted_size: encrypted.encryptedSize,
      file_size: plaintextSize,
      file_sha256: encrypted.fileSha256,
      content_sha256: plaintextSha256,
      file_md5: encrypted.fileMd5,
      schema_version: SCHEMA_VERSION,
      manifest: finalManifest,
      status: 'uploading'
    });

    const uploaded = await uploadFile({
      ctx,
      folderId: folder.id,
      filePath: encryptedPath,
      fileName,
      mimeType: 'application/octet-stream',
      jobId: job.id,
      artifact: 'backup',
      kind: 'year_archive',
      localMd5: encrypted.fileMd5,
      extraAppProperties: {
        researchhubSchemaVersion: SCHEMA_VERSION,
        researchhubArchiveYear: year
      }
    });

    await store.updateBackup(backup.id, {
      drive_file_id: uploaded.file.id,
      drive_folder_id: folder.id,
      status: 'verifying'
    });

    const downloaded = await downloadToFile({
      ctx,
      fileId: uploaded.file.id,
      destination: readBackPath,
      expectedSize: encrypted.encryptedSize
    });
    if (downloaded.sha256 !== encrypted.fileSha256) {
      throw new BackupError('Read-back archive checksum does not match the uploaded file.', {
        code: 'ARCHIVE_READBACK_CHECKSUM_MISMATCH'
      });
    }
    await decryptFile(readBackPath, readBackPlainPath, { expectedSha256: plaintextSha256 });
    const readBackPayload = JSON.parse(await fs.readFile(readBackPlainPath, 'utf8'));
    const readBackCheck = validateArchivePayload(readBackPayload, { year });
    const readBackComparison = compareRecordHashes(recordHashes, readBackCheck.record_hashes);
    if (!readBackComparison.ok) {
      throw new BackupError('Read-back archive record hashes do not match the generated archive.', {
        code: 'ARCHIVE_READBACK_HASH_MISMATCH'
      });
    }

    await writeJsonFile(sidecarPath, finalManifest);
    const sidecarMd5 = await md5File(sidecarPath);
    const sidecarUpload = await uploadFile({
      ctx,
      folderId: folder.id,
      filePath: sidecarPath,
      fileName: buildManifestFileName(fileName),
      mimeType: 'application/json',
      jobId: job.id,
      artifact: 'manifest',
      kind: 'year_archive',
      localMd5: sidecarMd5
    });

    const completed = await store.completeBackup(backup.id, {
      drive_file_id: uploaded.file.id,
      drive_folder_id: folder.id,
      manifest_drive_file_id: sidecarUpload.file.id,
      file_size: plaintextSize,
      encrypted_size: encrypted.encryptedSize,
      file_sha256: encrypted.fileSha256,
      content_sha256: plaintextSha256,
      file_md5: encrypted.fileMd5,
      schema_version: SCHEMA_VERSION,
      manifest: {
        ...finalManifest,
        read_back_verified: true,
        read_back_verified_at: new Date().toISOString()
      }
    });

    const updated = await store.updateResearchArchive(archive.id, {
      status: 'ready',
      backup_id: completed.id,
      research_count: archivePayload.counts.research,
      author_link_count: archivePayload.counts.author_links,
      manifest: {
        ...finalManifest,
        read_back_verified: true,
        read_back_verified_at: new Date().toISOString()
      },
      error_message: null
    });

    await store.logAudit({
      action: 'archive.created',
      targetType: 'research_archive',
      targetId: archive.id,
      details: {
        year,
        cutoff_year: cutoffYear,
        research_count: archivePayload.counts.research,
        author_link_count: archivePayload.counts.author_links,
        backup_id: completed.id,
        file_name: fileName
      }
    });

    return { skipped: false, archive: updated, backup: completed };
  } catch (err) {
    throw err;
  } finally {
    if (dataClient) await dataClient.end().catch(() => {});
    await cleanup(tempDir);
  }
}

async function readVerifiedArchive(job, archive) {
  const payload = job.payload || {};
  const expectedYear = Number(payload.year || archive.year);
  if (!archive.backup_id || archive.backup_status !== 'completed' || !archive.backup_drive_file_id) {
    throw new BackupError('The archived file is not available for verification.', {
      code: 'ARCHIVE_BACKUP_UNAVAILABLE'
    });
  }

  const ctx = await getDriveContext();
  const tempDir = await makeTempDir(`verify-${archive.id.slice(0, 8)}`);
  const encryptedPath = path.join(tempDir, 'archive.enc');
  const plaintextPath = path.join(tempDir, 'archive.json');
  try {
    const downloaded = await downloadToFile({
      ctx,
      fileId: archive.backup_drive_file_id,
      destination: encryptedPath,
      expectedSize: archive.backup_encrypted_size
    });
    if (archive.manifest && archive.manifest.encrypted_sha256 &&
        downloaded.sha256 !== archive.manifest.encrypted_sha256) {
      throw new BackupError('Downloaded archive checksum does not match the archive manifest.', {
        code: 'ARCHIVE_CHECKSUM_MISMATCH'
      });
    }
    await decryptFile(encryptedPath, plaintextPath, {
      expectedSha256: archive.manifest && archive.manifest.plaintext_sha256
    });
    const raw = await fs.readFile(plaintextPath, 'utf8');
    const payloadJson = JSON.parse(raw);
    const check = validateArchivePayload(payloadJson, { year: expectedYear });
    if (archive.manifest && archive.manifest.record_hashes) {
      const manifestComparison = compareRecordHashes(
        archive.manifest.record_hashes,
        check.record_hashes
      );
      if (!manifestComparison.ok) {
        throw new BackupError('Archive file records do not match the recorded archive manifest.', {
          code: 'ARCHIVE_MANIFEST_HASH_MISMATCH',
          details: {
            missing: manifestComparison.missing.length,
            changed: manifestComparison.changed.length,
            extra: manifestComparison.extra.length
          }
        });
      }
    }
    return { ctx, payload: payloadJson, check };
  } finally {
    await cleanup(tempDir);
  }
}

async function deleteArchivedResearch(job) {
  const config = getConfig();
  if (!config.backupDatabaseUrl) {
    throw new BackupError('BACKUP_DATABASE_URL or DATABASE_URL is required for yearly archives.', {
      status: 503,
      code: 'DATABASE_URL_MISSING'
    });
  }
  const payload = job.payload || {};
  const archive = payload.archiveId
    ? await store.getResearchArchive(payload.archiveId)
    : await store.getResearchArchiveByJob(job.id);
  if (!archive) {
    throw new BackupError('Year archive record was not found.', { code: 'ARCHIVE_NOT_FOUND' });
  }
  if (archive.status === 'completed') {
    return { skipped: true, archive };
  }
  if (!['delete_queued', 'deleting'].includes(archive.status)) {
    throw new BackupError('Year archive is not approved for deletion.', {
      code: 'ARCHIVE_NOT_APPROVED'
    });
  }

  const sinceHours = Number(process.env.ARCHIVE_REQUIRE_RECENT_DB_BACKUP_HOURS || 48);
  const recentBackup = await store.getRecentCompletedDatabaseBackup({ sinceHours });
  if (!recentBackup) {
    throw new BackupError(
      `A completed full database backup within the last ${sinceHours} hours is required before deleting archived research.`,
      { code: 'ARCHIVE_RECENT_BACKUP_REQUIRED' }
    );
  }

  await store.updateResearchArchive(archive.id, { status: 'deleting', error_message: null });
  const verified = await readVerifiedArchive(job, archive);

  const client = await connectPgClient(config.backupDatabaseUrl);
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`${RESEARCH_ROWS_SQL} FOR UPDATE OF r`, [archive.year, ARCHIVE_STATUSES]);
    const currentPayload = buildArchivePayload({
      year: Number(archive.year),
      cutoffYear: Number(archive.cutoff_year),
      rows
    });
    const expectedHashes = archive.manifest && archive.manifest.record_hashes
      ? archive.manifest.record_hashes
      : recordHashesFromPayload(verified.payload);
    const comparison = compareRecordHashes(expectedHashes, recordHashesFromPayload(currentPayload));
    if (!comparison.ok) {
      throw new BackupError(
        'Archived research has changed since the archive was verified. Deletion was blocked. Create a new archive first.',
        {
          code: 'ARCHIVE_RECORDS_CHANGED',
          details: {
            missing: comparison.missing.length,
            changed: comparison.changed.length,
            extra: comparison.extra.length
          }
        }
      );
    }

    const ids = rows.map((row) => row.research.id);
    const deleted = await client.query(
      `DELETE FROM research
       WHERE id = ANY($1::bigint[]) AND year = $2 AND status = ANY($3::text[])
       RETURNING id`,
      [ids, archive.year, ARCHIVE_STATUSES]
    );
    if (deleted.rowCount !== ids.length) {
      throw new BackupError('Research deletion count did not match the verified archive. Transaction rolled back.', {
        code: 'ARCHIVE_DELETE_COUNT_MISMATCH'
      });
    }
    const deletionManifest = JSON.stringify({
      ...(archive.manifest || {}),
      deletion_verified_at: new Date().toISOString(),
      recent_database_backup_id: recentBackup.id,
      deleted_count: deleted.rowCount
    });
    await client.query(
      `UPDATE research_archives
       SET status = 'completed', deleted_count = $1, deleted_at = now(), error_message = NULL,
           manifest = COALESCE(manifest, '{}'::jsonb) || $2::jsonb, updated_at = now()
       WHERE id = $3`,
      [deleted.rowCount, deletionManifest, archive.id]
    );
    await client.query('COMMIT');

    const completed = await store.getResearchArchive(archive.id);
    await store.logAudit({
      action: 'archive.deleted_research',
      targetType: 'research_archive',
      targetId: archive.id,
      details: {
        year: archive.year,
        deleted_count: deleted.rowCount,
        recent_database_backup_id: recentBackup.id,
        archive_backup_id: archive.backup_id
      }
    });
    return { skipped: false, archive: completed, deleted: deleted.rowCount };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function restoreArchivedResearch(job) {
  const config = getConfig();
  if (!config.backupDatabaseUrl) {
    throw new BackupError('BACKUP_DATABASE_URL or DATABASE_URL is required for yearly archives.', {
      status: 503,
      code: 'DATABASE_URL_MISSING'
    });
  }
  const payload = job.payload || {};
  const archive = payload.archiveId
    ? await store.getResearchArchive(payload.archiveId)
    : await store.getResearchArchiveByJob(job.id);
  if (!archive) {
    throw new BackupError('Year archive record was not found.', { code: 'ARCHIVE_NOT_FOUND' });
  }
  if (archive.status === 'restored') {
    return { skipped: true, archive };
  }
  if (!['restore_queued', 'restoring'].includes(archive.status)) {
    throw new BackupError('Year archive is not queued for restore.', { code: 'ARCHIVE_NOT_RESTORING' });
  }

  await store.updateResearchArchive(archive.id, { status: 'restoring', error_message: null });
  const verified = await readVerifiedArchive(job, archive);
  const records = verified.payload.research || [];

  const client = await connectPgClient(config.backupDatabaseUrl);
  try {
    await client.query('BEGIN');
    const programs = await client.query('SELECT id, code FROM programs');
    const programByCode = new Map(programs.rows.map((row) => [row.code, row.id]));
    const users = await client.query('SELECT id, username FROM users');
    const userByName = new Map(users.rows.map((row) => [row.username, row.id]));
    const authors = await client.query('SELECT id, name FROM authors');
    const authorByName = new Map(authors.rows.map((row) => [row.name, row.id]));

    let restored = 0;
    let skipped = 0;
    for (const record of records) {
      const research = researchFromArchiveRecord(record);
      if (!research.code || !research.title) continue;
      const existing = await client.query('SELECT id FROM research WHERE code = $1', [research.code]);
      if (existing.rows[0]) {
        skipped += 1;
        continue;
      }

      const programId = record.program_code ? programByCode.get(record.program_code) || null : null;
      const submittedBy = record.submitted_by_username ? userByName.get(record.submitted_by_username) || null : null;
      const inserted = await client.query(
        `INSERT INTO research
           (code, title, authors, adviser, program_id, year, abstract, keywords,
            submitted_by, status, is_featured, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, now()))
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [
          research.code,
          research.title,
          research.authors || '',
          research.adviser || null,
          programId,
          Number(research.year),
          research.abstract || '',
          research.keywords || '',
          submittedBy,
          research.status || 'approved',
          Boolean(research.is_featured),
          research.created_at || null
        ]
      );
      if (!inserted.rows[0]) {
        skipped += 1;
        continue;
      }
      const researchId = inserted.rows[0].id;

      for (const author of normalizeAuthorDetails(record.author_details)) {
        if (!author || !author.name) continue;
        let authorId = authorByName.get(author.name);
        if (!authorId) {
          const createdAuthor = await client.query(
            `INSERT INTO authors (name, email, affiliation, orcid)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [author.name, author.email || null, author.affiliation || null, author.orcid || null]
          );
          authorId = createdAuthor.rows[0].id;
          authorByName.set(author.name, authorId);
        }
        await client.query(
          `INSERT INTO research_authors (research_id, author_id, author_order, is_corresponding)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (research_id, author_id) DO NOTHING`,
          [researchId, authorId, Number(author.author_order || 1), Boolean(author.is_corresponding)]
        );
      }
      restored += 1;
    }

    await client.query(
      `UPDATE research_archives
       SET status = 'restored', restored_count = $1, restored_at = now(), error_message = NULL, updated_at = now()
       WHERE id = $2`,
      [restored, archive.id]
    );
    await client.query('COMMIT');

    const completed = await store.getResearchArchive(archive.id);
    await store.logAudit({
      action: 'archive.restored_research',
      targetType: 'research_archive',
      targetId: archive.id,
      details: { year: archive.year, restored, skipped, archive_backup_id: archive.backup_id }
    });
    return { skipped: false, archive: completed, restored, skipped };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function processYearArchiveJob(job) {
  const operation = (job.payload && job.payload.operation) || 'archive';
  if (operation === 'archive') return createYearArchive(job);
  if (operation === 'delete') return deleteArchivedResearch(job);
  if (operation === 'restore') return restoreArchivedResearch(job);
  throw new BackupError(`Unsupported yearly archive operation: ${operation}`, {
    code: 'UNSUPPORTED_ARCHIVE_OPERATION'
  });
}

module.exports = {
  RESEARCH_ROWS_SQL,
  createYearArchive,
  deleteArchivedResearch,
  restoreArchivedResearch,
  processYearArchiveJob,
  safeErrorMessage
};
