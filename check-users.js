const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT * FROM users WHERE username = 'admin'")
  .then(r => console.log(r.rows))
  .catch(e => console.error(e))
  .finally(() => pool.end());