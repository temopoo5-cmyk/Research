const test = require('node:test');
const assert = require('node:assert/strict');
const {
  cutoffYearFor,
  buildArchivePayload,
  validateArchivePayload,
  recordHashesFromPayload,
  compareRecordHashes,
  researchRecordHash
} = require('../api/backup/archive');
const {
  computeNextArchiveRunAt,
  validateSettingsInput,
  validateArchiveConfirmation,
  validateArchiveDeleteConfirmation,
  validateArchiveRestoreConfirmation,
  intInRange
} = require('../api/backup/validation');
const { buildYearArchiveFileName } = require('../api/backup/naming');

const currentSettings = {
  archive_enabled: false,
  archive_after_years: 5,
  archive_month: 1,
  archive_day: 1,
  archive_hour_utc: 3
};

function sampleRow() {
  return {
    research: {
      id: '1',
      code: 'RS-2020-0001',
      title: 'Sample research',
      authors: 'Ada Lovelace',
      adviser: 'Grace Hopper',
      program_id: '1',
      year: 2020,
      abstract: 'Abstract',
      keywords: 'testing',
      submitted_by: '1',
      status: 'approved',
      is_featured: false,
      created_at: '2020-01-01T00:00:00.000Z'
    },
    program_code: 'BSBA',
    program_name: 'Business Administration',
    submitted_by_username: 'admin',
    author_details: [{
      author_id: '10',
      name: 'Ada Lovelace',
      email: null,
      affiliation: null,
      orcid: null,
      author_order: 1,
      is_corresponding: false
    }]
  };
}

test('yearly archive cutoff keeps the current year plus previous years', () => {
  const now = new Date('2026-10-29T03:00:00.000Z');
  assert.equal(cutoffYearFor(now, 5), 2020);
  assert.equal(cutoffYearFor(now, 1), 2024);
});

test('yearly archive schedule runs once per year in UTC', () => {
  const from = new Date('2026-10-29T03:00:00.000Z');
  assert.equal(computeNextArchiveRunAt(currentSettings, from).toISOString(), '2027-01-01T03:00:00.000Z');
  assert.equal(
    computeNextArchiveRunAt({ ...currentSettings, archive_month: 12, archive_day: 15, archive_hour_utc: 4 }, from).toISOString(),
    '2026-12-15T04:00:00.000Z'
  );
});

test('archive settings and confirmations are validated', () => {
  const merged = validateSettingsInput({
    archive_enabled: true,
    archive_after_years: 5,
    archive_month: 1,
    archive_day: 1,
    archive_hour_utc: 3
  }, currentSettings);
  assert.equal(merged.archive_enabled, true);
  assert.equal(merged.archive_after_years, 5);
  assert.throws(() => validateSettingsInput({ archive_day: 29 }, currentSettings), /between 1 and 28/);
  assert.throws(() => validateSettingsInput({ archive_month: 13 }, currentSettings), /between 1 and 12/);
  assert.equal(validateArchiveConfirmation('ARCHIVE'), true);
  assert.throws(() => validateArchiveConfirmation('archive'), /Type ARCHIVE/);
  assert.equal(validateArchiveDeleteConfirmation('DELETE-YEAR 2020', 2020), true);
  assert.throws(() => validateArchiveDeleteConfirmation('DELETE-YEAR 2019', 2020), /DELETE-YEAR 2020/);
  assert.equal(validateArchiveRestoreConfirmation('RESTORE-YEAR 2020', 2020), true);
  assert.throws(() => validateArchiveRestoreConfirmation('RESTORE', 2020), /RESTORE-YEAR 2020/);
  assert.equal(intInRange('2020', 1900, 2026, 'year'), 2020);
});

test('archive payload hashing verifies records and detects tampering', () => {
  const payload = buildArchivePayload({
    year: 2020,
    cutoffYear: 2020,
    rows: [sampleRow()],
    schemaVersion: 'test',
    createdAt: new Date('2026-10-29T03:00:00.000Z')
  });
  const checked = validateArchivePayload(payload, { year: 2020 });
  assert.equal(checked.research_count, 1);
  assert.equal(checked.author_link_count, 1);
  assert.equal(payload.research[0].record_sha256, researchRecordHash(sampleRow().research, sampleRow().author_details));

  const tampered = JSON.parse(JSON.stringify(payload));
  tampered.research[0].title = 'Changed title';
  assert.throws(() => validateArchivePayload(tampered, { year: 2020 }), /verification failed/);
});

test('archive record hashes identify missing, extra, and changed records', () => {
  const payload = buildArchivePayload({ year: 2020, cutoffYear: 2020, rows: [sampleRow()] });
  const hashes = recordHashesFromPayload(payload);
  assert.equal(compareRecordHashes(hashes, hashes).ok, true);
  assert.equal(compareRecordHashes(hashes, {}).missing.length, 1);
  assert.equal(compareRecordHashes({}, hashes).extra.length, 1);
  assert.equal(compareRecordHashes(hashes, { 1: 'different' }).changed.length, 1);
});

test('yearly archive filenames are versioned', () => {
  assert.equal(buildYearArchiveFileName({ year: 2020 }), 'research-2020.json.enc');
  assert.equal(buildYearArchiveFileName({ year: 2020, version: 2 }), 'research-2020-v2.json.enc');
});
