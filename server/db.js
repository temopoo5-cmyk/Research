const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

class JsonDB {
  constructor(name) {
    this.filePath = path.join(DB_DIR, `${name}.json`);
    this.data = [];
    this.autoId = 1;
    this.load();
  }
  load() {
    if (fs.existsSync(this.filePath)) {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      this.data = JSON.parse(raw);
      this.autoId = this.data.length > 0 ? Math.max(...this.data.map(r => r.id)) + 1 : 1;
    }
  }
  save() { fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2)); }
  insert(record) { record.id = this.autoId++; record.created_at = record.created_at || new Date().toISOString(); this.data.push(record); this.save(); return record; }
  findById(id) { return this.data.find(r => r.id === parseInt(id)) || null; }
  findAll(filterFn) { return filterFn ? this.data.filter(filterFn) : [...this.data]; }
  update(id, updates) { const idx = this.data.findIndex(r => r.id === parseInt(id)); if (idx === -1) return null; Object.assign(this.data[idx], updates); this.save(); return this.data[idx]; }
  remove(id) { const idx = this.data.findIndex(r => r.id === parseInt(id)); if (idx === -1) return false; this.data.splice(idx, 1); this.save(); return true; }
  count(filterFn) { return filterFn ? this.data.filter(filterFn).length : this.data.length; }
  where(conditions) {
    return this.data.filter(row => {
      return Object.entries(conditions).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        return String(row[key]) === String(value);
      });
    });
  }
  search(fields, query) {
    const q = query.toLowerCase();
    return this.data.filter(row => fields.some(f => row[f] && String(row[f]).toLowerCase().includes(q)));
  }
  groupBy(field) {
    const groups = {};
    this.data.forEach(row => {
      const key = row[field] || 'Unknown';
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([key, count]) => ({ [field]: key, count }));
  }
}

class Database {
  constructor() {
    this.users = new JsonDB('users');
    this.programs = new JsonDB('programs');
    this.categories = new JsonDB('categories');
    this.research = new JsonDB('research');
    this.init();
  }
  init() {
    if (this.users.data.length === 0) {
      const bcrypt = require('bcryptjs');
      this.users.insert({ username: 'admin', password: bcrypt.hashSync('admin123', 10), full_name: 'System Administrator', role: 'admin' });
    }
    if (this.programs.data.length === 0) {
      [{ name: 'Computer Science', code: 'CS' }, { name: 'Information Technology', code: 'IT' }, { name: 'Information Systems', code: 'IS' }, { name: 'Computer Engineering', code: 'CPE' }].forEach(p => this.programs.insert(p));
    }
    if (this.categories.data.length === 0) {
      ['Artificial Intelligence', 'Web Development', 'Data Science', 'Cybersecurity', 'Mobile Development', 'Networking', 'Software Engineering', 'IoT'].forEach(c => this.categories.insert({ name: c }));
    }
  }
}

module.exports = new Database();
