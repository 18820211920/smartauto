require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('./src/config');

async function test() {
  const pool = mysql.createPool(config.db);
  const conn = await pool.getConnection();
  const [rows] = await conn.query(
    'SELECT id, username, password_hash FROM sys_user WHERE username=?',
    ['admin']
  );
  conn.release();
  if (rows.length === 0) {
    console.log('No admin user!');
    return;
  }
  const user = rows[0];
  console.log('DB user found:', user.username, '| hash:', user.password_hash.substring(0, 30) + '...');
  const match = await bcrypt.compare('SmartAuto@2024', user.password_hash);
  console.log('Password match:', match);
}
test().catch(e => console.error(e));