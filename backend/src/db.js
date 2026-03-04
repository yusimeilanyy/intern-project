// src/db.js
import mysql from 'mysql2/promise';
import 'dotenv/config'; // Pastikan dotenv sudah diinstall

// Buat pool koneksi
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '4kun_database',
  database: process.env.DB_NAME || 'mou_tracking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ WAJIB: Export dengan syntax ES Module
export { pool };