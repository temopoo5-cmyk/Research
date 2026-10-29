const pool = require('../db');

const SCHEMA_VERSION = '2026-10-29.1';
const SCHEMA_LOCK_KEY = 'researchhub_backup_schema_v1';

const SQL = `
CREATE TABLE IF NOT EXISTS backup_drive_connections (
  id                        SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  admin_id                  BIGINT REFERENCES users(id) ON DELETE SET NULL,
  refresh_token_ciphertext  TEXT NOT NULL,
  refresh_token_iv          TEXT NOT NULL,
  refresh_token_tag         TEXT NOT NULL,
  key_version               TEXT NOT NULL DEFAULT 'v1',
  scope                     TEXT NOT NULL,
  folder_id                 TEXT,
  folder_name               TEXT,
  account_email             TEXT,
  status                    TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'needs_reconnect')),
  last_error                TEXT,
  connected_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backup_oauth_states (
  state_hash    TEXT PRIMARY KEY,
  admin_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_after TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_backup_oauth_states_expires ON backup_oauth_states (expires_at);

CREATE TABLE IF NOT EXISTS backup_settings (
  id                SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  auto_enabled      BOOLEAN NOT NULL DEFAULT false,
  frequency         TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  hour_utc          SMALLINT NOT NULL DEFAULT 2 CHECK (hour_utc BETWEEN 0 AND 23),
  weekday           SMALLINT NOT NULL DEFAULT 1 CHECK (weekday BETWEEN 0 AND 6),
  retention_count   INTEGER NOT NULL DEFAULT 14 CHECK (retention_count BETWEEN 1 AND 365),
  retention_days    INTEGER NOT NULL DEFAULT 0 CHECK (retention_days BETWEEN 0 AND 3650),
  include_storage   BOOLEAN NOT NULL DEFAULT false,
  max_attempts      SMALLINT NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  last_success_at   TIMESTAMPTZ,
  next_run_at       TIMESTAMPTZ,
  updated_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO backup_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS backup_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            TEXT NOT NULL CHECK (kind IN ('database', 'storage', 'restore_validation')),
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'retry')),
  requested_by    BIGINT REFERENCES users(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'canceled')),
  attempt         SMALLINT NOT NULL DEFAULT 0,
  max_attempts    SMALLINT NOT NULL DEFAULT 3,
  dedupe_key      TEXT UNIQUE,
  set_id          UUID,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message   TEXT,
  lock_token      TEXT,
  locked_at       TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_status ON backup_jobs (status, next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_kind_status ON backup_jobs (kind, status);

CREATE TABLE IF NOT EXISTS backups (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                UUID UNIQUE REFERENCES backup_jobs(id) ON DELETE SET NULL,
  set_id                UUID,
  kind                  TEXT NOT NULL CHECK (kind IN ('database', 'storage')),
  trigger_type          TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'verifying', 'completed', 'failed', 'deleted')),
  drive_file_id         TEXT UNIQUE,
  drive_folder_id       TEXT,
  manifest_drive_file_id TEXT,
  file_name             TEXT NOT NULL,
  file_size             BIGINT,
  encrypted_size        BIGINT,
  file_sha256           TEXT,
  content_sha256        TEXT,
  file_md5              TEXT,
  encryption            TEXT NOT NULL DEFAULT 'aes-256-gcm',
  key_version           TEXT NOT NULL DEFAULT 'v1',
  format                TEXT NOT NULL,
  pg_version            TEXT,
  schema_version        TEXT,
  manifest              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by            BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  deleted_at            TIMESTAMPTZ,
  deleted_by            BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_reason        TEXT,
  error_message         TEXT
);
CREATE INDEX IF NOT EXISTS idx_backups_created ON backups (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups (status);
CREATE INDEX IF NOT EXISTS idx_backups_kind_trigger ON backups (kind, trigger_type);

CREATE TABLE IF NOT EXISTS backup_restore_validations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id         UUID NOT NULL REFERENCES backups(id) ON DELETE CASCADE,
  job_id            UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  requested_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  confirmation_note TEXT,
  staging_target    TEXT,
  checks            JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at        TIMESTAMPTZ,
  finished_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_backup_restore_validations_backup ON backup_restore_validations (backup_id, created_at DESC);

CREATE TABLE IF NOT EXISTS backup_audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  ip          TEXT,
  user_agent  TEXT,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_backup_audit_logs_created ON backup_audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS backup_worker_heartbeats (
  id           SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_seen_at TIMESTAMPTZ NOT NULL,
  worker_id    TEXT,
  version      TEXT,
  hostname     TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'backups'
      AND column_name = 'job_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE backups ALTER COLUMN job_id DROP NOT NULL;
  END IF;
END $$;
`;

let schemaPromise;

async function runMigration(client) {
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [SCHEMA_LOCK_KEY]);
    await client.query(SQL);
    await client.query('COMMIT');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // The transaction and its advisory lock are released with the connection.
    }
    throw err;
  }
}

function ensureBackupSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const client = await pool.connect();
      try {
        await runMigration(client);
      } finally {
        client.release();
      }
    })().catch((err) => {
      schemaPromise = undefined;
      throw err;
    });
  }
  return schemaPromise;
}

module.exports = { SCHEMA_VERSION, SCHEMA_SQL: SQL, ensureBackupSchema };
