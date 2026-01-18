import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

dotenv.config();

const fullName = process.env.SEED_ADMIN_NAME || "Admin";
const username = process.env.SEED_ADMIN_USERNAME || "admin";
const email = process.env.SEED_ADMIN_EMAIL || "admin@internal.local";
const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

const run = async () => {
  const password_hash = await bcrypt.hash(password, 12);

  // cari user berdasarkan username atau email
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    [username, email]
  );

  if (rows.length) {
    // ✅ kalau sudah ada: UPDATE dan RESET password
    const id = rows[0].id;
    await pool.query(
      `UPDATE users
       SET full_name = ?, username = ?, email = ?, password_hash = ?, role = 'admin', is_active = 1
       WHERE id = ?`,
      [fullName, username, email, password_hash, id]
    );
    console.log("✅ Admin di-update & password direset:", password);
  } else {
    // ✅ kalau belum ada: INSERT
    await pool.query(
      `INSERT INTO users (full_name, username, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 'admin', 1)`,
      [fullName, username, email, password_hash]
    );
    console.log("✅ Admin dibuat:", password);
  }

  process.exit(0);
};

run().catch((e) => {
  console.error("❌ Seed gagal:", e);
  process.exit(1);
});