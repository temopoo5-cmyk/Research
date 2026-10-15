const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const SELECT_FIELDS = `r.id::int AS id, r.code, r.title, r.authors, r.adviser,
         r.program_id, r.year,
         r.abstract, r.keywords, r.submitted_by, r.status, r.created_at`;

const SELECT_FROM = `p.name AS program_name, p.code AS program_code,
         u.full_name AS submitted_by_name,
         COALESCE(
           json_agg(
             json_build_object(
               'id', a.id,
               'name', a.name,
               'email', a.email,
               'affiliation', a.affiliation,
               'orcid', a.orcid,
               'author_order', ra.author_order,
               'is_corresponding', ra.is_corresponding
             )
           ) FILTER (WHERE a.id IS NOT NULL),
           '[]'
         ) AS author_details
   FROM research r
   LEFT JOIN programs p ON p.id = r.program_id
   LEFT JOIN users u ON u.id = r.submitted_by
   LEFT JOIN research_authors ra ON ra.research_id = r.id
   LEFT JOIN authors a ON a.id = ra.author_id`;

const GROUP_BY = `GROUP BY r.id, p.name, p.code, u.full_name`;

let featuredSupported = true;

async function loadSchema() {
  if (featuredSupported !== undefined) return;
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
  } catch (err) {
    console.error('[api/research] is_featured column check failed, assuming column exists:', err && err.message ? err.message : err);
    featuredSupported = true;
  }
}

async function getSelect() {
  await loadSchema();
  const featuredField = featuredSupported
    ? 'COALESCE(r.is_featured, false) AS is_featured'
    : 'false AS is_featured';
  return {
    fields: `SELECT ${SELECT_FIELDS}, ${featuredField}, ${SELECT_FROM}`,
    groupBy: GROUP_BY
  };
}

const TRUTHY = ['1', 'true', 'yes', 'on'];

function whereFromQuery(q, values, withFeatured = true) {
  const conds = [];
  const push = (cond) => conds.push(cond);

  const reqStatus = q.status || 'approved';
  if (reqStatus === 'all') {
    // No status filter - show all
  } else if (['approved', 'pending', 'rejected'].includes(reqStatus)) { values.push(reqStatus); push(`r.status = $${values.length}`); }
  else { values.push('approved'); push(`r.status = $${values.length}`); }

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
    console.log('[api/research] query:', { where, values, featuredSupported, query: req.query });
    const total = await pool.query(`SELECT COUNT(*)::int AS total FROM research r${where}`, values);
    values.push(limit, (page - 1) * limit);
    const { rows } = await pool.query(`${SELECT.fields}${where} ${SELECT.groupBy} ORDER BY r.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    res.json({ data: rows, total: total.rows[0].total, page, pages: Math.ceil(total.rows[0].total / limit) });
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err, err && err.stack ? err.stack : '');
    res.status(500).json({ error: 'Server error', detail: err && err.message ? err.message : String(err) });
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
    const { rows } = await pool.query(`${SELECT.fields}${where} ${SELECT.groupBy} ORDER BY r.created_at DESC`, values);
    res.json(rows);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const SELECT = await getSelect();
    const { rows } = await pool.query(`${SELECT.fields} WHERE r.id = $1 ${SELECT.groupBy}`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, authors, author_ids, adviser, program_id, year, abstract, keywords } = req.body;
  if (!title || (!authors && !author_ids) || !year) return res.status(400).json({ error: 'Required fields missing' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const count = await client.query('SELECT COUNT(*)::int AS count FROM research');
    const code = `RS-${new Date().getFullYear()}-${String(count.rows[0].count + 1).padStart(4, '0')}`;
    const { rows } = await client.query(
      `INSERT INTO research (code, title, authors, adviser, program_id, year, abstract, keywords, submitted_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id::int AS id, code, title, authors, adviser, program_id, year, abstract, keywords, submitted_by, status, created_at`,
      [code, title, authors, adviser || null, program_id ? parseInt(program_id) : null, parseInt(year), abstract || '', keywords || '', req.user.id, req.user.role === 'admin' ? 'approved' : 'pending']
    );
    const research = rows[0];
    
    // Handle author associations
    if (author_ids && Array.isArray(author_ids) && author_ids.length > 0) {
      for (let i = 0; i < author_ids.length; i++) {
        await client.query(
          `INSERT INTO research_authors (research_id, author_id, author_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (research_id, author_id) DO NOTHING`,
          [research.id, author_ids[i], i + 1]
        );
      }
    } else if (authors) {
      // Legacy: create/update authors from comma-separated string
      const authorNames = authors.split(',').map(n => n.trim()).filter(n => n);
      for (let i = 0; i < authorNames.length; i++) {
        const authorResult = await client.query(
          `INSERT INTO authors (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [authorNames[i]]
        );
        await client.query(
          `INSERT INTO research_authors (research_id, author_id, author_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (research_id, author_id) DO NOTHING`,
          [research.id, authorResult.rows[0].id, i + 1]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Return with author details
    const SELECT = await getSelect();
    const { rows: finalRows } = await client.query(`${SELECT} WHERE r.id = $1`, [research.id]);
    res.json(finalRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { title, authors, author_ids, adviser, program_id, year, abstract, keywords } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM research WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    const cur = existing.rows[0];
    if (req.user.role !== 'admin' && String(cur.submitted_by) !== String(req.user.id)) return res.status(403).json({ error: 'Not authorized' });

    const { rows } = await client.query(
      `UPDATE research SET title=$1, authors=$2, adviser=$3, program_id=$4, year=$5, abstract=$6, keywords=$7
       WHERE id=$8 RETURNING id::int AS id, code, title, authors, adviser, program_id, year, abstract, keywords, submitted_by, status, created_at`,
      [title || cur.title, authors || cur.authors, adviser !== undefined ? adviser : cur.adviser, program_id ? parseInt(program_id) : cur.program_id, year ? parseInt(year) : cur.year, abstract !== undefined ? abstract : cur.abstract, keywords !== undefined ? keywords : cur.keywords, req.params.id]
    );
    const research = rows[0];

    // Handle author associations if provided
    if (author_ids && Array.isArray(author_ids)) {
      // Remove existing associations
      await client.query('DELETE FROM research_authors WHERE research_id = $1', [research.id]);
      // Add new associations
      for (let i = 0; i < author_ids.length; i++) {
        await client.query(
          `INSERT INTO research_authors (research_id, author_id, author_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (research_id, author_id) DO NOTHING`,
          [research.id, author_ids[i], i + 1]
        );
      }
    } else if (authors !== undefined && authors !== cur.authors) {
      // Legacy: update from comma-separated string
      await client.query('DELETE FROM research_authors WHERE research_id = $1', [research.id]);
      const authorNames = authors.split(',').map(n => n.trim()).filter(n => n);
      for (let i = 0; i < authorNames.length; i++) {
        const authorResult = await client.query(
          `INSERT INTO authors (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [authorNames[i]]
        );
        await client.query(
          `INSERT INTO research_authors (research_id, author_id, author_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (research_id, author_id) DO NOTHING`,
          [research.id, authorResult.rows[0].id, i + 1]
        );
      }
    }

    await client.query('COMMIT');
    
    // Return with author details
    const SELECT = await getSelect();
    const { rows: finalRows } = await client.query(`${SELECT} WHERE r.id = $1`, [research.id]);
    res.json(finalRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
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
    await pool.query('DELETE FROM research_authors WHERE research_id = $1', [req.params.id]);
    await pool.query('DELETE FROM research WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[api/research] request failed:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;