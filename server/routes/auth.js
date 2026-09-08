const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

module.exports = function (db) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const user = db.users.data.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
  });

  router.post('/register', (req, res) => {
    const { username, password, full_name } = req.body;
    if (!username || !password || !full_name) return res.status(400).json({ error: 'All fields required' });
    const existing = db.users.data.find(u => u.username === username);
    if (existing) return res.status(409).json({ error: 'Username already exists' });
    const hash = bcrypt.hashSync(password, 10);
    const user = db.users.insert({ username, password: hash, full_name, role: 'admin' });
    const token = jwt.sign({ id: user.id, username, role: 'admin', full_name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username, full_name, role: 'admin' } });
  });

  router.get('/me', authenticateToken, (req, res) => {
    const user = db.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, full_name: user.full_name, role: user.role });
  });

  return router;
};
