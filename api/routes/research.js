const express = require('express');
const multer = require('multer');
const pool = require('../db');
const { uploadFile, publicUrl } = require('../storage');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = express.Router();

const SELECT = `
  SELECT r.id::int AS id, r.code, r.title, r.authors, r.adviser,
         r.program_id, r.year,
         r.abstract, r.keywords, r.file_path, r.submitted_by, r.status, r.created_at,
         p.name AS program_name, p.code AS program_code,
         u.full_name AS submitted_by_name
  FROM research r
  LEFT JOIN programs p ON p.id = r.program_id
  LEFT JOIN users u ON u.id = r.submitted_by`;

function whereFromQuery(q, values) {
  const conds = [];
  const push = (cond) => conds.push(cond);

  const reqStatus = q.status || 'approved';
  if (['approved', 'pending', 'rejected'].includes(reqStatus)) { values.push(reqStatus); push(`r.status = $${values.length}`); }

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
    const values = [];
    const where = whereFromQuery(req.query, values);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const total = await pool.query(`SELECT COUNT(*)::int AS total FROM research r${where}`, values);
    values.push(limit, (page - 1) * limit);
    const { rows } = await pool.query(`${SELECT}${where} ORDER BY r.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    res.json({ data: rows, total: total.rows[0].total, page, pages: Math.ceil(total.rows[0].total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  const values = [];
  const conds = [];
  if (req.query.status) { values.push(req.query.status); conds.push(`r.status = $${values.length}`); }
  if (req.query.search) { values.push(`%${req.query.search}%`); conds.push(`(r.title ILIKE $${values.length} OR r.authors ILIKE $${values.length} OR r.code ILIKE $${values.length})`); }
  const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(`${SELECT}${where} ORDER BY r.created_at DESC`, values);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT} WHERE r.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  const { title, authors, adviser, program_id, year, abstract, keywords } = req.body;
  if (!title || !authors || !year) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM research');
    const code = `RS-${new Date().getFullYear()}-${String(count.rows[0].count + 1).padStart(4, '0')}`;
    const filePath = req.file ? await uploadFile(req.file.buffer, req.file.originalname) : null;
    const { rows } = await pool.query(
      `INSERT INTO research (code, title, authors, adviser, program_id, year, abstract, keywords, file_path, submitted_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id::int AS id, code, title, authors, adviser, program_id, year, abstract, keywords, file_path, submitted_by, status, created_at`,
      [code, title, authors, adviser || null, program_id ? parseInt(program_id) : null, parseInt(year), abstract || '', keywords || '', filePath, req.user.id, req.user.role === 'admin' ? 'approved' : 'pending']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM research WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    const cur = existing.rows[0];
    if (req.user.role !== 'admin' && String(cur.submitted_by) !== String(req.user.id)) return res.status(403).json({ error: 'Not authorized' });
    const { title, authors, adviser, program_id, year, abstract, keywords } = req.body;
    const filePath = req.file ? await uploadFile(req.file.buffer, req.file.originalname) : cur.file_path;
    const { rows } = await pool.query(
      `UPDATE research SET title=$1, authors=$2, adviser=$3, program_id=$4, year=$5, abstract=$6, keywords=$7, file_path=$8
       WHERE id=$9 RETURNING id::int AS id, code, title, authors, adviser, program_id, year, abstract, keywords, file_path, submitted_by, status, created_at`,
      [title || cur.title, authors || cur.authors, adviser !== undefined ? adviser : cur.adviser, program_id ? parseInt(program_id) : cur.program_id, year ? parseInt(year) : cur.year, abstract !== undefined ? abstract : cur.abstract, keywords !== undefined ? keywords : cur.keywords, filePath, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'pending', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const updated = await pool.query('UPDATE research SET status = $1 WHERE id = $2 RETURNING id', [status, req.params.id]);
    if (!updated.rows[0]) return res.status(404).json({ error: 'Not found' });
    const { rows } = await pool.query(`${SELECT} WHERE r.id = $1`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
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
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT file_path FROM research WHERE id = $1', [req.params.id]);
    if (!rows[0] || !rows[0].file_path) return res.status(404).json({ error: 'File not found' });
    res.redirect(publicUrl(rows[0].file_path));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;