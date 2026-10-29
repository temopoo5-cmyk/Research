require('dotenv').config();

const pool = require('../api/db');
const { ensureBackupSchema, SCHEMA_VERSION } = require('../api/backup/schema');
const { safeErrorMessage } = require('../api/backup/errors');

async function main() {
  await ensureBackupSchema();
  const tables = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE 'backup%'
     ORDER BY table_name`
  );
  console.log(`Backup schema ${SCHEMA_VERSION} is applied.`);
  console.log(`Tables: ${tables.rows.map((row) => row.table_name).join(', ')}`);
}

main()
  .catch((err) => {
    console.error('Backup migration failed:', safeErrorMessage(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
