const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, limit = 50, page = 1, sort = 'name' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, 
        COUNT(ra.research_id) as publication_count,
        COUNT(ra.research_id) FILTER (WHERE r.status = 'approved') as approved_count
      FROM authors a
      LEFT JOIN research_authors ra ON a.id = ra.author_id
      LEFT JOIN research r ON ra.research_id = r.id
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` WHERE a.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY a.id`;

    if (sort === 'publications') {
      query += ` ORDER BY publication_count DESC, a.name`;
    } else if (sort === 'recent') {
      query += ` ORDER BY a.created_at DESC`;
    } else {
      query += ` ORDER BY a.name`;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    const countQuery = search
      ? 'SELECT COUNT(*) FROM authors WHERE name ILIKE $1'
      : 'SELECT COUNT(*) FROM authors';
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        affiliation: r.affiliation,
        orcid: r.orcid,
        publication_count: parseInt(r.publication_count),
        approved_count: parseInt(r.approved_count),
        created_at: r.created_at,
        updated_at: r.updated_at
      })),
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    console.error('[api/authors] list failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const authorResult = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);
    if (!authorResult.rows[0]) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const author = authorResult.rows[0];

    const researchResult = await pool.query(`
      SELECT r.*, p.code as program_code, p.name as program_name
      FROM research r
      JOIN research_authors ra ON r.id = ra.research_id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE ra.author_id = $1
      ORDER BY r.year DESC, r.created_at DESC
    `, [id]);

    res.json({
      ...author,
      publication_count: researchResult.rows.length,
      approved_count: researchResult.rows.filter(r => r.status === 'approved').length,
      research: researchResult.rows
    });
  } catch (err) {
    console.error('[api/authors] get failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, affiliation, orcid } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Author name is required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO authors (name, email, affiliation, orcid)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, authors.email),
         affiliation = COALESCE(EXCLUDED.affiliation, authors.affiliation),
         orcid = COALESCE(EXCLUDED.orcid, authors.orcid),
         updated_at = now()
       RETURNING *`,
      [name.trim(), email?.trim() || null, affiliation?.trim() || null, orcid?.trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[api/authors] create failed:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Author already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, affiliation, orcid } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE authors SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         affiliation = COALESCE($3, affiliation),
         orcid = COALESCE($4, orcid),
         updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [name?.trim() || null, email?.trim() || null, affiliation?.trim() || null, orcid?.trim() || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Author not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[api/authors] update failed:', err.message);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Author name already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const researchCount = await pool.query('SELECT COUNT(*) FROM research_authors WHERE author_id = $1', [id]);
    if (parseInt(researchCount.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete author with associated research. Remove associations first.' });
    }
    const { rowCount } = await pool.query('DELETE FROM authors WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Author not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[api/authors] delete failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_publications,
        COUNT(*) FILTER (WHERE r.status = 'approved') as approved,
        COUNT(*) FILTER (WHERE r.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE r.status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE r.status = 'draft') as draft,
        COUNT(DISTINCT r.program_id) as programs_count,
        COUNT(DISTINCT r.year) as years_active,
        MIN(r.year) as first_year,
        MAX(r.year) as latest_year
      FROM research r
      JOIN research_authors ra ON r.id = ra.research_id
      WHERE ra.author_id = $1
    `, [id]);

    const byYearResult = await pool.query(`
      SELECT r.year, COUNT(*) as count
      FROM research r
      JOIN research_authors ra ON r.id = ra.research_id
      WHERE ra.author_id = $1
      GROUP BY r.year
      ORDER BY r.year DESC
    `, [id]);

    const byProgramResult = await pool.query(`
      SELECT p.name, p.code, COUNT(*) as count
      FROM research r
      JOIN research_authors ra ON r.id = ra.research_id
      LEFT JOIN programs p ON r.program_id = p.id
      WHERE ra.author_id = $1
      GROUP BY p.id, p.name, p.code
      ORDER BY count DESC
    `, [id]);

    res.json({
      ...statsResult.rows[0],
      by_year: byYearResult.rows,
      by_program: byProgramResult.rows
    });
  } catch (err) {
    console.error('[api/authors] stats failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/bulk-create', async (req, res) => {
  const { authors } = req.body;
  if (!Array.isArray(authors) || authors.length === 0) {
    return res.status(400).json({ error: 'Authors array required' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created = [];
      for (const author of authors) {
        const { rows } = await client.query(
          `INSERT INTO authors (name, email, affiliation, orcid)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (name) DO UPDATE SET
             email = COALESCE(EXCLUDED.email, authors.email),
             affiliation = COALESCE(EXCLUDED.affiliation, authors.affiliation),
             orcid = COALESCE(EXCLUDED.orcid, authors.orcid),
             updated_at = now()
           RETURNING *`,
          [author.name?.trim(), author.email?.trim() || null, author.affiliation?.trim() || null, author.orcid?.trim() || null]
        );
        created.push(rows[0]);
      }
      await client.query('COMMIT');
      res.status(201).json(created);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[api/authors] bulk create failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;