const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const { safeObjectDestination, isSafeArchivePath } = require('../scripts/lib/archiveSafety');

test('storage destinations stay inside the extraction root', () => {
  const root = path.join(os.tmpdir(), 'researchhub-archive-test');
  assert.equal(safeObjectDestination(root, path.join('folder', 'file.txt')), path.join(root, 'folder', 'file.txt'));
  if (process.platform === 'win32') {
    assert.equal(safeObjectDestination(root, 'folder\\file.txt'), path.join(root, 'folder', 'file.txt'));
  }
  assert.throws(() => safeObjectDestination(root, '../escape.txt'), /outside the temporary directory/);
  assert.throws(() => safeObjectDestination(root, path.join('..', '..', 'escape.txt')), /outside the temporary directory/);
});

test('archive paths reject traversal, absolute paths, and empty segments', () => {
  assert.equal(isSafeArchivePath('folder/file.txt'), true);
  assert.equal(isSafeArchivePath('folder/../file.txt'), false);
  assert.equal(isSafeArchivePath('/etc/passwd'), false);
  assert.equal(isSafeArchivePath('C:\\Windows\\system.ini'), false);
  assert.equal(isSafeArchivePath('\\\\server\\share\\file.txt'), false);
  assert.equal(isSafeArchivePath('folder//file.txt'), false);
  assert.equal(isSafeArchivePath('folder/./file.txt'), false);
  assert.equal(isSafeArchivePath(''), false);
});
