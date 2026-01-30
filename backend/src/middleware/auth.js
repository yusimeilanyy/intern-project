import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: missing Bearer token" });
    }

    const secret = process.env.JWT_SECRET || "dev_secret";
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ message: `Unauthorized: ${err.name || "invalid token"}` });
    }

    const userId = payload.sub;
    const [rows] = await pool.query(
      "SELECT id, full_name, username, email, role, is_active FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!rows.length || rows[0].is_active === 0) {
      return res.status(401).json({ message: "Unauthorized: user not found/inactive" });
    }

    req.user = rows[0];
    next();
  } catch (e) {
    console.error("requireAuth error:", e);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// ✅ Middleware untuk cek role admin
export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: user not authenticated" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Akses ditolak. Hanya admin yang dapat mengakses.', 
      code: 'FORBIDDEN' 
    });
  }

  next();
}