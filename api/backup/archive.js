const crypto = require('crypto');
const { BackupError } = require('./errors');

const ARCHIVE_KIND = 'research_year';
const ARCHIVE_VERSION = 1;
const ARCHIVE_STATUSES = [
  'queued',
  'archiving',
  'verifying',
  'ready',
  'delete_queued',
  'deleting',
  'completed',
  'restore_queued',
  'restoring',
  'restored',
  'failed'
];

function cutoffYearFor(now = new Date(), afterYears = 5) {
  return now.getUTCFullYear() - Number(afterYears) - 1;
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const keys = Object.keys(value).filter((key) => value[key] !== undefined).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function normalizeAuthorDetails(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
}

function researchRecordHash(research, authorDetails = []) {
  return sha256Text(stableStringify({
    research: research || {},
    authors: normalizeAuthorDetails(authorDetails)
  }));
}

function archiveRecordFromRow(row) {
  const research = row.research && typeof row.research === 'object' ? row.research : {};
  const authorDetails = normalizeAuthorDetails(row.author_details);
  return {
    ...research,
    program_code: row.program_code || null,
    program_name: row.program_name || null,
    submitted_by_username: row.submitted_by_username || null,
    author_details: authorDetails,
    record_sha256: researchRecordHash(research, authorDetails)
  };
}

function researchFromArchiveRecord(record) {
  const research = { ...(record || {}) };
  delete research.program_code;
  delete research.program_name;
  delete research.submitted_by_username;
  delete research.author_details;
  delete research.record_sha256;
  return research;
}

function buildArchivePayload({
  year,
  cutoffYear,
  rows = [],
  database = null,
  serverVersion = null,
  schemaVersion = null,
  createdAt = new Date()
}) {
  const research = rows.map(archiveRecordFromRow);
  const authorLinkCount = research.reduce((total, record) => total + record.author_details.length, 0);
  return {
    app: 'ResearchHub',
    archive_version: ARCHIVE_VERSION,
    kind: ARCHIVE_KIND,
    year: Number(year),
    cutoff_year: Number(cutoffYear),
    created_at: createdAt.toISOString(),
    schema_version: schemaVersion,
    database,
    server_version: serverVersion,
    counts: {
      research: research.length,
      author_links: authorLinkCount
    },
    research
  };
}

function validateArchivePayload(payload, { year = null } = {}) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BackupError('Year archive payload is not a JSON object.', {
      code: 'ARCHIVE_PAYLOAD_INVALID'
    });
  }
  if (payload.app !== 'ResearchHub') errors.push('app');
  if (payload.archive_version !== ARCHIVE_VERSION) errors.push('archive_version');
  if (payload.kind !== ARCHIVE_KIND) errors.push('kind');
  if (!Number.isInteger(Number(payload.year)) || Number(payload.year) < 1900) errors.push('year');
  if (year != null && Number(payload.year) !== Number(year)) errors.push('year_mismatch');
  if (!Array.isArray(payload.research)) errors.push('research');

  const research = Array.isArray(payload.research) ? payload.research : [];
  const recordHashes = {};
  const seenIds = new Set();
  const seenCodes = new Set();
  let authorLinkCount = 0;

  for (let index = 0; index < research.length; index += 1) {
    const record = research[index];
    if (!record || typeof record !== 'object') {
      errors.push(`record_${index}`);
      continue;
    }
    if (!record.id) errors.push(`record_${index}_id`);
    if (!record.code) errors.push(`record_${index}_code`);
    if (record.id != null) {
      const id = String(record.id);
      if (seenIds.has(id)) errors.push(`duplicate_id_${id}`);
      seenIds.add(id);
    }
    if (record.code) {
      const code = String(record.code);
      if (seenCodes.has(code)) errors.push(`duplicate_code_${code}`);
      seenCodes.add(code);
    }
    const authorDetails = normalizeAuthorDetails(record.author_details);
    authorLinkCount += authorDetails.length;
    const expected = researchRecordHash(researchFromArchiveRecord(record), authorDetails);
    if (record.record_sha256 !== expected) errors.push(`record_${index}_hash`);
    if (record.id != null) recordHashes[String(record.id)] = expected;
  }

  const expectedCount = payload.counts && Number(payload.counts.research);
  if (Number.isFinite(expectedCount) && expectedCount !== research.length) errors.push('research_count');
  const expectedLinks = payload.counts && Number(payload.counts.author_links);
  if (Number.isFinite(expectedLinks) && expectedLinks !== authorLinkCount) errors.push('author_link_count');

  if (errors.length) {
    throw new BackupError(`Year archive verification failed: ${errors.slice(0, 8).join(', ')}`, {
      code: 'ARCHIVE_VERIFICATION_FAILED',
      details: { errors }
    });
  }

  return {
    ok: true,
    year: Number(payload.year),
    research_count: research.length,
    author_link_count: authorLinkCount,
    record_hashes: recordHashes,
    verified_at: new Date().toISOString()
  };
}

function recordHashesFromPayload(payload) {
  const hashes = {};
  for (const record of payload.research || []) {
    if (record && record.id != null) {
      hashes[String(record.id)] = record.record_sha256 || null;
    }
  }
  return hashes;
}

function compareRecordHashes(expected = {}, actual = {}) {
  const missing = [];
  const extra = [];
  const changed = [];
  for (const [id, hash] of Object.entries(expected || {})) {
    if (!(id in (actual || {}))) missing.push(id);
    else if ((actual || {})[id] !== hash) changed.push(id);
  }
  for (const id of Object.keys(actual || {})) {
    if (!(id in (expected || {}))) extra.push(id);
  }
  return {
    ok: missing.length === 0 && extra.length === 0 && changed.length === 0,
    missing,
    extra,
    changed
  };
}

module.exports = {
  ARCHIVE_KIND,
  ARCHIVE_VERSION,
  ARCHIVE_STATUSES,
  cutoffYearFor,
  sha256Text,
  stableStringify,
  normalizeAuthorDetails,
  researchRecordHash,
  archiveRecordFromRow,
  researchFromArchiveRecord,
  buildArchivePayload,
  validateArchivePayload,
  recordHashesFromPayload,
  compareRecordHashes
};
