const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT username, role FROM users")
  .then(r => console.log(r.rows))
  .catch(e => console.error(e))
  .finally(() => pool.end());