const { safeFileName } = require('./validation');

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
}

function shortJobId(jobId) {
  return String(jobId || '').replace(/-/g, '').slice(0, 8) || 'unknown';
}

function buildBackupFileName({ kind, at = new Date(), jobId }) {
  const base = kind === 'storage' ? 'researchhub-storage' : 'researchhub-db';
  return safeFileName(`${base}-${timestampForFile(at)}-${shortJobId(jobId)}.dump.enc`);
}

function buildManifestFileName(backupFileName) {
  return safeFileName(`${backupFileName}.manifest.json`);
}

function buildYearArchiveFileName({ year, version = 1 }) {
  const base = version > 1 ? `research-${year}-v${version}` : `research-${year}`;
  return safeFileName(`${base}.json.enc`);
}

module.exports = {
  timestampForFile,
  shortJobId,
  buildBackupFileName,
  buildManifestFileName,
  buildYearArchiveFileName
};
