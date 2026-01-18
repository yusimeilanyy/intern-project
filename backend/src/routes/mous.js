import express from "express";
import { pool } from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");
await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = [".pdf", ".doc", ".docx"];
  if (!allowed.includes(ext)) {
    return cb(new Error("Format file harus PDF/DOC/DOCX"), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

function safeJsonParse(str, fallback = {}) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

function rowToMou(row) {
  const payloadObj = safeJsonParse(row.payload, {});
  return {
    id: row.id,
    category: row.category,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...payloadObj,
  };
}

// helper: hapus file lama jika ada
async function deleteOldUploadIfAny(oldUrl) {
  if (!oldUrl || typeof oldUrl !== "string") return;
  if (!oldUrl.startsWith("/uploads/")) return;

  const filename = path.basename(oldUrl);
  const fullPath = path.join(uploadDir, filename);

  try {
    await fs.unlink(fullPath);
  } catch {
    // kalau file tidak ada, abaikan
  }
}

// GET /api/mous?category=pemda|non_pemda
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    let sql = "SELECT * FROM mous";
    const params = [];
    if (category) {
      sql += " WHERE category = ?";
      params.push(category);
    }
    sql += " ORDER BY id DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(rowToMou));
  } catch (err) {
    console.error("GET /mous error:", err);
    res.status(500).json({ message: "Gagal load data MoU" });
  }
});

// POST /api/mous  (multipart: category, payload, finalDocument)
router.post("/", upload.single("finalDocument"), async (req, res) => {
  try {
    const category = req.body?.category;

    if (!category || !["pemda", "non_pemda"].includes(category)) {
      return res.status(400).json({ message: "category wajib pemda/non_pemda" });
    }

    // payload dikirim sebagai string JSON di field "payload"
    const payloadObj = safeJsonParse(req.body?.payload, {});

    // kalau ada file, set URL + nama file
    if (req.file) {
      payloadObj.finalDocumentUrl = `/uploads/${req.file.filename}`;
      payloadObj.finalDocumentName =
        payloadObj.finalDocumentName || req.file.originalname;
    }

    const payload = JSON.stringify(payloadObj);
    const createdBy = req.user?.id || null;

    const [result] = await pool.query(
      "INSERT INTO mous (category, payload, created_by) VALUES (?, ?, ?)",
      [category, payload, createdBy]
    );

    const [rows] = await pool.query("SELECT * FROM mous WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(rowToMou(rows[0]));
  } catch (err) {
    console.error("POST /mous error:", err);
    res.status(500).json({ message: "Gagal simpan MoU" });
  }
});

// PUT /api/mous/:id (multipart juga)
router.put("/:id", upload.single("finalDocument"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id tidak valid" });

    // ambil data lama (buat preserve payload / hapus file lama)
    const [oldRows] = await pool.query("SELECT * FROM mous WHERE id = ?", [id]);
    if (!oldRows.length) return res.status(404).json({ message: "MoU tidak ada" });

    const oldRow = oldRows[0];
    const oldPayload = safeJsonParse(oldRow.payload, {});

    // category boleh dikirim (opsional)
    const category = req.body?.category || oldRow.category;
    if (category && !["pemda", "non_pemda"].includes(category)) {
      return res.status(400).json({ message: "category tidak valid" });
    }

    const incomingPayload = safeJsonParse(req.body?.payload, {});
    const nextPayload = { ...oldPayload, ...incomingPayload };

    // kalau upload file baru, hapus file lama lalu set yang baru
    if (req.file) {
      await deleteOldUploadIfAny(oldPayload.finalDocumentUrl);
      nextPayload.finalDocumentUrl = `/uploads/${req.file.filename}`;
      nextPayload.finalDocumentName =
        incomingPayload.finalDocumentName || req.file.originalname;
    }

    const payload = JSON.stringify(nextPayload);

    await pool.query(
      "UPDATE mous SET category = ?, payload = ? WHERE id = ?",
      [category, payload, id]
    );

    const [rows] = await pool.query("SELECT * FROM mous WHERE id = ?", [id]);
    res.json(rowToMou(rows[0]));
  } catch (err) {
    console.error("PUT /mous/:id error:", err);
    res.status(500).json({ message: "Gagal update MoU" });
  }
});

// DELETE /api/mous/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "id tidak valid" });

    // hapus file juga (biar rapi)
    const [rows] = await pool.query("SELECT * FROM mous WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "MoU tidak ada" });

    const payloadObj = safeJsonParse(rows[0].payload, {});
    await deleteOldUploadIfAny(payloadObj.finalDocumentUrl);

    const [result] = await pool.query("DELETE FROM mous WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "MoU tidak ada" });

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /mous error:", err);
    res.status(500).json({ message: "Gagal hapus MoU" });
  }
});

export default router;