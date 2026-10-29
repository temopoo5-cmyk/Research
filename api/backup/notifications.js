const { getConfig } = require('./config');
const { safeErrorMessage } = require('./errors');

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch (_) {
    return false;
  }
}

async function postJson(url, token, payload) {
  if (!url || !isAllowedUrl(url)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    return response.ok;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function notifyBackupEvent(event, details = {}) {
  const config = getConfig();
  if (!config.alertWebhookUrl) return false;
  return postJson(config.alertWebhookUrl, config.alertWebhookToken, {
    event,
    app: 'ResearchHub',
    at: new Date().toISOString(),
    ...details
  });
}

async function notifyBackupFailure({ jobId, kind, error, attempt, maxAttempts }) {
  return notifyBackupEvent('backup.failed', {
    job_id: jobId,
    kind,
    attempt,
    max_attempts: maxAttempts,
    error: safeErrorMessage(error)
  });
}

async function triggerWorkerWebhook() {
  const config = getConfig();
  if (!config.triggerWebhookUrl) return false;
  return postJson(config.triggerWebhookUrl, config.triggerWebhookToken, {
    event: 'backup.worker.trigger',
    app: 'ResearchHub',
    at: new Date().toISOString()
  });
}

module.exports = { notifyBackupEvent, notifyBackupFailure, triggerWorkerWebhook };
