import { pool } from "../db.js";
import bcrypt from "bcryptjs";

// ✅ HANYA ADMIN: Get semua users
export async function getAllUsers(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, email, full_name, role, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: rows.length,
      users: rows
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}

// ✅ HANYA ADMIN: Register user baru (ditambahkan karena dibutuhkan di routes)
export async function registerByAdmin(req, res) {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username, email, dan password wajib diisi" 
      });
    }

    // Cek email sudah terdaftar
    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Email sudah terdaftar" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [username, email, hashedPassword, full_name || null, role || 'user']
    );

    res.status(201).json({
      success: true,
      message: "User berhasil didaftarkan",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ 
      success: false,
      message: "Gagal mendaftarkan user" 
    });
  }
}

// ✅ HANYA ADMIN: Delete user
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Cek user ada
    const [userCheck] = await pool.query(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (!userCheck.length) {
      return res.status(404).json({ 
        success: false,
        message: "User tidak ditemukan" 
      });
    }

    // Jangan hapus diri sendiri
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        success: false,
        message: "Tidak bisa menghapus akun sendiri" 
      });
    }

    // Delete user
    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "User berhasil dihapus"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan server" 
    });
  }
}