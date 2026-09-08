const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id::int AS id, username, full_name, role, created_at FROM users ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (!username || !password || !full_name) return res.status(400).json({ error: 'All fields required' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Username exists' });
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query('INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id::int AS id, username, full_name, role', [username, hash, full_name, role || 'user']);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { full_name, role, password } = req.body;
  try {
    const values = [full_name, role, req.params.id];
    let sql = 'UPDATE users SET full_name = $1, role = $2';
    if (password) { sql += ', password = $3'; values.push(bcrypt.hashSync(password, 10)); }
    sql += ' WHERE id = $' + values.length;
    values.push(req.params.id);
    sql += ' RETURNING id::int AS id, username, full_name, role';
    const { rows } = await pool.query(sql, values);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;