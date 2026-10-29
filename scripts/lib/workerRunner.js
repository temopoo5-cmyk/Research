const crypto = require('crypto');
const store = require('../../api/backup/store');
const { processJob } = require('./backupService');
const { notifyBackupFailure } = require('../../api/backup/notifications');
const { safeErrorMessage } = require('../../api/backup/errors');
const { ensureBackupSchema, SCHEMA_VERSION } = require('../../api/backup/schema');

function workerVersion() {
  try {
    return require('../../package.json').version || '1.0.0';
  } catch (_) {
    return '1.0.0';
  }
}

function log(message, meta = {}) {
  const suffix = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  console.log(`[backup-worker] ${message}${suffix}`);
}

async function markValidationFailedForJob(job, error) {
  if (job.kind !== 'restore_validation') return;
  try {
    const validation = await store.getRestoreValidationByJob(job.id);
    if (validation && ['queued', 'running'].includes(validation.status)) {
      await store.updateRestoreValidation(validation.id, {
        status: 'failed',
        error_message: safeErrorMessage(error),
        finished_at: new Date()
      });
    }
  } catch (_) {
    // The job failure is already recorded; validation bookkeeping is best effort.
  }
}

async function runWorker({ maxJobs = 1, schedule = false, validateBackupId = null, staleMinutes = 180 } = {}) {
  await ensureBackupSchema();
  const workerId = process.env.BACKUP_WORKER_ID || crypto.randomUUID();
  const summary = {
    worker_id: workerId,
    schema_version: SCHEMA_VERSION,
    scheduled: null,
    requeued_stale: 0,
    completed: 0,
    failed: 0,
    jobs: []
  };

  await store.upsertWorkerHeartbeat({ workerId, version: workerVersion() });

  if (schedule) {
    try {
      summary.scheduled = await store.enqueueScheduledJobs();
      if (summary.scheduled.warning) {
        log('scheduled backup warning', { warning: summary.scheduled.warning });
        await store.logAudit({
          action: 'backup.scheduled.skipped',
          targetType: 'settings',
          targetId: '1',
          details: {
            reason: summary.scheduled.reason || 'warning',
            warning: summary.scheduled.warning
          }
        });
      }
    } catch (err) {
      summary.scheduled = { error: safeErrorMessage(err) };
      log('scheduled backup enqueue failed', { error: safeErrorMessage(err) });
    }
  }

  if (validateBackupId) {
    try {
      const queued = await store.enqueueRestoreValidation({
        backupId: validateBackupId,
        requestedBy: null,
        confirmationNote: 'CLI restore validation'
      });
      summary.validation_enqueued = queued.validation.id;
    } catch (err) {
      summary.validation_enqueue_error = safeErrorMessage(err);
      log('restore validation enqueue failed', { error: safeErrorMessage(err) });
    }
  }

  try {
    const stale = await store.requeueStaleJobs(staleMinutes);
    summary.requeued_stale = stale.length;
    if (stale.length) log('requeued stale jobs', { count: stale.length });
  } catch (err) {
    log('stale job check failed', { error: safeErrorMessage(err) });
  }

  const limit = Number.isFinite(maxJobs) ? Math.max(1, maxJobs) : Number.MAX_SAFE_INTEGER;
  for (let index = 0; index < limit; index += 1) {
    const job = await store.claimNextJob(workerId);
    if (!job) break;

    const startedAt = Date.now();
    log('job started', { id: job.id, kind: job.kind, attempt: job.attempt });
    await store.upsertWorkerHeartbeat({ workerId, version: workerVersion() });

    try {
      const result = await processJob(job);
      const completedJob = await store.completeJob(job.id, job.lock_token);
      if (!completedJob) {
        log('job completed locally but lock was lost', { id: job.id });
      }
      summary.completed += 1;
      summary.jobs.push({
        id: job.id,
        kind: job.kind,
        status: 'completed',
        skipped: Boolean(result && result.skipped),
        backup_id: result && result.backup ? result.backup.id : null,
        duration_ms: Date.now() - startedAt
      });
      await store.logAudit({
        action: 'backup.job.completed',
        targetType: 'job',
        targetId: job.id,
        details: {
          kind: job.kind,
          trigger: job.trigger_type,
          attempt: job.attempt,
          duration_ms: Date.now() - startedAt
        }
      });
      log('job completed', { id: job.id, kind: job.kind, duration_ms: Date.now() - startedAt });
    } catch (err) {
      const message = safeErrorMessage(err);
      const failure = await store.failJob({
        jobId: job.id,
        lockToken: job.lock_token,
        error: err,
        retry: true
      });
      summary.failed += 1;
      summary.jobs.push({
        id: job.id,
        kind: job.kind,
        status: failure && failure.retryScheduled ? 'retry_scheduled' : 'failed',
        error: message,
        duration_ms: Date.now() - startedAt
      });
      if (!failure || !failure.retryScheduled) {
        await markValidationFailedForJob(job, err);
      }
      log('job failed', {
        id: job.id,
        kind: job.kind,
        retry_scheduled: Boolean(failure && failure.retryScheduled),
        error: message
      });

      if (!failure || !failure.retryScheduled) {
        await store.logAudit({
          action: 'backup.job.failed',
          targetType: 'job',
          targetId: job.id,
          details: {
            kind: job.kind,
            trigger: job.trigger_type,
            attempt: job.attempt,
            error: message
          }
        });
        await notifyBackupFailure({
          jobId: job.id,
          kind: job.kind,
          error: err,
          attempt: job.attempt,
          maxAttempts: job.max_attempts
        });
      }
    } finally {
      await store.upsertWorkerHeartbeat({ workerId, version: workerVersion() }).catch(() => {});
    }
  }

  return summary;
}

module.exports = { runWorker, workerVersion };
