const crypto = require('crypto');
const os = require('os');
const pool = require('../db');
const { ensureBackupSchema } = require('./schema');
const { computeNextRunAt, sanitizeErrorMessage, stagingTargetLabel } = require('./validation');
const { isStorageConfigured, getConfig } = require('./config');
const { BackupError, safeErrorMessage } = require('./errors');

const BACKUP_FIELDS = new Set([
  'drive_file_id',
  'drive_folder_id',
  'manifest_drive_file_id',
  'file_size',
  'encrypted_size',
  'file_sha256',
  'content_sha256',
  'file_md5',
  'pg_version',
  'schema_version',
  'manifest',
  'status',
  'completed_at',
  'error_message'
]);

const VALIDATION_FIELDS = new Set([
  'status',
  'staging_target',
  'checks',
  'error_message',
  'started_at',
  'finished_at'
]);

function rowOrNull(rows) {
  return rows && rows[0] ? rows[0] : null;
}

async function getConnection() {
  await ensureBackupSchema();
  const { rows } = await pool.query('SELECT * FROM backup_drive_connections WHERE id = 1');
  return rowOrNull(rows);
}

async function saveConnection({ adminId, token, scope, folderId = null, folderName = null, accountEmail = null }) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `INSERT INTO backup_drive_connections
       (id, admin_id, refresh_token_ciphertext, refresh_token_iv, refresh_token_tag, key_version,
        scope, folder_id, folder_name, account_email, status, last_error, connected_at, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, 'connected', NULL, now(), now())
     ON CONFLICT (id) DO UPDATE SET
       admin_id = EXCLUDED.admin_id,
       refresh_token_ciphertext = EXCLUDED.refresh_token_ciphertext,
       refresh_token_iv = EXCLUDED.refresh_token_iv,
       refresh_token_tag = EXCLUDED.refresh_token_tag,
       key_version = EXCLUDED.key_version,
       scope = EXCLUDED.scope,
       folder_id = EXCLUDED.folder_id,
       folder_name = EXCLUDED.folder_name,
       account_email = EXCLUDED.account_email,
       status = 'connected',
       last_error = NULL,
       connected_at = now(),
       updated_at = now()
     RETURNING *`,
    [
      adminId,
      token.ciphertext,
      token.iv,
      token.tag,
      token.keyVersion,
      scope,
      folderId,
      folderName,
      accountEmail
    ]
  );
  return rows[0];
}

async function updateConnectionFolder(folderId, folderName) {
  await ensureBackupSchema();
  await pool.query(
    `UPDATE backup_drive_connections
     SET folder_id = $1, folder_name = $2, status = 'connected', last_error = NULL, updated_at = now()
     WHERE id = 1`,
    [folderId, folderName]
  );
}

async function markConnectionError(message, status = 'needs_reconnect') {
  await ensureBackupSchema();
  await pool.query(
    `UPDATE backup_drive_connections
     SET status = $1, last_error = $2, updated_at = now()
     WHERE id = 1`,
    [status, sanitizeErrorMessage(safeErrorMessage(message))]
  );
}

async function recordConnectionWarning(message) {
  await ensureBackupSchema();
  await pool.query(
    `UPDATE backup_drive_connections
     SET last_error = $1, updated_at = now()
     WHERE id = 1`,
    [sanitizeErrorMessage(safeErrorMessage(message))]
  );
}

async function deleteConnection() {
  await ensureBackupSchema();
  const { rows } = await pool.query('DELETE FROM backup_drive_connections WHERE id = 1 RETURNING *');
  return rowOrNull(rows);
}

async function saveOAuthState({ stateHash, adminId, redirectAfter, ttlMinutes = 10 }) {
  await ensureBackupSchema();
  await pool.query('DELETE FROM backup_oauth_states WHERE expires_at < now()');
  await pool.query(
    `INSERT INTO backup_oauth_states (state_hash, admin_id, redirect_after, expires_at)
     VALUES ($1, $2, $3, now() + ($4::int * interval '1 minute'))`,
    [stateHash, adminId, redirectAfter, ttlMinutes]
  );
}

async function consumeOAuthState(stateHash) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `DELETE FROM backup_oauth_states
     WHERE state_hash = $1 AND expires_at > now()
     RETURNING *`,
    [stateHash]
  );
  return rowOrNull(rows);
}

async function getSettings() {
  await ensureBackupSchema();
  let { rows } = await pool.query('SELECT * FROM backup_settings WHERE id = 1');
  if (!rows[0]) {
    ({ rows } = await pool.query(
      'INSERT INTO backup_settings (id) VALUES (1) ON CONFLICT (id) DO UPDATE SET updated_at = now() RETURNING *'
    ));
  }
  return rows[0];
}

async function updateSettings(settings, adminId) {
  await ensureBackupSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM backup_settings WHERE id = 1 FOR UPDATE');
    const nextRunAt = settings.auto_enabled ? computeNextRunAt(settings, new Date()) : null;
    const { rows } = await client.query(
      `UPDATE backup_settings SET
         auto_enabled = $1,
         frequency = $2,
         hour_utc = $3,
         weekday = $4,
         retention_count = $5,
         retention_days = $6,
         include_storage = $7,
         max_attempts = $8,
         next_run_at = $9,
         updated_by = $10,
         updated_at = now()
       WHERE id = 1
       RETURNING *`,
      [
        settings.auto_enabled,
        settings.frequency,
        settings.hour_utc,
        settings.weekday,
        settings.retention_count,
        settings.retention_days,
        settings.include_storage,
        settings.max_attempts,
        nextRunAt,
        adminId
      ]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function enqueueJob({
  kind,
  triggerType,
  requestedBy = null,
  payload = {},
  dedupeKey = null,
  maxAttempts = 3,
  setId = null
}) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `INSERT INTO backup_jobs
       (kind, trigger_type, requested_by, payload, dedupe_key, max_attempts, set_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (dedupe_key) DO NOTHING
     RETURNING *`,
    [kind, triggerType, requestedBy, JSON.stringify(payload), dedupeKey, maxAttempts, setId]
  );
  if (rows[0]) return { job: rows[0], created: true };
  if (!dedupeKey) return { job: null, created: false };
  const existing = await pool.query('SELECT * FROM backup_jobs WHERE dedupe_key = $1', [dedupeKey]);
  return { job: rowOrNull(existing.rows), created: false };
}

async function getActiveJob(kind) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT * FROM backup_jobs
     WHERE kind = $1 AND status IN ('queued', 'running')
     ORDER BY created_at DESC LIMIT 1`,
    [kind]
  );
  return rowOrNull(rows);
}

async function enqueueManualBackups({ kinds, requestedBy, maxAttempts = 3, payload = {} }) {
  await ensureBackupSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('researchhub_manual_backup'))");
    const active = await client.query(
      `SELECT id, kind, status FROM backup_jobs
       WHERE status IN ('queued', 'running') AND kind = ANY($1::text[])`,
      [kinds]
    );
    if (active.rows.length) {
      throw new BackupError('A backup of this type is already queued or running.', {
        status: 409,
        code: 'BACKUP_ALREADY_ACTIVE',
        details: { active: active.rows.map((row) => ({ id: row.id, kind: row.kind, status: row.status })) }
      });
    }

    const setId = crypto.randomUUID();
    const jobs = [];
    for (const kind of kinds) {
      const { rows } = await client.query(
        `INSERT INTO backup_jobs
           (kind, trigger_type, requested_by, payload, max_attempts, set_id)
         VALUES ($1, 'manual', $2, $3, $4, $5)
         RETURNING *`,
        [kind, requestedBy, JSON.stringify(payload), maxAttempts, setId]
      );
      jobs.push(rows[0]);
    }
    await client.query('COMMIT');
    return { jobs, set_id: setId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function enqueueScheduledJobs() {
  await ensureBackupSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: settingRows } = await client.query('SELECT * FROM backup_settings WHERE id = 1 FOR UPDATE');
    const settings = settingRows[0];
    if (!settings) {
      await client.query('COMMIT');
      return { enqueued: [], reason: 'settings_missing' };
    }
    if (!settings.auto_enabled) {
      await client.query('COMMIT');
      return { enqueued: [], reason: 'auto_disabled' };
    }

    const now = new Date();
    const dueAt = settings.next_run_at ? new Date(settings.next_run_at) : now;
    if (settings.next_run_at && dueAt.getTime() > now.getTime()) {
      await client.query('COMMIT');
      return { enqueued: [], reason: 'not_due', next_run_at: settings.next_run_at };
    }

    const nextRunAt = computeNextRunAt(settings, now);
    const { rows: connectionRows } = await client.query(
      'SELECT status FROM backup_drive_connections WHERE id = 1'
    );
    const connection = connectionRows[0];
    if (!connection || connection.status !== 'connected') {
      await client.query(
        'UPDATE backup_settings SET next_run_at = $1, updated_at = now() WHERE id = 1',
        [nextRunAt]
      );
      await client.query('COMMIT');
      return {
        enqueued: [],
        reason: 'drive_not_connected',
        warning: 'Scheduled backup skipped because Google Drive is not connected.',
        next_run_at: nextRunAt
      };
    }

    const setId = crypto.randomUUID();
    const kinds = ['database'];
    let warning = null;
    if (settings.include_storage) {
      if (isStorageConfigured()) kinds.push('storage');
      else warning = 'Storage backup skipped because Supabase Storage is not configured.';
    }

    const enqueued = [];
    for (const kind of kinds) {
      const dedupeKey = `scheduled:${kind}:${dueAt.toISOString()}`;
      const { rows } = await client.query(
        `INSERT INTO backup_jobs
           (kind, trigger_type, payload, dedupe_key, max_attempts, set_id)
         VALUES ($1, 'scheduled', $2, $3, $4, $5)
         ON CONFLICT (dedupe_key) DO NOTHING
         RETURNING *`,
        [kind, JSON.stringify({ scheduled_for: dueAt.toISOString() }), dedupeKey, settings.max_attempts, setId]
      );
      if (rows[0]) enqueued.push(rows[0]);
    }

    await client.query(
      'UPDATE backup_settings SET next_run_at = $1, updated_at = now() WHERE id = 1',
      [nextRunAt]
    );
    await client.query('COMMIT');
    return { enqueued, next_run_at: nextRunAt, warning };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function claimNextJob(workerId) {
  await ensureBackupSchema();
  const lockToken = crypto.randomUUID();
  const { rows } = await pool.query(
    `WITH candidate AS (
       SELECT id FROM backup_jobs
       WHERE status = 'queued'
         AND (next_attempt_at IS NULL OR next_attempt_at <= now())
       ORDER BY CASE WHEN kind = 'restore_validation' THEN 0 ELSE 1 END, created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     UPDATE backup_jobs j
     SET status = 'running',
         lock_token = $1,
         locked_at = now(),
         started_at = COALESCE(j.started_at, now()),
         attempt = j.attempt + 1,
         updated_at = now()
     FROM candidate c
     WHERE j.id = c.id
     RETURNING j.*`,
    [lockToken]
  );
  if (!rows[0]) return null;
  return { ...rows[0], worker_id: workerId };
}

async function completeJob(jobId, lockToken) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `UPDATE backup_jobs
     SET status = 'completed', finished_at = now(), lock_token = NULL, locked_at = NULL,
         error_message = NULL, updated_at = now()
     WHERE id = $1 AND lock_token = $2 AND status = 'running'
     RETURNING *`,
    [jobId, lockToken]
  );
  return rowOrNull(rows);
}

async function failJob({ jobId, lockToken, error, retry = true }) {
  await ensureBackupSchema();
  const { rows: existingRows } = await pool.query(
    'SELECT * FROM backup_jobs WHERE id = $1 AND lock_token = $2 AND status = $3',
    [jobId, lockToken, 'running']
  );
  const job = existingRows[0];
  if (!job) return null;

  const message = sanitizeErrorMessage(safeErrorMessage(error));
  const canRetry = retry && job.attempt < job.max_attempts;
  const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, job.attempt - 1)) * 2);

  const { rows } = await pool.query(
    `UPDATE backup_jobs SET
       status = $1,
       error_message = $2,
       lock_token = NULL,
       locked_at = NULL,
       next_attempt_at = CASE WHEN $1 = 'queued' THEN now() + ($3::int * interval '1 minute') ELSE NULL END,
       finished_at = CASE WHEN $1 = 'failed' THEN now() ELSE NULL END,
       updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [canRetry ? 'queued' : 'failed', message, delayMinutes, jobId]
  );

  if (!canRetry) {
    await pool.query(
      `UPDATE backups SET status = 'failed', error_message = $1
       WHERE job_id = $2 AND status IN ('uploading', 'verifying')`,
      [message, jobId]
    );
  }

  return { job: rows[0], retryScheduled: canRetry, delayMinutes };
}

async function requeueStaleJobs(staleMinutes = 180) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `WITH stale AS (
       SELECT id, attempt, max_attempts FROM backup_jobs
       WHERE status = 'running'
         AND locked_at < now() - ($1::int * interval '1 minute')
     )
     UPDATE backup_jobs j SET
       status = CASE WHEN s.attempt >= s.max_attempts THEN 'failed' ELSE 'queued' END,
       lock_token = NULL,
       locked_at = NULL,
       next_attempt_at = now(),
       finished_at = CASE WHEN s.attempt >= s.max_attempts THEN now() ELSE NULL END,
       error_message = COALESCE(j.error_message, 'Worker stopped before completing this job.'),
       updated_at = now()
     FROM stale s
     WHERE j.id = s.id
     RETURNING j.*`,
    [staleMinutes]
  );

  const failedIds = rows.filter((row) => row.status === 'failed').map((row) => row.id);
  if (failedIds.length) {
    await pool.query(
      `UPDATE backups SET status = 'failed', error_message = 'Worker stopped before completing this job.'
       WHERE job_id = ANY($1::uuid[]) AND status IN ('uploading', 'verifying')`,
      [failedIds]
    );
    await pool.query(
      `UPDATE backup_restore_validations
       SET status = 'failed', error_message = 'Worker stopped before completing this validation.',
           finished_at = now()
       WHERE job_id = ANY($1::uuid[]) AND status IN ('queued', 'running')`,
      [failedIds]
    );
  }
  return rows;
}

async function createBackupRecord({
  jobId,
  setId = null,
  kind,
  triggerType,
  fileName,
  format,
  createdBy = null,
  manifest = {}
}) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `INSERT INTO backups
       (job_id, set_id, kind, trigger_type, file_name, format, created_by, manifest, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'uploading')
     ON CONFLICT (job_id) DO UPDATE SET
       file_name = EXCLUDED.file_name,
       format = EXCLUDED.format,
       manifest = EXCLUDED.manifest,
       status = CASE WHEN backups.status = 'completed' THEN backups.status ELSE 'uploading' END,
       error_message = CASE WHEN backups.status = 'completed' THEN backups.error_message ELSE NULL END
     RETURNING *`,
    [jobId, setId, kind, triggerType, fileName, format, createdBy, JSON.stringify(manifest)]
  );
  return rows[0];
}

async function updateBackup(id, fields) {
  await ensureBackupSchema();
  const keys = Object.keys(fields).filter((key) => BACKUP_FIELDS.has(key));
  if (!keys.length) return null;
  const values = [];
  const assignments = keys.map((key, index) => {
    let value = fields[key];
    if (key === 'manifest' && value && typeof value === 'object') value = JSON.stringify(value);
    values.push(value);
    return `${key} = $${index + 1}`;
  });
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE backups SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rowOrNull(rows);
}

async function completeBackup(id, fields = {}) {
  return updateBackup(id, { ...fields, status: 'completed', completed_at: new Date(), error_message: null });
}

async function getBackupById(id) {
  await ensureBackupSchema();
  const { rows } = await pool.query('SELECT * FROM backups WHERE id = $1', [id]);
  return rowOrNull(rows);
}

async function findBackupByJob(jobId) {
  await ensureBackupSchema();
  const { rows } = await pool.query('SELECT * FROM backups WHERE job_id = $1', [jobId]);
  return rowOrNull(rows);
}

async function listBackups(limit = 100) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT b.*,
       (SELECT json_build_object(
          'id', v.id,
          'status', v.status,
          'checks', v.checks,
          'error_message', v.error_message,
          'staging_target', v.staging_target,
          'created_at', v.created_at,
          'finished_at', v.finished_at
        )
        FROM backup_restore_validations v
        WHERE v.backup_id = b.id
        ORDER BY v.created_at DESC
        LIMIT 1) AS last_validation
     FROM backups b
     ORDER BY b.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function markBackupDeleted(id, { adminId = null, reason = null } = {}) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `UPDATE backups SET
       status = 'deleted',
       deleted_at = now(),
       deleted_by = $2,
       deleted_reason = $3,
       error_message = NULL
     WHERE id = $1 AND status <> 'deleted'
     RETURNING *`,
    [id, adminId, reason]
  );
  return rowOrNull(rows);
}

async function markBackupFailedByJob(jobId, message) {
  await ensureBackupSchema();
  await pool.query(
    `UPDATE backups SET status = 'failed', error_message = $1
     WHERE job_id = $2 AND status IN ('uploading', 'verifying')`,
    [sanitizeErrorMessage(safeErrorMessage(message)), jobId]
  );
}

async function getBackupCounts() {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
       COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
       COUNT(*) FILTER (WHERE status IN ('uploading', 'verifying'))::int AS in_progress,
       COUNT(*) FILTER (WHERE status = 'deleted')::int AS deleted,
       COALESCE(SUM(encrypted_size) FILTER (WHERE status = 'completed'), 0)::bigint AS total_encrypted_bytes
     FROM backups`
  );
  return rows[0];
}

async function getLastSuccessfulBackup() {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT * FROM backups WHERE status = 'completed' ORDER BY completed_at DESC NULLS LAST LIMIT 1`
  );
  return rowOrNull(rows);
}

async function listActiveJobs() {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT * FROM backup_jobs WHERE status IN ('queued', 'running') ORDER BY created_at ASC`
  );
  return rows;
}

async function listRecentFailures(limit = 5) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT * FROM backup_jobs WHERE status = 'failed' ORDER BY finished_at DESC NULLS LAST, updated_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function listJobs(limit = 50) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT * FROM backup_jobs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function getWorkerHeartbeat() {
  await ensureBackupSchema();
  const { rows } = await pool.query('SELECT * FROM backup_worker_heartbeats WHERE id = 1');
  return rowOrNull(rows);
}

async function upsertWorkerHeartbeat({ workerId, version }) {
  await ensureBackupSchema();
  await pool.query(
    `INSERT INTO backup_worker_heartbeats (id, last_seen_at, worker_id, version, hostname, updated_at)
     VALUES (1, now(), $1, $2, $3, now())
     ON CONFLICT (id) DO UPDATE SET
       last_seen_at = now(),
       worker_id = EXCLUDED.worker_id,
       version = EXCLUDED.version,
       hostname = EXCLUDED.hostname,
       updated_at = now()`,
    [workerId, version, os.hostname()]
  );
}

async function markLastSuccess(at = new Date()) {
  await ensureBackupSchema();
  await pool.query(
    'UPDATE backup_settings SET last_success_at = $1, updated_at = now() WHERE id = 1',
    [at]
  );
}

async function logAudit({ adminId = null, action, targetType = null, targetId = null, req = null, details = {} }) {
  try {
    await ensureBackupSchema();
    const forwarded = req && req.headers ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
    const ip = forwarded || (req && (req.ip || (req.socket && req.socket.remoteAddress))) || null;
    const userAgent = req && req.headers ? String(req.headers['user-agent'] || '').slice(0, 500) : null;
    await pool.query(
      `INSERT INTO backup_audit_logs (admin_id, action, target_type, target_id, ip, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, action, targetType, targetId ? String(targetId) : null, ip, userAgent, JSON.stringify(details || {})]
    );
  } catch (err) {
    console.error('[backup/audit] failed:', safeErrorMessage(err));
  }
}

async function listAudit(limit = 50) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT * FROM backup_audit_logs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function enqueueRestoreValidation({ backupId, requestedBy, confirmationNote }) {
  await ensureBackupSchema();
  const backup = await getBackupById(backupId);
  if (!backup || backup.status !== 'completed') {
    throw new BackupError('Only completed backups can be validated.', {
      status: 409,
      code: 'BACKUP_NOT_RESTORABLE'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const active = await client.query(
      `SELECT id FROM backup_restore_validations
       WHERE backup_id = $1 AND status IN ('queued', 'running') LIMIT 1`,
      [backupId]
    );
    if (active.rows[0]) {
      throw new BackupError('A restore validation is already queued for this backup.', {
        status: 409,
        code: 'VALIDATION_ALREADY_ACTIVE'
      });
    }

    const config = getConfig();
    const stagingTarget = stagingTargetLabel(config.stagingDatabaseUrl);
    const { rows: validationRows } = await client.query(
      `INSERT INTO backup_restore_validations
         (backup_id, requested_by, confirmation_note, staging_target, status)
       VALUES ($1, $2, $3, $4, 'queued')
       RETURNING *`,
      [backupId, requestedBy, confirmationNote || null, stagingTarget]
    );
    const validation = validationRows[0];

    const { rows: jobRows } = await client.query(
      `INSERT INTO backup_jobs
         (kind, trigger_type, requested_by, payload, max_attempts)
       VALUES ('restore_validation', 'manual', $1, $2, 1)
       RETURNING *`,
      [requestedBy, JSON.stringify({ backupId, validationId: validation.id })]
    );
    const job = jobRows[0];
    await client.query(
      'UPDATE backup_restore_validations SET job_id = $1 WHERE id = $2',
      [job.id, validation.id]
    );
    await client.query('COMMIT');
    return { validation: { ...validation, job_id: job.id }, job };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateRestoreValidation(id, fields) {
  await ensureBackupSchema();
  const keys = Object.keys(fields).filter((key) => VALIDATION_FIELDS.has(key));
  if (!keys.length) return null;
  const values = [];
  const assignments = keys.map((key, index) => {
    let value = fields[key];
    if ((key === 'checks') && value && typeof value === 'object') value = JSON.stringify(value);
    values.push(value);
    return `${key} = $${index + 1}`;
  });
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE backup_restore_validations SET ${assignments.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rowOrNull(rows);
}

async function getRestoreValidation(id) {
  await ensureBackupSchema();
  const { rows } = await pool.query('SELECT * FROM backup_restore_validations WHERE id = $1', [id]);
  return rowOrNull(rows);
}

async function getLatestValidationForBackup(backupId) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `SELECT * FROM backup_restore_validations
     WHERE backup_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [backupId]
  );
  return rowOrNull(rows);
}

async function getRestoreValidationByJob(jobId) {
  await ensureBackupSchema();
  const { rows } = await pool.query('SELECT * FROM backup_restore_validations WHERE job_id = $1', [jobId]);
  return rowOrNull(rows);
}

async function listRetentionCandidates({ kind, retentionCount, retentionDays, protectId = null }) {
  await ensureBackupSchema();
  const { rows } = await pool.query(
    `WITH ranked AS (
       SELECT b.*, row_number() OVER (ORDER BY b.created_at DESC) AS rank
       FROM backups b
       WHERE b.kind = $1
         AND b.status = 'completed'
         AND b.trigger_type = 'scheduled'
         AND ($4::uuid IS NULL OR b.id <> $4)
     )
     SELECT * FROM ranked
     WHERE ($2::int > 0 AND rank > $2)
        OR ($3::int > 0 AND created_at < now() - ($3::int * interval '1 day'))
     ORDER BY created_at ASC`,
    [kind, retentionCount, retentionDays, protectId]
  );
  return rows;
}

module.exports = {
  getConnection,
  saveConnection,
  updateConnectionFolder,
  recordConnectionWarning,
  markConnectionError,
  deleteConnection,
  saveOAuthState,
  consumeOAuthState,
  getSettings,
  updateSettings,
  enqueueJob,
  getActiveJob,
  enqueueManualBackups,
  enqueueScheduledJobs,
  claimNextJob,
  completeJob,
  failJob,
  requeueStaleJobs,
  createBackupRecord,
  updateBackup,
  completeBackup,
  getBackupById,
  findBackupByJob,
  listBackups,
  markBackupDeleted,
  markBackupFailedByJob,
  getBackupCounts,
  getLastSuccessfulBackup,
  listActiveJobs,
  listRecentFailures,
  listJobs,
  getWorkerHeartbeat,
  upsertWorkerHeartbeat,
  markLastSuccess,
  logAudit,
  listAudit,
  enqueueRestoreValidation,
  updateRestoreValidation,
  getRestoreValidation,
  getLatestValidationForBackup,
  getRestoreValidationByJob,
  listRetentionCandidates
};
