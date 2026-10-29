const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const ORIGINAL_KEY = process.env.BACKUP_ENCRYPTION_KEY;
process.env.BACKUP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

const {
  FILE_MAGIC,
  parseKey,
  encryptSecret,
  decryptSecret,
  encryptFile,
  decryptFile,
  sha256File
} = require('../api/backup/crypto');

test.after(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.BACKUP_ENCRYPTION_KEY;
  else process.env.BACKUP_ENCRYPTION_KEY = ORIGINAL_KEY;
});

test('parseKey accepts base64 and hex 32-byte keys', () => {
  const raw = crypto.randomBytes(32);
  assert.deepEqual(parseKey(raw.toString('base64')), raw);
  assert.deepEqual(parseKey(raw.toString('hex')), raw);
  assert.throws(() => parseKey('short'), /32-byte key/);
  assert.throws(() => parseKey(''), /is not set/);
});

test('refresh token encryption is authenticated and round-trips', () => {
  const secret = '1//refresh-token-with-special-chars-~!@#';
  const record = encryptSecret(secret);
  assert.equal(typeof record.ciphertext, 'string');
  assert.equal(record.keyVersion, 'v1');
  assert.equal(decryptSecret(record), secret);

  const tampered = Buffer.from(record.ciphertext, 'base64');
  tampered[0] ^= 0xff;
  assert.throws(
    () => decryptSecret({ ...record, ciphertext: tampered.toString('base64') }),
    /Unable to decrypt/
  );
});

test('backup files use magic header, authenticate, and verify checksum', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'researchhub-crypto-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const plaintextPath = path.join(dir, 'backup.dump');
  const encryptedPath = path.join(dir, 'backup.dump.enc');
  const decryptedPath = path.join(dir, 'backup.dump.out');
  const content = crypto.randomBytes(256 * 1024);
  await fs.writeFile(plaintextPath, content);

  const result = await encryptFile(plaintextPath, encryptedPath);
  assert.equal(result.encryptedSize, content.length + FILE_MAGIC.length + 12 + 16);
  assert.equal(result.fileSha256, await sha256File(encryptedPath));

  const header = await fs.readFile(encryptedPath);
  assert.deepEqual(header.subarray(0, FILE_MAGIC.length), FILE_MAGIC);

  const plaintextSha256 = await sha256File(plaintextPath);
  const decrypted = await decryptFile(encryptedPath, decryptedPath, { expectedSha256: plaintextSha256 });
  assert.equal(decrypted.plaintextSha256, plaintextSha256);
  assert.deepEqual(await fs.readFile(decryptedPath), content);

  const badPath = path.join(dir, 'bad.out');
  await assert.rejects(
    () => decryptFile(encryptedPath, badPath, { expectedSha256: '0'.repeat(64) }),
    /checksum does not match/
  );
  await assert.rejects(() => fs.access(badPath));
});

test('wrong encryption key cannot decrypt backup files', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'researchhub-crypto-key-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const plaintextPath = path.join(dir, 'backup.dump');
  const encryptedPath = path.join(dir, 'backup.dump.enc');
  await fs.writeFile(plaintextPath, 'researchhub backup data');
  await encryptFile(plaintextPath, encryptedPath);

  const outputPath = path.join(dir, 'out.dump');
  process.env.BACKUP_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
  try {
    await assert.rejects(
      () => decryptFile(encryptedPath, outputPath),
      /integrity check failed/
    );
    await assert.rejects(() => fs.access(outputPath));
  } finally {
    process.env.BACKUP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  }
});

test('decryptFile rejects non-backup and truncated files', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'researchhub-crypto-bad-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const shortPath = path.join(dir, 'short.enc');
  const unknownPath = path.join(dir, 'unknown.enc');
  await fs.writeFile(shortPath, 'too short');
  await fs.writeFile(unknownPath, Buffer.concat([Buffer.from('NOTMAGIC'), Buffer.alloc(60)]));

  await assert.rejects(() => decryptFile(shortPath, path.join(dir, 'a.out')), /too small or corrupt/);
  await assert.rejects(() => decryptFile(unknownPath, path.join(dir, 'b.out')), /Unrecognized backup file/);
});
