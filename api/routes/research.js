const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const SELECT_FIELDS = `r.id::int AS id, r.code, r.title, r.authors, r.adviser,
         r.program_id, r.year,
         r.abstract, r.keywords, r.submitted_by, r.status, r.created_at`;

const SELECT_TAIL = `p.name AS program_name, p.code AS program_code,
         u.full_name AS submitted_by_name
  FROM research r
  LEFT JOIN programs p ON p.id = r.program_id
  LEFT JOIN users u ON u.id = r.submitted_by`;

let featuredSupported = false;
let migrationAttempted = false;

// The is_featured column arrived in a later migration than the rest of the schema.
// Probe for it and, if it is missing, apply the idempotent migration so the
// admin-curated featured shelf works without a manual database step. If the
// database user lacks DDL rights the probe keeps returning false and the featured
// shelf stays empty rather than failing every research query with a 500.
async function loadSchema() {
  if (featuredSupported) return;
  try {
    const r = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'research'
           AND column_name = 'is_featured'
       ) AS present`
    );
    featuredSupported = Boolean(r.rows[0] && r.rows[0].present);
    if (!featuredSupported && !migrationAttempted) {
      migrationAttempted = true;
      await pool.query('ALTER TABLE research ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_research_featured ON research (is_featured) WHERE is_featured');
      featuredSupported = true;
    }
  } catch (err) {
    console.error('[api/research] is_featured migration failed:', err && err.message ? err.message : err);
    featuredSupported = false;
  }
}

async function getSelect() {
  await loadSchema();
  const featuredField = featuredSupported
    ? 'COALESCE(r.is_featured, false) AS is_featured'
    : 'false AS is_featured';
  return `
  SELECT ${SELECT_FIELDS},
         ${featuredField},
         ${SELECT_TAIL}`;
}

const TRUTHY = ['1', 'true', 'yes', 'on'];

function whereFromQuery(q, values, withFeatured = true) {
  const conds = [];
  const push = (cond) => conds.push(cond);

  const reqStatus = q.status || 'approved';
  if (['approved', 'pending', 'rejected'].includes(reqStatus)) { values.push(reqStatus); push(`r.status = $${values.length}`); }

  if (TRUTHY.includes(String(q.featured).toLowerCase())) {
    // Without the column nothing can be featured, so return an honest empty
    // set instead of silently dropping the filter and labelling every row.
    if (withFeatured) push('COALESCE(r.is_featured, false) = true');
    else push('FALSE');
  }
  if (q.search) { values.push(`%${q.search}%`); push(`(r.title ILIKE $${values.length} OR r.authors ILIKE $${values.length} OR r.code ILIKE $${values.length} OR r.keywords ILIKE $${values.length} OR r.abstract ILIKE $${values.length})`); }
  if (q.code) { values.push(`%${q.code}%`); push(`r.code ILIKE $${values.length}`); }
  if (q.title) { values.push(`%${q.title}%`); push(`r.title ILIKE $${values.length}`); }
  if (q.author) { values.push(`%${q.author}%`); push(`r.authors ILIKE $${values.length}`); }
  if (q.program) { values.push(q.program); push(`r.program_id = (SELECT id FROM programs WHERE code = $${values.length})`); }
  if (q.year) { values.push(parseInt(q.year)); push(`r.year = $${values.length}`); }

  return conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
}

router.get('/', async (req, res) => {
  try {
    const SELECT = await getSelect();
    const values = [];
    const where = whereFromQuery(req.query, values, featuredSupported);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const total = await pool.query(`SELECT COUNT(*)::int AS total FROM research r${where}`, values);
    values.push(limit, (page - 1) * limit);
    const { rows } = await pool.query(`${SELECT}${where} ORDER BY r.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    res.json({ data: rows, total: total.rows[0].total, page, pages: Math.ceil(total.rows[0].total / limit) });
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  const values = [];
  const conds = [];
  if (req.query.status) { values.push(req.query.status); conds.push(`r.status = $${values.length}`); }
  if (req.query.search) { values.push(`%${req.query.search}%`); conds.push(`(r.title ILIKE $${values.length} OR r.authors ILIKE $${values.length} OR r.code ILIKE $${values.length})`); }
  try {
    const SELECT = await getSelect();
    if (TRUTHY.includes(String(req.query.featured).toLowerCase())) {
      if (featuredSupported) conds.push('COALESCE(r.is_featured, false) = true');
      else conds.push('FALSE');
    }
    const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(`${SELECT}${where} ORDER BY r.created_at DESC`, values);
    res.json(rows);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const SELECT = await getSelect();
    const { rows } = await pool.query(`${SELECT} WHERE r.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, authors, adviser, program_id, year, abstract, keywords } = req.body;
  if (!title || !authors || !year) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM research');
    const code = `RS-${new Date().getFullYear()}-${String(count.rows[0].count + 1).padStart(4, '0')}`;
    const { rows } = await pool.query(
      `INSERT INTO research (code, title, authors, adviser, program_id, year, abstract, keywords, submitted_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id::int AS id, code, title, authors, adviser, program_id, year, abstract, keywords, submitted_by, status, created_at`,
      [code, title, authors, adviser || null, program_id ? parseInt(program_id) : null, parseInt(year), abstract || '', keywords || '', req.user.id, req.user.role === 'admin' ? 'approved' : 'pending']
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM research WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    const cur = existing.rows[0];
    if (req.user.role !== 'admin' && String(cur.submitted_by) !== String(req.user.id)) return res.status(403).json({ error: 'Not authorized' });
    const { title, authors, adviser, program_id, year, abstract, keywords } = req.body;
    const { rows } = await pool.query(
      `UPDATE research SET title=$1, authors=$2, adviser=$3, program_id=$4, year=$5, abstract=$6, keywords=$7
       WHERE id=$8 RETURNING id::int AS id, code, title, authors, adviser, program_id, year, abstract, keywords, submitted_by, status, created_at`,
      [title || cur.title, authors || cur.authors, adviser !== undefined ? adviser : cur.adviser, program_id ? parseInt(program_id) : cur.program_id, year ? parseInt(year) : cur.year, abstract !== undefined ? abstract : cur.abstract, keywords !== undefined ? keywords : cur.keywords, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'pending', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const updated = await pool.query('UPDATE research SET status = $1 WHERE id = $2 RETURNING id', [status, req.params.id]);
    if (!updated.rows[0]) return res.status(404).json({ error: 'Not found' });
    const SELECT = await getSelect();
    const { rows } = await pool.query(`${SELECT} WHERE r.id = $1`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/featured', authenticateToken, requireAdmin, async (req, res) => {
  const featured = req.body.is_featured;
  const next = typeof featured === 'string' ? TRUTHY.includes(featured.toLowerCase()) : Boolean(featured);
  try {
    const SELECT = await getSelect();
    if (!featuredSupported) {
      return res.status(409).json({ error: 'Featured books are unavailable until the is_featured migration is applied' });
    }
    const updated = await pool.query('UPDATE research SET is_featured = $1 WHERE id = $2 RETURNING id', [next, req.params.id]);
    if (!updated.rows[0]) return res.status(404).json({ error: 'Not found' });
    const { rows } = await pool.query(`${SELECT} WHERE r.id = $1`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM research WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    const cur = existing.rows[0];
    if (req.user.role !== 'admin' && String(cur.submitted_by) !== String(req.user.id)) return res.status(403).json({ error: 'Not authorized' });
    await pool.query('DELETE FROM research WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;