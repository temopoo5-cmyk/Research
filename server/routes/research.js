const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

module.exports = function (db) {
  const router = express.Router();

  function generateCode(type) {
    const prefix = { 'Research Paper': 'RP', 'Thesis': 'TH', 'Capstone Project': 'CP' }[type] || 'RE';
    const year = new Date().getFullYear();
    const count = db.research.count(r => r.research_type === type);
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  function enrichResearch(r) {
    if (!r) return null;
    const program = r.program_id ? db.programs.findById(r.program_id) : null;
    const category = r.category_id ? db.categories.findById(r.category_id) : null;
    const submitter = r.submitted_by ? db.users.findById(r.submitted_by) : null;
    return {
      ...r,
      program_name: program ? program.name : null,
      program_code: program ? program.code : null,
      category_name: category ? category.name : null,
      submitted_by_name: submitter ? submitter.full_name : null
    };
  }

  router.get('/', (req, res) => {
    const { search, code, title, author, program, year, category, type, status, page = 1, limit = 20 } = req.query;
    let results = db.research.findAll();
    const reqStatus = status || 'approved';
    results = results.filter(r => r.status === reqStatus);

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.authors && r.authors.toLowerCase().includes(q)) ||
        (r.code && r.code.toLowerCase().includes(q)) ||
        (r.keywords && r.keywords.toLowerCase().includes(q)) ||
        (r.abstract && r.abstract.toLowerCase().includes(q))
      );
    }
    if (code) results = results.filter(r => r.code && r.code.toLowerCase().includes(code.toLowerCase()));
    if (title) results = results.filter(r => r.title && r.title.toLowerCase().includes(title.toLowerCase()));
    if (author) results = results.filter(r => r.authors && r.authors.toLowerCase().includes(author.toLowerCase()));
    if (program) {
      const prog = db.programs.data.find(p => p.code === program);
      if (prog) results = results.filter(r => r.program_id === prog.id);
    }
    if (year) results = results.filter(r => r.year === parseInt(year));
    if (category) results = results.filter(r => {
      const cat = db.categories.findById(r.category_id);
      return cat && cat.name === category;
    });
    if (type) results = results.filter(r => r.research_type === type);

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = results.length;
    const p = parseInt(page);
    const l = parseInt(limit);
    const paged = results.slice((p - 1) * l, p * l).map(enrichResearch);

    res.json({ data: paged, total, page: p, pages: Math.ceil(total / l) });
  });

  router.get('/all', authenticateToken, (req, res) => {
    const { status, search } = req.query;
    let results = db.research.findAll();
    if (status) results = results.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(r => (r.title && r.title.toLowerCase().includes(q)) || (r.authors && r.authors.toLowerCase().includes(q)) || (r.code && r.code.toLowerCase().includes(q)));
    }
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(results.map(enrichResearch));
  });

  router.get('/:id', (req, res) => {
    const r = db.research.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(enrichResearch(r));
  });

  router.post('/', authenticateToken, upload.single('file'), (req, res) => {
    const { title, authors, adviser, program_id, year, category_id, research_type, abstract, keywords } = req.body;
    if (!title || !authors || !year || !research_type) return res.status(400).json({ error: 'Required fields missing' });
    const code = generateCode(research_type);
    const filePath = req.file ? req.file.filename : null;
    const record = db.research.insert({
      code, title, authors, adviser: adviser || null,
      program_id: program_id ? parseInt(program_id) : null,
      year: parseInt(year),
      category_id: category_id ? parseInt(category_id) : null,
      research_type, abstract: abstract || '', keywords: keywords || '',
      file_path: filePath, submitted_by: req.user.id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });
    res.json(enrichResearch(record));
  });

  router.put('/:id', authenticateToken, upload.single('file'), (req, res) => {
    const existing = db.research.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && existing.submitted_by !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    const { title, authors, adviser, program_id, year, category_id, research_type, abstract, keywords } = req.body;
    const filePath = req.file ? req.file.filename : existing.file_path;
    db.research.update(req.params.id, {
      title: title || existing.title, authors: authors || existing.authors,
      adviser: adviser !== undefined ? adviser : existing.adviser,
      program_id: program_id ? parseInt(program_id) : existing.program_id,
      year: year ? parseInt(year) : existing.year,
      category_id: category_id ? parseInt(category_id) : existing.category_id,
      research_type: research_type || existing.research_type,
      abstract: abstract !== undefined ? abstract : existing.abstract,
      keywords: keywords !== undefined ? keywords : existing.keywords,
      file_path: filePath
    });
    res.json(enrichResearch(db.research.findById(req.params.id)));
  });

  router.patch('/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    if (!['approved', 'pending', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    db.research.update(req.params.id, { status });
    res.json(enrichResearch(db.research.findById(req.params.id)));
  });

  router.delete('/:id', authenticateToken, (req, res) => {
    const existing = db.research.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && existing.submitted_by !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    db.research.remove(req.params.id);
    res.json({ message: 'Deleted' });
  });

  router.get('/download/:id', (req, res) => {
    const r = db.research.findById(req.params.id);
    if (!r || !r.file_path) return res.status(404).json({ error: 'File not found' });
    res.download(path.join(__dirname, '..', 'uploads', r.file_path));
  });

  return router;
};
