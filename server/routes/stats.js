const express = require('express');
module.exports = function (db) {
  const router = express.Router();
  router.get('/', (req, res) => {
    const all = db.research.findAll();
    const total = all.length;
    const approved = all.filter(r => r.status === 'approved').length;
    const pending = all.filter(r => r.status === 'pending').length;
    const rejected = all.filter(r => r.status === 'rejected').length;
    const users = db.users.count();
    const programs = db.programs.count();
    const categories = db.categories.count();
    const byType = db.research.groupBy('research_type');
    const yearGroups = {};
    all.forEach(r => { yearGroups[r.year] = (yearGroups[r.year] || 0) + 1; });
    const byYear = Object.entries(yearGroups).map(([year, count]) => ({ year: parseInt(year), count })).sort((a, b) => b.year - a.year).slice(0, 10);
    res.json({ total, approved, pending, rejected, users, programs, categories, byType, byYear });
  });
  return router;
};
