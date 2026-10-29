const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isUuid,
  requireUuid,
  computeNextRunAt,
  validateSettingsInput,
  validateKind,
  validateRestoreConfirmation,
  validateDeleteConfirmation,
  sanitizeRedirectPath,
  safeFileName,
  sanitizeErrorMessage,
  stagingTargetLabel,
  sameDatabase
} = require('../api/backup/validation');

const currentSettings = {
  auto_enabled: false,
  frequency: 'daily',
  hour_utc: 2,
  weekday: 1,
  retention_count: 14,
  retention_days: 0,
  include_storage: false,
  max_attempts: 3
};

test('UUID validation accepts only canonical UUIDs', () => {
  assert.equal(isUuid('123e4567-e89b-42d3-a456-426614174000'), true);
  assert.equal(isUuid('123e4567-e89b-12d3-a456-426614174000'), true);
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isUuid(null), false);
  assert.throws(() => requireUuid('nope', 'backup id'), /Invalid backup id/);
});

test('computeNextRunAt returns the next daily UTC run', () => {
  const from = new Date('2026-10-29T03:00:00.000Z');
  assert.equal(computeNextRunAt({ frequency: 'daily', hour_utc: 2, weekday: 1 }, from).toISOString(), '2026-10-30T02:00:00.000Z');
  assert.equal(computeNextRunAt({ frequency: 'daily', hour_utc: 4, weekday: 1 }, from).toISOString(), '2026-10-29T04:00:00.000Z');
});

test('computeNextRunAt returns the next weekly UTC run', () => {
  const thursday = new Date('2026-10-29T03:00:00.000Z');
  assert.equal(computeNextRunAt({ frequency: 'weekly', hour_utc: 2, weekday: 1 }, thursday).toISOString(), '2026-11-02T02:00:00.000Z');
  assert.equal(computeNextRunAt({ frequency: 'weekly', hour_utc: 4, weekday: 4 }, thursday).toISOString(), '2026-10-29T04:00:00.000Z');
});

test('settings validation merges valid fields and rejects unsafe input', () => {
  const merged = validateSettingsInput({ auto_enabled: true, frequency: 'weekly', hour_utc: 23 }, currentSettings);
  assert.equal(merged.auto_enabled, true);
  assert.equal(merged.frequency, 'weekly');
  assert.equal(merged.hour_utc, 23);
  assert.equal(merged.retention_count, 14);

  assert.throws(() => validateSettingsInput({ auto_enabled: true, unexpected: 1 }, currentSettings), /Unknown setting/);
  assert.throws(() => validateSettingsInput({ hour_utc: 24 }, currentSettings), /between 0 and 23/);
  assert.throws(() => validateSettingsInput({ retention_count: 0 }, currentSettings), /between 1 and 365/);
  assert.throws(() => validateSettingsInput({}, currentSettings), /No supported settings/);
  assert.throws(() => validateSettingsInput([], currentSettings), /must be an object/);
});

test('confirmation, kind, and filename helpers are strict', () => {
  assert.equal(validateKind('database'), 'database');
  assert.equal(validateKind('storage'), 'storage');
  assert.throws(() => validateKind('full'), /database or storage/);
  assert.equal(validateRestoreConfirmation('RESTORE'), true);
  assert.throws(() => validateRestoreConfirmation('restore'), /Type RESTORE/);
  assert.equal(validateDeleteConfirmation('DELETE'), true);
  assert.throws(() => validateDeleteConfirmation('delete'), /Type DELETE/);
  assert.equal(safeFileName('../../evil name.enc'), '_.._evil_name.enc');
  assert.equal(safeFileName(''), 'backup');
  assert.equal(sanitizeErrorMessage('a\nb\tc'), 'a b c');
});

test('redirect sanitization only allows local admin paths', () => {
  assert.equal(sanitizeRedirectPath('/admin/backups'), '/admin/backups');
  assert.equal(sanitizeRedirectPath('https://evil.example'), '/admin/backups');
  assert.equal(sanitizeRedirectPath('/admin/../secret'), '/admin/backups');
  assert.equal(sanitizeRedirectPath('\\\\evil'), '/admin/backups');
  assert.equal(sanitizeRedirectPath(null), '/admin/backups');
});

test('database target comparison and labels normalize URLs', () => {
  assert.equal(sameDatabase('postgresql://u:p@host:5432/db', 'postgres://u:q@host/db'), true);
  assert.equal(sameDatabase('postgresql://u:p@host:5432/db', 'postgresql://u:p@host:5432/other'), false);
  assert.equal(sameDatabase(null, null), false);
  assert.equal(stagingTargetLabel('postgresql://u:p@staging.example:5432/researchhub_staging'), 'staging.example:5432/researchhub_staging');
});
