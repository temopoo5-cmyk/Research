const { BackupError } = require('./errors');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FREQUENCIES = ['daily', 'weekly'];
const BACKUP_KINDS = ['database', 'storage'];
const RESTORE_CONFIRMATIONS = ['RESTORE', 'RESTORE-VALIDATION'];

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

function requireUuid(value, label = 'id') {
  if (!isUuid(value)) {
    throw new BackupError(`Invalid ${label}.`, { status: 400, code: 'INVALID_ID' });
  }
  return value;
}

function intInRange(value, min, max, label) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new BackupError(`${label} must be an integer between ${min} and ${max}.`, {
      status: 400,
      code: 'INVALID_SETTING'
    });
  }
  return parsed;
}

function boolValue(value, label) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  throw new BackupError(`${label} must be true or false.`, { status: 400, code: 'INVALID_SETTING' });
}

function computeNextRunAt(settings, from = new Date()) {
  const hour = Number(settings.hour_utc);
  const weekday = Number(settings.weekday);
  const next = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    hour,
    0,
    0,
    0
  ));

  if (settings.frequency === 'weekly') {
    const delta = (weekday - next.getUTCDay() + 7) % 7;
    next.setUTCDate(next.getUTCDate() + delta);
    if (next.getTime() <= from.getTime()) next.setUTCDate(next.getUTCDate() + 7);
  } else if (next.getTime() <= from.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}

function validateSettingsInput(body, current) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BackupError('Settings payload must be an object.', { status: 400, code: 'INVALID_SETTINGS' });
  }

  const allowed = new Set([
    'auto_enabled',
    'frequency',
    'hour_utc',
    'weekday',
    'retention_count',
    'retention_days',
    'include_storage',
    'max_attempts'
  ]);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) {
      throw new BackupError(`Unknown setting: ${key}`, { status: 400, code: 'INVALID_SETTING' });
    }
  }

  const next = {};
  if ('auto_enabled' in body) next.auto_enabled = boolValue(body.auto_enabled, 'auto_enabled');
  if ('include_storage' in body) next.include_storage = boolValue(body.include_storage, 'include_storage');
  if ('frequency' in body) {
    if (!FREQUENCIES.includes(body.frequency)) {
      throw new BackupError('frequency must be daily or weekly.', { status: 400, code: 'INVALID_SETTING' });
    }
    next.frequency = body.frequency;
  }
  if ('hour_utc' in body) next.hour_utc = intInRange(body.hour_utc, 0, 23, 'hour_utc');
  if ('weekday' in body) next.weekday = intInRange(body.weekday, 0, 6, 'weekday');
  if ('retention_count' in body) next.retention_count = intInRange(body.retention_count, 1, 365, 'retention_count');
  if ('retention_days' in body) next.retention_days = intInRange(body.retention_days, 0, 3650, 'retention_days');
  if ('max_attempts' in body) next.max_attempts = intInRange(body.max_attempts, 1, 10, 'max_attempts');

  if (Object.keys(next).length === 0) {
    throw new BackupError('No supported settings were provided.', { status: 400, code: 'INVALID_SETTINGS' });
  }

  return { ...current, ...next };
}

function validateKind(value, label = 'kind') {
  if (!BACKUP_KINDS.includes(value)) {
    throw new BackupError(`${label} must be database or storage.`, { status: 400, code: 'INVALID_KIND' });
  }
  return value;
}

function validateRestoreConfirmation(value) {
  if (!RESTORE_CONFIRMATIONS.includes(String(value || ''))) {
    throw new BackupError('Type RESTORE to confirm the staged restore validation.', {
      status: 400,
      code: 'RESTORE_CONFIRMATION_REQUIRED'
    });
  }
  return true;
}

function validateDeleteConfirmation(value) {
  if (String(value || '') !== 'DELETE') {
    throw new BackupError('Type DELETE to confirm deleting this backup.', {
      status: 400,
      code: 'DELETE_CONFIRMATION_REQUIRED'
    });
  }
  return true;
}

function sanitizeRedirectPath(value) {
  if (typeof value !== 'string') return '/admin/backups';
  if (!value.startsWith('/admin/')) return '/admin/backups';
  if (value.includes('\\') || value.includes('..') || /[\r\n]/.test(value)) return '/admin/backups';
  return value.slice(0, 400);
}

function safeFileName(value) {
  const cleaned = String(value || 'backup')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 180);
  return cleaned || 'backup';
}

function sanitizeErrorMessage(value, max = 1800) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, max);
}

function stagingTargetLabel(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const database = decodeURIComponent((parsed.pathname || '').replace(/^\//, '')) || '(default)';
    return `${parsed.hostname}:${parsed.port || '5432'}/${database}`;
  } catch (_) {
    return 'configured staging database';
  }
}

function sameDatabase(a, b) {
  if (!a || !b) return false;
  try {
    const left = new URL(a);
    const right = new URL(b);
    const leftDb = decodeURIComponent((left.pathname || '').replace(/^\//, ''));
    const rightDb = decodeURIComponent((right.pathname || '').replace(/^\//, ''));
    return left.hostname.toLowerCase() === right.hostname.toLowerCase() &&
      String(left.port || '5432') === String(right.port || '5432') &&
      leftDb === rightDb;
  } catch (_) {
    return a === b;
  }
}

module.exports = {
  UUID_RE,
  BACKUP_KINDS,
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
};
