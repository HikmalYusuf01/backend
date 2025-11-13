// db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // penting untuk koneksi Railway
});

pool.connect()
  .then(() => console.log('✅ Terkoneksi ke PostgreSQL (Railway)'))
  .catch((err) => console.error('❌ Gagal konek ke PostgreSQL:', err));

module.exports = pool;
