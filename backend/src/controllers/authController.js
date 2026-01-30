import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: "Username dan password wajib diisi" 
      });
    }

    // Cari user
    const [rows] = await pool.query(
      "SELECT id, username, email, full_name, password, role, is_active FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (!rows.length || rows[0].is_active === 0) {
      return res.status(401).json({ 
        message: "Username atau password salah" 
      });
    }

    const user = rows[0];

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Username atau password salah" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: user.id, 
        username: user.username,
        role: user.role // ✅ Pastikan role dikirim di token payload
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "24h" }
    );

    // ✅ Response dengan role di user object
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role, // ✅ INI WAJIB ADA!
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Terjadi kesalahan server",
      error: error.message 
    });
  }
}