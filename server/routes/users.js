const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

module.exports = function (db) {
  const router = express.Router();
  router.use(authenticateToken, requireAdmin);

  router.get('/', (req, res) => {
    const users = db.users.data.map(u => ({ id: u.id, username: u.username, full_name: u.full_name, role: u.role, created_at: u.created_at }));
    res.json(users);
  });

  router.post('/', (req, res) => {
    const { username, password, full_name, role } = req.body;
    if (!username || !password || !full_name) return res.status(400).json({ error: 'All fields required' });
    const existing = db.users.data.find(u => u.username === username);
    if (existing) return res.status(409).json({ error: 'Username exists' });
    const hash = bcrypt.hashSync(password, 10);
    const user = db.users.insert({ username, password: hash, full_name, role: role || 'user' });
    res.json({ id: user.id, username: user.username, full_name: user.full_name, role: user.role });
  });

  router.put('/:id', (req, res) => {
    const { full_name, role, password } = req.body;
    const updates = { full_name, role };
    if (password) updates.password = bcrypt.hashSync(password, 10);
    const user = db.users.update(req.params.id, updates);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, full_name: user.full_name, role: user.role });
  });

  router.delete('/:id', (req, res) => {
    db.users.remove(req.params.id);
    res.json({ message: 'Deleted' });
  });

  return router;
};
