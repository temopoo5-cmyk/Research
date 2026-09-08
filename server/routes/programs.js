const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

module.exports = function (db) {
  const router = express.Router();
  router.get('/', (req, res) => res.json(db.programs.findAll()));
  router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    if (db.programs.data.find(p => p.name === name || p.code === code)) return res.status(409).json({ error: 'Program already exists' });
    res.json(db.programs.insert({ name, code }));
  });
  router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const p = db.programs.update(req.params.id, { name: req.body.name, code: req.body.code });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  });
  router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    db.programs.remove(req.params.id);
    res.json({ message: 'Deleted' });
  });
  return router;
};
