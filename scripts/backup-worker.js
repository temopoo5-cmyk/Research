require('dotenv').config();

const pool = require('../api/db');
const { runWorker } = require('./lib/workerRunner');
const { safeErrorMessage } = require('../api/backup/errors');

function parseArgs(argv) {
  const args = { maxJobs: Number(process.env.BACKUP_WORKER_MAX_JOBS || 1), schedule: false, validate: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--schedule') args.schedule = true;
    else if (value === '--drain') args.maxJobs = Infinity;
    else if (value === '--once') args.maxJobs = 1;
    else if (value === '--validate') {
      args.validate = argv[index + 1];
      index += 1;
    } else if (value.startsWith('--max-jobs=')) {
      args.maxJobs = Number(value.split('=')[1]);
    }
  }
  if (Number.isNaN(args.maxJobs)) args.maxJobs = 1;
  if (args.maxJobs < 1) args.maxJobs = 1;
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await runWorker({
    maxJobs: args.maxJobs,
    schedule: args.schedule,
    validateBackupId: args.validate
  });
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error('[backup-worker] fatal:', safeErrorMessage(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
