const path = require('path');
const { BackupError } = require('../../api/backup/errors');

function safeObjectDestination(objectsRoot, objectPath) {
  const root = path.resolve(objectsRoot);
  const resolved = path.resolve(root, String(objectPath));
  const relative = path.relative(root, resolved);
  if (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) {
    throw new BackupError('Refusing to write a Supabase Storage object outside the temporary directory.', {
      code: 'STORAGE_UNSAFE_PATH'
    });
  }
  return resolved;
}

function isSafeArchivePath(entryPath) {
  const value = String(entryPath || '').replace(/\\/g, '/');
  if (!value || value === '.' || value.startsWith('/') || /^[A-Za-z]:\//.test(value)) return false;
  const parts = value.split('/');
  return parts.every((part) => part && part !== '.' && part !== '..');
}

module.exports = {
  safeObjectDestination,
  isSafeArchivePath
};
