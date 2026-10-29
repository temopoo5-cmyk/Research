const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const tar = require('tar');
const store = require('../../api/backup/store');
const { getConfig, isStorageConfigured } = require('../../api/backup/config');
const { SCHEMA_VERSION } = require('../../api/backup/schema');
const { encryptFile, decryptFile, sha256File, md5File } = require('../../api/backup/crypto');
const {
  getDriveContext,
  ensureBackupFolder,
  uploadFile,
  downloadToFile,
  deleteBackupArtifacts
} = require('../../api/backup/drive');
const { BackupError, safeErrorMessage } = require('../../api/backup/errors');
const { buildBackupFileName, buildManifestFileName } = require('../../api/backup/naming');
const {
  parseSchemaList,
  connectPgClient,
  collectDatabaseManifest,
  pgDumpToFile,
  pgRestoreFromFile,
  pgRestoreList,
  verifyRestoredDatabase,
  assertSafeStagingTarget
} = require('./pgTools');
const { storageConfig, listObjectsRecursive, downloadObject } = require('./supabaseStorage');
const { safeObjectDestination, isSafeArchivePath } = require('./archiveSafety');
const { processYearArchiveJob } = require('./archiveService');

async function makeTempDir(prefix) {
  const root = process.env.BACKUP_TEMP_DIR || path.join(os.tmpdir(), 'researchhub-backups');
  await fsp.mkdir(root, { recursive: true, mode: 0o700 });
  return fsp.mkdtemp(path.join(root, `${prefix}-`));
}

async function cleanup(dir) {
  if (!dir) return;
  await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
}

async function writeJsonFile(filePath, value) {
  await fsp.writeFile(filePath, JSON.stringify(value, null, 2), { mode: 0o600 });
}

async function recordBackupCompleted(ctx, completed, details) {
  try {
    await store.markLastSuccess(new Date());
  } catch (err) {
    console.error('Failed to update last backup success:', safeErrorMessage(err));
  }
  try {
    await store.logAudit({
      action: 'backup.completed',
      targetType: 'backup',
      targetId: completed.id,
      details
    });
  } catch (err) {
    console.error('Failed to write backup audit log:', safeErrorMessage(err));
  }
  try {
    await pruneOldBackups(ctx, completed);
  } catch (err) {
    console.error('Backup retention failed:', safeErrorMessage(err));
  }
}

async function dumpDatabaseWithManifest(databaseUrl, rawPath) {
  const schemas = parseSchemaList();
  let client = await connectPgClient(databaseUrl);
  let snapshot = null;

  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const snapshotResult = await client.query('SELECT pg_export_snapshot() AS snapshot');
    snapshot = snapshotResult.rows[0].snapshot;
    const manifest = await collectDatabaseManifest(client, schemas);
    const dumpInfo = await pgDumpToFile(databaseUrl, rawPath, { snapshot });
    await client.query('COMMIT');
    await client.end().catch(() => {});
    return { manifest, dumpInfo, snapshotUsed: true, fallback: false };
  } catch (snapshotError) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    try { await client.end(); } catch (_) {}
    await fsp.rm(rawPath, { force: true }).catch(() => {});

    client = await connectPgClient(databaseUrl);
    let manifest;
    try {
      manifest = await collectDatabaseManifest(client, schemas);
    } finally {
      await client.end().catch(() => {});
    }
    const dumpInfo = await pgDumpToFile(databaseUrl, rawPath, { snapshot: null });
    return { manifest, dumpInfo, snapshotUsed: false, fallback: true };
  }
}

async function createDatabaseBackup(job) {
  const existing = await store.findBackupByJob(job.id);
  if (existing && existing.status === 'completed' && existing.drive_file_id) {
    return { skipped: true, backup: existing };
  }

  const config = getConfig();
  if (!config.backupDatabaseUrl) {
    throw new BackupError('BACKUP_DATABASE_URL or DATABASE_URL is required for database backups.', {
      status: 503,
      code: 'DATABASE_URL_MISSING'
    });
  }

  const ctx = await getDriveContext();
  const folder = await ensureBackupFolder(ctx);
  const at = new Date(job.created_at);
  const fileName = buildBackupFileName({ kind: 'database', at, jobId: job.id });
  const tempDir = await makeTempDir(`db-${job.id.slice(0, 8)}`);
  const rawPath = path.join(tempDir, 'database.dump');
  const encryptedPath = path.join(tempDir, 'database.dump.enc');
  const manifestPath = path.join(tempDir, 'manifest.json');

  try {
    const { manifest, dumpInfo, snapshotUsed, fallback } = await dumpDatabaseWithManifest(
      config.backupDatabaseUrl,
      rawPath
    );
    const plaintextSize = (await fsp.stat(rawPath)).size;
    const plaintextSha256 = await sha256File(rawPath);

    const baseManifest = {
      app: 'ResearchHub',
      manifest_version: 1,
      schema_version: SCHEMA_VERSION,
      kind: 'database',
      created_at: at.toISOString(),
      job_id: job.id,
      set_id: job.set_id || null,
      file_name: fileName,
      plaintext_size: plaintextSize,
      plaintext_sha256: plaintextSha256,
      database: {
        name: manifest.database,
        server_version: manifest.server_version,
        schemas: manifest.schemas
      },
      dump: {
        ...dumpInfo,
        snapshot_used: snapshotUsed,
        snapshot_fallback: fallback
      },
      tables: manifest.tables,
      table_count: manifest.table_count,
      total_rows: manifest.total_rows,
      index_count: manifest.index_count,
      constraint_count: manifest.constraint_count,
      sequences: manifest.sequences,
      sequence_count: manifest.sequence_count,
      extensions: manifest.extensions,
      encryption: {
        algorithm: 'aes-256-gcm',
        key_version: config.tokenKeyVersion,
        format: 'RHBKUP01'
      }
    };

    let backup = await store.createBackupRecord({
      jobId: job.id,
      setId: job.set_id,
      kind: 'database',
      triggerType: job.trigger_type,
      fileName,
      format: 'pg_dump-custom+aes-256-gcm',
      createdBy: job.requested_by,
      manifest: baseManifest
    });

    const encrypted = await encryptFile(rawPath, encryptedPath);
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
      pg_version: dumpInfo.pgDumpVersion,
      schema_version: SCHEMA_VERSION,
      manifest: finalManifest,
      status: 'uploading'
    });

    const uploaded = await uploadFile({
      ctx,
      folderId: folder.id,
      filePath: encryptedPath,
      fileName,
      jobId: job.id,
      artifact: 'backup',
      kind: 'database',
      localMd5: encrypted.fileMd5,
      extraAppProperties: {
        researchhubSchemaVersion: SCHEMA_VERSION
      }
    });

    await store.updateBackup(backup.id, {
      drive_file_id: uploaded.file.id,
      drive_folder_id: folder.id,
      status: 'verifying'
    });

    await writeJsonFile(manifestPath, finalManifest);
    const manifestMd5 = await md5File(manifestPath);
    const manifestFileName = buildManifestFileName(fileName);
    const manifestUpload = await uploadFile({
      ctx,
      folderId: folder.id,
      filePath: manifestPath,
      fileName: manifestFileName,
      mimeType: 'application/json',
      jobId: job.id,
      artifact: 'manifest',
      kind: 'database',
      localMd5: manifestMd5
    });

    const completed = await store.completeBackup(backup.id, {
      drive_file_id: uploaded.file.id,
      drive_folder_id: folder.id,
      manifest_drive_file_id: manifestUpload.file.id,
      file_size: plaintextSize,
      encrypted_size: encrypted.encryptedSize,
      file_sha256: encrypted.fileSha256,
      content_sha256: plaintextSha256,
      file_md5: encrypted.fileMd5,
      pg_version: dumpInfo.pgDumpVersion,
      schema_version: SCHEMA_VERSION,
      manifest: finalManifest
    });

    await recordBackupCompleted(ctx, completed, {
      kind: 'database',
      trigger: job.trigger_type,
      encrypted_size: encrypted.encryptedSize,
      snapshot_used: snapshotUsed
    });
    return { skipped: false, backup: completed };
  } finally {
    await cleanup(tempDir);
  }
}

async function createStorageBackup(job) {
  const existing = await store.findBackupByJob(job.id);
  if (existing && existing.status === 'completed' && existing.drive_file_id) {
    return { skipped: true, backup: existing };
  }

  const config = storageConfig();
  const ctx = await getDriveContext();
  const folder = await ensureBackupFolder(ctx);
  const at = new Date(job.created_at);
  const fileName = buildBackupFileName({ kind: 'storage', at, jobId: job.id });
  const tempDir = await makeTempDir(`storage-${job.id.slice(0, 8)}`);
  const objectsRoot = path.join(tempDir, 'objects');
  const archivePath = path.join(tempDir, 'storage.tar.gz');
  const encryptedPath = path.join(tempDir, 'storage.tar.gz.enc');
  const archiveManifestPath = path.join(tempDir, 'backup-manifest.json');
  const sidecarPath = path.join(tempDir, 'sidecar-manifest.json');

  try {
    await fsp.mkdir(objectsRoot, { recursive: true, mode: 0o700 });
    const objects = await listObjectsRecursive(config);
    const objectRecords = [];
    let totalBytes = 0;

    for (const object of objects) {
      const destination = safeObjectDestination(objectsRoot, object.path);
      await fsp.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
      const downloadedSize = await downloadObject(config, object.path, destination);
      if (Number(object.size) > 0 && Number(downloadedSize) !== Number(object.size)) {
        throw new BackupError(`Supabase Storage object size mismatch for ${object.path}.`, {
          code: 'STORAGE_SIZE_MISMATCH'
        });
      }
      const hash = await sha256File(destination);
      objectRecords.push({
        path: object.path,
        size: downloadedSize,
        sha256: hash,
        updated_at: object.updated_at,
        etag: object.etag
      });
      totalBytes += downloadedSize;
    }

    const archiveManifest = {
      app: 'ResearchHub',
      manifest_version: 1,
      schema_version: SCHEMA_VERSION,
      kind: 'storage',
      created_at: at.toISOString(),
      job_id: job.id,
      set_id: job.set_id || null,
      bucket: config.storageBucket,
      object_count: objectRecords.length,
      total_bytes: totalBytes,
      objects: objectRecords,
      encryption: {
        algorithm: 'aes-256-gcm',
        key_version: config.tokenKeyVersion,
        format: 'RHBKUP01'
      }
    };
    await writeJsonFile(archiveManifestPath, archiveManifest);

    await tar.c({
      gzip: true,
      file: archivePath,
      cwd: tempDir,
      portable: true
    }, ['objects', 'backup-manifest.json']);

    const plaintextSize = (await fsp.stat(archivePath)).size;
    const plaintextSha256 = await sha256File(archivePath);

    const baseManifest = {
      app: 'ResearchHub',
      manifest_version: 1,
      schema_version: SCHEMA_VERSION,
      kind: 'storage',
      created_at: at.toISOString(),
      job_id: job.id,
      set_id: job.set_id || null,
      file_name: fileName,
      bucket: config.storageBucket,
      object_count: objectRecords.length,
      total_bytes: totalBytes,
      plaintext_size: plaintextSize,
      plaintext_sha256: plaintextSha256,
      encryption: {
        algorithm: 'aes-256-gcm',
        key_version: config.tokenKeyVersion,
        format: 'RHBKUP01'
      }
    };

    let backup = await store.createBackupRecord({
      jobId: job.id,
      setId: job.set_id,
      kind: 'storage',
      triggerType: job.trigger_type,
      fileName,
      format: 'tar.gz+aes-256-gcm',
      createdBy: job.requested_by,
      manifest: baseManifest
    });

    const encrypted = await encryptFile(archivePath, encryptedPath);
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
      jobId: job.id,
      artifact: 'backup',
      kind: 'storage',
      localMd5: encrypted.fileMd5,
      extraAppProperties: {
        researchhubSchemaVersion: SCHEMA_VERSION
      }
    });

    await store.updateBackup(backup.id, {
      drive_file_id: uploaded.file.id,
      drive_folder_id: folder.id,
      status: 'verifying'
    });

    await writeJsonFile(sidecarPath, finalManifest);
    const sidecarMd5 = await md5File(sidecarPath);
    const manifestUpload = await uploadFile({
      ctx,
      folderId: folder.id,
      filePath: sidecarPath,
      fileName: buildManifestFileName(fileName),
      mimeType: 'application/json',
      jobId: job.id,
      artifact: 'manifest',
      kind: 'storage',
      localMd5: sidecarMd5
    });

    const completed = await store.completeBackup(backup.id, {
      drive_file_id: uploaded.file.id,
      drive_folder_id: folder.id,
      manifest_drive_file_id: manifestUpload.file.id,
      file_size: plaintextSize,
      encrypted_size: encrypted.encryptedSize,
      file_sha256: encrypted.fileSha256,
      content_sha256: plaintextSha256,
      file_md5: encrypted.fileMd5,
      schema_version: SCHEMA_VERSION,
      manifest: finalManifest
    });

    await recordBackupCompleted(ctx, completed, {
      kind: 'storage',
      trigger: job.trigger_type,
      encrypted_size: encrypted.encryptedSize,
      object_count: objectRecords.length
    });
    return { skipped: false, backup: completed };
  } finally {
    await cleanup(tempDir);
  }
}

async function pruneOldBackups(ctx, protectedBackup) {
  let settings;
  try {
    settings = await store.getSettings();
  } catch (_) {
    return;
  }
  if (!settings) return;
  const kinds = [protectedBackup.kind];
  for (const kind of kinds) {
    let candidates = [];
    try {
      candidates = await store.listRetentionCandidates({
        kind,
        retentionCount: settings.retention_count,
        retentionDays: settings.retention_days,
        protectId: protectedBackup.id
      });
    } catch (err) {
      await store.logAudit({
        action: 'backup.retention.failed',
        targetType: 'backup',
        targetId: protectedBackup.id,
        details: { error: safeErrorMessage(err) }
      });
      continue;
    }
    for (const candidate of candidates) {
      try {
        await deleteBackupArtifacts(ctx, candidate);
        await store.markBackupDeleted(candidate.id, {
          adminId: null,
          reason: 'retention'
        });
        await store.logAudit({
          action: 'backup.retention.deleted',
          targetType: 'backup',
          targetId: candidate.id,
          details: { kind, reason: 'retention' }
        });
      } catch (err) {
        await store.logAudit({
          action: 'backup.retention.delete_failed',
          targetType: 'backup',
          targetId: candidate.id,
          details: { kind, error: safeErrorMessage(err) }
        });
      }
    }
  }
}

async function validateStorageBackup(backup, plaintextPath, tempDir) {
  const extractDir = path.join(tempDir, 'extracted');
  await fsp.mkdir(extractDir, { recursive: true, mode: 0o700 });
  await tar.x({
    file: plaintextPath,
    cwd: extractDir,
    preservePaths: false,
    filter: (entryPath, entry) => {
      if (!isSafeArchivePath(entryPath)) return false;
      return entry.type !== 'SymbolicLink' && entry.type !== 'Link';
    }
  });
  const manifestPath = path.join(extractDir, 'backup-manifest.json');
  const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  const objects = Array.isArray(manifest.objects) ? manifest.objects : [];
  const mismatches = [];
  let verified = 0;
  for (const object of objects) {
    const destination = safeObjectDestination(extractDir, object.path);
    const stat = await fsp.stat(destination).catch(() => null);
    if (!stat) {
      mismatches.push({ path: object.path, error: 'missing_from_archive' });
      continue;
    }
    const hash = await sha256File(destination);
    if (hash !== object.sha256 || Number(stat.size) !== Number(object.size)) {
      mismatches.push({ path: object.path, error: 'size_or_hash_mismatch' });
      continue;
    }
    verified += 1;
  }
  return {
    ok: mismatches.length === 0 && verified === objects.length,
    archive_manifest_version: manifest.manifest_version,
    bucket: manifest.bucket,
    object_count: objects.length,
    verified_objects: verified,
    mismatches,
    verified_at: new Date().toISOString()
  };
}

async function validateRestore(job) {
  const payload = job.payload || {};
  const validation = payload.validationId
    ? await store.getRestoreValidation(payload.validationId)
    : await store.getRestoreValidationByJob(job.id);
  if (!validation) {
    throw new BackupError('Restore validation record was not found.', { code: 'VALIDATION_NOT_FOUND' });
  }
  const backup = await store.getBackupById(validation.backup_id || payload.backupId);
  if (!backup || backup.status !== 'completed') {
    throw new BackupError('The backup selected for validation is not available.', {
      code: 'BACKUP_NOT_RESTORABLE'
    });
  }

  await store.updateRestoreValidation(validation.id, {
    status: 'running',
    started_at: new Date(),
    staging_target: validation.staging_target || null
  });

  const ctx = await getDriveContext();
  const tempDir = await makeTempDir(`validate-${job.id.slice(0, 8)}`);
  const encryptedPath = path.join(tempDir, 'backup.enc');
  const plaintextPath = path.join(tempDir, 'backup.plain');

  try {
    const downloaded = await downloadToFile({
      ctx,
      fileId: backup.drive_file_id,
      destination: encryptedPath,
      expectedSize: backup.encrypted_size
    });
    if (backup.file_sha256 && downloaded.sha256 !== backup.file_sha256) {
      throw new BackupError('Downloaded backup checksum does not match the database record.', {
        code: 'BACKUP_CHECKSUM_MISMATCH'
      });
    }

    await decryptFile(encryptedPath, plaintextPath, {
      expectedSha256: backup.content_sha256 || undefined
    });

    let checks;
    if (backup.kind === 'database') {
      const config = getConfig();
      const staging = assertSafeStagingTarget(config.stagingDatabaseUrl, config.backupDatabaseUrl);
      const restoreList = await pgRestoreList(plaintextPath);
      const restoreInfo = await pgRestoreFromFile(config.stagingDatabaseUrl, plaintextPath);
      const stagingClient = await connectPgClient(config.stagingDatabaseUrl);
      try {
        const verification = await verifyRestoredDatabase(stagingClient, backup.manifest || {});
        checks = {
          ...verification,
          restore_list_entries: restoreList.split(/\r?\n/).filter(Boolean).length,
          pg_restore_version: restoreInfo.pgRestoreVersion,
          staging_host: staging.staging.host,
          staging_database: staging.staging.database,
          production_untouched: true
        };
      } finally {
        await stagingClient.end().catch(() => {});
      }
    } else if (backup.kind === 'storage') {
      checks = await validateStorageBackup(backup, plaintextPath, tempDir);
      checks.production_untouched = true;
    } else {
      throw new BackupError('Unsupported backup kind for restore validation.', { code: 'UNSUPPORTED_BACKUP_KIND' });
    }

    if (!checks.ok) {
      await store.updateRestoreValidation(validation.id, {
        status: 'failed',
        checks,
        error_message: 'Staged restore verification found mismatches. Production was not modified.',
        finished_at: new Date()
      });
      throw new BackupError('Staged restore verification found mismatches. Production was not modified.', {
        code: 'RESTORE_VERIFICATION_FAILED'
      });
    }

    const completed = await store.updateRestoreValidation(validation.id, {
      status: 'completed',
      checks,
      error_message: null,
      finished_at: new Date()
    });
    await store.logAudit({
      action: 'backup.restore.validated',
      targetType: 'backup',
      targetId: backup.id,
      details: {
        validation_id: validation.id,
        kind: backup.kind,
        staging_database: checks.staging_database || null,
        production_untouched: true
      }
    });
    return { validation: completed, checks };
  } catch (err) {
    try {
      await store.updateRestoreValidation(validation.id, {
        status: 'failed',
        error_message: safeErrorMessage(err),
        finished_at: new Date()
      });
    } catch (_) {}
    throw err;
  } finally {
    await cleanup(tempDir);
  }
}

async function processJob(job) {
  if (job.kind === 'database') return createDatabaseBackup(job);
  if (job.kind === 'storage') return createStorageBackup(job);
  if (job.kind === 'restore_validation') return validateRestore(job);
  if (job.kind === 'year_archive') return processYearArchiveJob(job);
  throw new BackupError(`Unsupported backup job kind: ${job.kind}`, { code: 'UNSUPPORTED_JOB_KIND' });
}

module.exports = {
  makeTempDir,
  cleanup,
  dumpDatabaseWithManifest,
  createDatabaseBackup,
  createStorageBackup,
  validateRestore,
  validateStorageBackup,
  pruneOldBackups,
  processJob,
  isStorageConfigured
};
