const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

module.exports = function (db) {
  const router = express.Router();
  router.get('/', (req, res) => res.json(db.categories.findAll()));
  router.post('/', authenticateToken, requireAdmin, (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    if (db.categories.data.find(c => c.name === name)) return res.status(409).json({ error: 'Category already exists' });
    res.json(db.categories.insert({ name }));
  });
  router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
    const c = db.categories.update(req.params.id, { name: req.body.name });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  });
  router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    db.categories.remove(req.params.id);
    res.json({ message: 'Deleted' });
  });
  return router;
};
