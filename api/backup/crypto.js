const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const { pipeline } = require('stream/promises');
const { BackupError } = require('./errors');
const { getConfig } = require('./config');

const TOKEN_AAD = Buffer.from('researchhub:google-refresh-token:v1', 'utf8');
const FILE_MAGIC = Buffer.from('RHBKUP01', 'utf8');
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = FILE_MAGIC.length + IV_BYTES;

function parseKey(raw, name = 'BACKUP_ENCRYPTION_KEY') {
  if (!raw) {
    throw new BackupError(`${name} is not set.`, { status: 503, code: 'ENCRYPTION_NOT_CONFIGURED' });
  }
  let key;
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    key = Buffer.from(raw, 'hex');
  } else {
    key = Buffer.from(raw, 'base64');
  }
  if (key.length !== 32) {
    throw new BackupError(
      `${name} must be a 32-byte key encoded as base64 or 64 hex characters. Generate one with: openssl rand -base64 32`,
      { status: 503, code: 'INVALID_ENCRYPTION_KEY' }
    );
  }
  return key;
}

function getMasterKey() {
  return parseKey(getConfig().encryptionKey);
}

function getFileKey() {
  const master = getMasterKey();
  return Buffer.from(
    crypto.hkdfSync(
      'sha256',
      master,
      Buffer.from('researchhub-backup', 'utf8'),
      Buffer.from('file-encryption-v1', 'utf8'),
      32
    )
  );
}

function encryptSecret(plaintext) {
  if (typeof plaintext !== 'string' || !plaintext) {
    throw new BackupError('Cannot encrypt an empty secret.', { code: 'EMPTY_SECRET' });
  }
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(TOKEN_AAD);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    keyVersion: getConfig().tokenKeyVersion
  };
}

function decryptSecret(record) {
  if (!record || !record.ciphertext || !record.iv || !record.tag) {
    throw new BackupError('Stored Google credential is incomplete.', { code: 'INVALID_STORED_SECRET' });
  }
  const key = getMasterKey();
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(record.iv, 'base64'));
    decipher.setAAD(TOKEN_AAD);
    decipher.setAuthTag(Buffer.from(record.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(record.ciphertext, 'base64')),
      decipher.final()
    ]);
    return plaintext.toString('utf8');
  } catch (err) {
    throw new BackupError(
      'Unable to decrypt the stored Google credential. BACKUP_ENCRYPTION_KEY may have changed.',
      { status: 500, code: 'SECRET_DECRYPT_FAILED' }
    );
  }
}

async function hashFile(filePath, algorithm = 'sha256') {
  const hash = crypto.createHash(algorithm);
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest('hex');
}

async function sha256File(filePath) {
  return hashFile(filePath, 'sha256');
}

async function md5File(filePath) {
  return hashFile(filePath, 'md5');
}

async function encryptFile(inputPath, outputPath) {
  const key = getFileKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const handle = await fsp.open(outputPath, 'w', 0o600);
  try {
    await handle.write(FILE_MAGIC);
    await handle.write(iv);
  } finally {
    await handle.close();
  }

  await pipeline(fs.createReadStream(inputPath), cipher, fs.createWriteStream(outputPath, { flags: 'a', mode: 0o600 }));
  const tag = cipher.getAuthTag();
  await fsp.appendFile(outputPath, tag);

  const stat = await fsp.stat(outputPath);
  return {
    encryptedSize: stat.size,
    fileSha256: await sha256File(outputPath),
    fileMd5: await md5File(outputPath),
    keyVersion: getConfig().tokenKeyVersion
  };
}

async function decryptFile(inputPath, outputPath, options = {}) {
  const stat = await fsp.stat(inputPath);
  if (stat.size < HEADER_BYTES + TAG_BYTES) {
    throw new BackupError('Encrypted backup file is too small or corrupt.', { code: 'CORRUPT_BACKUP' });
  }

  const handle = await fsp.open(inputPath, 'r');
  let header;
  let tag;
  try {
    header = Buffer.alloc(HEADER_BYTES);
    await handle.read(header, 0, HEADER_BYTES, 0);
    tag = Buffer.alloc(TAG_BYTES);
    await handle.read(tag, 0, TAG_BYTES, stat.size - TAG_BYTES);
  } finally {
    await handle.close();
  }

  if (!header.subarray(0, FILE_MAGIC.length).equals(FILE_MAGIC)) {
    throw new BackupError('Unrecognized backup file format.', { code: 'CORRUPT_BACKUP' });
  }

  const iv = header.subarray(FILE_MAGIC.length, HEADER_BYTES);
  const key = getFileKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  try {
    await pipeline(
      fs.createReadStream(inputPath, { start: HEADER_BYTES, end: stat.size - TAG_BYTES - 1 }),
      decipher,
      fs.createWriteStream(outputPath, { mode: 0o600 })
    );
  } catch (err) {
    await fsp.rm(outputPath, { force: true }).catch(() => {});
    throw new BackupError(
      'Backup integrity check failed. The encrypted file is corrupt or the encryption key is wrong.',
      { code: 'BACKUP_INTEGRITY_FAILED' }
    );
  }

  const plaintextSha256 = await sha256File(outputPath);
  if (options.expectedSha256 && plaintextSha256 !== options.expectedSha256) {
    await fsp.rm(outputPath, { force: true }).catch(() => {});
    throw new BackupError('Decrypted backup checksum does not match the recorded manifest.', {
      code: 'BACKUP_CHECKSUM_MISMATCH'
    });
  }

  return { plaintextSha256, size: (await fsp.stat(outputPath)).size };
}

module.exports = {
  FILE_MAGIC,
  parseKey,
  getMasterKey,
  getFileKey,
  encryptSecret,
  decryptSecret,
  hashFile,
  sha256File,
  md5File,
  encryptFile,
  decryptFile
};
