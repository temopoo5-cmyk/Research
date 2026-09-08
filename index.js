require('dotenv').config();
const pool = require('./api/db');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

  try {
    const res = await pool.query('SELECT NOW() AS time, current_database() AS database');
    console.log('Connection successful!');
    console.log('  Server time:', res.rows[0].time);
    console.log('  Database:   ', res.rows[0].database);
  } catch (err) {
    console.error('Connection failed!');
    console.error('  Error:', err.message);
    if (err.code) console.error('  Code:', err.code);
  } finally {
    await pool.end();
  }
}

testConnection();
