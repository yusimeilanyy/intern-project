import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const body = req.body || {};
    const identifier = body.identifier || body.username || body.email;
    const password = body.password;

    if (!identifier || !password) {
      return res.status(400).json({ message: "identifier dan password wajib diisi" });
    }

    const [rows] = await pool.query(
      "SELECT id, full_name, username, email, password_hash, role, is_active FROM users WHERE username = ? OR email = ? LIMIT 1",
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    const user = rows[0];

    if (user.is_active === 0) {
      return res.status(403).json({ message: "Akun nonaktif" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Password salah" });
    }

    const secret = process.env.JWT_SECRET || "dev_secret";
    const expiresIn = process.env.JWT_EXPIRES_IN || "8h";

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      secret,
      { expiresIn }
    );

    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Login gagal (500)" });
  }
});

export default router;
