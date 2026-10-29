require('dotenv').config();

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const pool = require('../api/db');
const store = require('../api/backup/store');
const { ensureBackupSchema } = require('../api/backup/schema');
const { getDriveContext, downloadToFile } = require('../api/backup/drive');
const { decryptFile, sha256File } = require('../api/backup/crypto');
const { safeFileName, isUuid } = require('../api/backup/validation');
const { safeErrorMessage } = require('../api/backup/errors');

async function main() {
  const backupId = process.argv[2];
  if (!isUuid(backupId)) {
    console.error('Usage: node scripts/backup-download.js <backup-uuid> [output-file]');
    process.exitCode = 1;
    return;
  }
  await ensureBackupSchema();
  const backup = await store.getBackupById(backupId);
  if (!backup || backup.status !== 'completed' || !backup.drive_file_id) {
    throw new Error('Backup not found or not completed.');
  }

  const output = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.resolve(process.cwd(), safeFileName(backup.file_name.replace(/\.enc$/, '')));
  const encryptedPath = `${output}.enc`;
  const ctx = await getDriveContext();

  try {
    console.log(`Downloading backup ${backup.id} (${backup.file_name})...`);
    const downloaded = await downloadToFile({
      ctx,
      fileId: backup.drive_file_id,
      destination: encryptedPath,
      expectedSize: backup.encrypted_size
    });
    if (backup.file_sha256 && downloaded.sha256 !== backup.file_sha256) {
      throw new Error('Downloaded checksum does not match the backup record.');
    }
    await decryptFile(encryptedPath, output, { expectedSha256: backup.content_sha256 || undefined });
    const stat = await fsp.stat(output);
    console.log(JSON.stringify({
      backup_id: backup.id,
      kind: backup.kind,
      output,
      size: stat.size,
      sha256: await sha256File(output)
    }, null, 2));
  } finally {
    await fsp.rm(encryptedPath, { force: true }).catch(() => {});
    if (fs.existsSync(encryptedPath)) fs.unlinkSync(encryptedPath);
  }
}

main()
  .catch((err) => {
    console.error('Backup download failed:', safeErrorMessage(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
