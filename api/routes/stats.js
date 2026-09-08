const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const r1 = await pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'approved')::int AS approved, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending, COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected FROM research");
    const r2 = await pool.query('SELECT COUNT(*)::int AS users FROM users');
    const r3 = await pool.query('SELECT COUNT(*)::int AS programs FROM programs');
    const r4 = await pool.query('SELECT COUNT(*)::int AS categories FROM categories');
    const r5 = await pool.query('SELECT research_type, COUNT(*)::int AS count FROM research GROUP BY research_type ORDER BY count DESC');
    const r6 = await pool.query('SELECT year, COUNT(*)::int AS count FROM research GROUP BY year ORDER BY year DESC LIMIT 10');
    res.json({
      total: r1.rows[0].total, approved: r1.rows[0].approved, pending: r1.rows[0].pending, rejected: r1.rows[0].rejected,
      users: r2.rows[0].users, programs: r3.rows[0].programs, categories: r4.rows[0].categories,
      byType: r5.rows.map(r => ({ research_type: r.research_type, count: r.count })),
      byYear: r6.rows.map(r => ({ year: r.year, count: r.count }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;