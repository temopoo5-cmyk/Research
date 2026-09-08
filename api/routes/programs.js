const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id::int AS id, name, code, created_at FROM programs ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
  try {
    const dup = await pool.query('SELECT 1 FROM programs WHERE name = $1 OR code = $2', [name, code]);
    if (dup.rows[0]) return res.status(409).json({ error: 'Program already exists' });
    const { rows } = await pool.query('INSERT INTO programs (name, code) VALUES ($1, $2) RETURNING id::int AS id, name, code, created_at', [name, code]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, code } = req.body;
  try {
    const { rows } = await pool.query('UPDATE programs SET name = $1, code = $2 WHERE id = $3 RETURNING id::int AS id, name, code, created_at', [name, code, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM programs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;