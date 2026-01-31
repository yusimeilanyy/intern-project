// backend/src/controllers/mousController.js
import { pool } from "../db.js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// DASHBOARD DATA
// ========================================
export const getDashboardData = async (req, res) => {
  try {
    console.log("📊 Fetching dashboard data...");
    
    // 1. Ambil SEMUA dokumen dengan detail lengkap
    const [allDocs] = await pool.query(`
      SELECT 
        id,
        category,
        payload,
        created_at,
        updated_at
      FROM mous 
      ORDER BY created_at DESC
    `);

    // 2. Parse semua dokumen dan ekstrak field penting
    const documents = allDocs.map(doc => {
      let payload = {};
      try {
        payload = typeof doc.payload === 'string' ? JSON.parse(doc.payload) : doc.payload;
      } catch (e) {
        console.error(`Error parsing payload for doc ${doc.id}:`, e);
        payload = {};
      }

      // ✅ PERBAIKAN: Pastikan documentType diset dengan benar
      const documentType = payload.documentType || (doc.category === 'pemda' || doc.category === 'mou' ? 'MoU' : 'PKS');


      return {
        id: doc.id,
        category: doc.category, // 'mou', 'pemda', 'pks'
        documentType: documentType, // ✅ Pastikan documentType terisi dengan benar
        type: payload.type || '-',
        institutionalLevel: payload.institutionalLevel || '-',
        bpsdmpPIC: payload.bpsdmpPIC || '-',
        partnerPIC: payload.partnerPIC || '-',
        partnerPICPhone: payload.partnerPICPhone || '-',
        officeDocNumber: payload.officeDocNumber || '-',
        partnerDocNumber: payload.partnerDocNumber || '-',
        owner: payload.owner || '-',
        notes: payload.notes || '-',
        cooperationStartDate: payload.cooperationStartDate || '-',
        cooperationEndDate: payload.cooperationEndDate || '-',
        status: payload.status || 'Baru',
        finalDocumentName: payload.finalDocumentName || '',
        finalDocumentUrl: payload.finalDocumentUrl || '',
        provinceId: payload.provinceId || '',
        regencyId: payload.regencyId || '',
        level: payload.level || '',
        created_at: doc.created_at,
        updated_at: doc.updated_at
      };
    });

    // 3. Hitung total berdasarkan documentType (bukan category)
    const totalMou = documents.filter(d => d.documentType === 'MoU').length;
    const totalPks = documents.filter(d => d.documentType === 'PKS').length;

    // 4. Hitung aktif/kadaluarsa berdasarkan tanggal
    const now = new Date();
    const activeMou = documents.filter(d => 
      d.documentType === 'MoU' && 
      d.cooperationEndDate !== '-' && 
      new Date(d.cooperationEndDate) > now
    ).length;

    const expiredMou = documents.filter(d => 
      d.documentType === 'MoU' && 
      d.cooperationEndDate !== '-' && 
      new Date(d.cooperationEndDate) <= now
    ).length;

    const activePks = documents.filter(d => 
      d.documentType === 'PKS' && 
      d.cooperationEndDate !== '-' && 
      new Date(d.cooperationEndDate) > now
    ).length;

    const expiredPks = documents.filter(d => 
      d.documentType === 'PKS' && 
      d.cooperationEndDate !== '-' && 
      new Date(d.cooperationEndDate) <= now
    ).length;

    const activeCount = activeMou + activePks;
    const expiredCount = expiredMou + expiredPks;

    // 5. Format response
    const response = {
      totalMou,
      totalPks,
      activeCount,
      expiredCount,
      mou: {
        active: activeMou,
        expired: expiredMou
      },
      pks: {
        active: activePks,
        expired: expiredPks
      },
      documents // ✅ Kirim semua dokumen dengan field lengkap
    };

    console.log("✅ Dashboard data:", {
      totalMou,
      totalPks,
      totalDocuments: documents.length
    });

    res.json(response);
  } catch (error) {
    console.error("❌ Dashboard data error:", error);
    res.status(500).json({ message: "Gagal mengambil data dashboard" });
  }
};

// ========================================
// DOCUMENT PREVIEW
// ========================================
export const getDocumentPreview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      "SELECT payload FROM mous WHERE id = ?",
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan" });
    }

    const payload = JSON.parse(rows[0].payload);
    const filePath = payload.file_path;

    if (!filePath) {
      return res.status(404).json({ message: "File path tidak ditemukan di dokumen" });
    }

    const fullPath = path.join(__dirname, '../public', filePath);

    if (!fs.existsSync(fullPath)) {
      console.error("File tidak ditemukan di:", fullPath);
      return res.status(404).json({ 
        message: "File tidak ditemukan di server",
        path: fullPath 
      });
    }

    const mimeType = filePath.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${payload.document_name || 'document.pdf'}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ 
      message: "Gagal memuat preview dokumen",
      error: error.message 
    });
  }
};

// ========================================
// CRUD OPERATIONS
// ========================================
export const getAllMous = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = `SELECT id, category, payload, created_at FROM mous`;
    
if (category === 'pemda') {
  query += ` WHERE category IN ('mou', 'pemda')`;
} else if (category === 'non_pemda') {
  query += ` WHERE category = 'non_pemda'`; // Menangani kategori non_pemda
} else if (category) {
  query += ` WHERE category = '${category}'`;
}

    
    query += ` ORDER BY created_at DESC`;
    
    const [documents] = await pool.query(query);
    
    const formattedDocs = documents.map(doc => {
      let payload = {};
      try {
        payload = typeof doc.payload === 'string' ? JSON.parse(doc.payload) : doc.payload;
      } catch (e) {
        console.error(`Error parsing payload for doc ${doc.id}:`, e);
      }

      // ✅ PERBAIKAN: Ekstrak documentType
      const documentType = payload.documentType || (doc.category === 'pks' ? 'PKS' : 'MoU');

      return {
        id: doc.id,
        category: doc.category,
        documentType: documentType, // ✅ TAMBAHAN
        documentNumber: payload.officeDocNumber || 'N/A',
        partnerName: payload.institutionalLevel || 'N/A',
        startDate: payload.cooperationStartDate || 'N/A',
        endDate: payload.cooperationEndDate || 'N/A'
      };
    });
    
    res.json(formattedDocs);
  } catch (error) {
    console.error("Get all mous error:", error);
    res.status(500).json({ message: "Gagal mengambil data MoU" });
  }
};

export const getMouById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM mous WHERE id = ?", [id]);
    
    if (!rows[0]) {
      return res.status(404).json({ message: "MoU tidak ditemukan" });
    }
    
    // Parse payload
    let payload = {};
    try {
      payload = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
    } catch (e) {
      console.error("Error parsing payload:", e);
    }

    res.json({
      id: rows[0].id,
      category: rows[0].category,
      ...payload
    });
  } catch (error) {
    console.error("Get mou by id error:", error);
    res.status(500).json({ message: "Gagal mengambil data MoU" });
  }
};

export const createMou = async (req, res) => {
  try {
    const { category, payload } = req.body;
    
    console.log("📝 Creating MoU:", { category, payload });

    // Pastikan category dan payload ada
    if (!category || !payload) {
      return res.status(400).json({ message: "Category dan payload wajib diisi" });
    }

    // Parsing payload jika perlu
    let parsedPayload = {};
    try {
      parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch (e) {
      return res.status(400).json({ message: "Payload tidak valid" });
    }

    // Pastikan documentType ada di payload
    if (!parsedPayload.documentType) {
      parsedPayload.documentType = category === 'pks' ? 'PKS' : 'MoU'; // Default ke MoU jika tidak ada
    }

    // Menghandle file upload jika ada
    if (req.file) {
      const fileUrl = `/uploads/${req.file.filename}`;
      parsedPayload.finalDocumentUrl = fileUrl;
      parsedPayload.finalDocumentName = req.file.originalname;
      console.log("📎 File uploaded:", fileUrl);
    }

    // Menyimpan ke database
    const [result] = await pool.query(
      "INSERT INTO mous (category, payload, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [category, JSON.stringify(parsedPayload)]
    );

    console.log("✅ MoU created with ID:", result.insertId);

    // Kembalikan data
    res.status(201).json({
      message: "MoU berhasil ditambahkan",
      id: result.insertId,
      category: category,
      ...parsedPayload
    });
  } catch (error) {
    console.error("❌ Create mou error:", error);
    res.status(500).json({ message: "Gagal menambahkan MoU", error: error.message });
  }
};

export const updateMou = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, payload } = req.body;
    
    console.log("✏️ Updating MoU ID:", id, "Category:", category);

    // Parsing payload jika perlu
    let parsedPayload = {};
    try {
      parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch (e) {
      return res.status(400).json({ message: "Payload tidak valid" });
    }

    // Pastikan documentType ada di payload
    if (!parsedPayload.documentType) {
      parsedPayload.documentType = category === 'pks' ? 'PKS' : 'MoU'; // Default ke MoU jika tidak ada
    }

    // Menghandle file upload baru jika ada
    if (req.file) {
      const fileUrl = `/uploads/${req.file.filename}`;
      parsedPayload.finalDocumentUrl = fileUrl;
      parsedPayload.finalDocumentName = req.file.originalname;
      console.log("📎 New file uploaded:", fileUrl);
    }
    
    // Menyimpan update ke database
    const [result] = await pool.query(
      "UPDATE mous SET category = ?, payload = ?, updated_at = NOW() WHERE id = ?",
      [category, JSON.stringify(parsedPayload), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "MoU tidak ditemukan" });
    }
    
    console.log("✅ MoU updated successfully");

    // Kembalikan data setelah update
    res.json({ 
      message: "MoU berhasil diupdate",
      id: parseInt(id),
      category: category,
      ...parsedPayload
    });
  } catch (error) {
    console.error("❌ Update mou error:", error);
    res.status(500).json({ message: "Gagal mengupdate MoU", error: error.message });
  }
};

export const deleteMou = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("🗑️ Deleting MoU ID:", id);

    // Get file info before deleting
    const [rows] = await pool.query("SELECT payload FROM mous WHERE id = ?", [id]);
    
    if (rows[0]) {
      try {
        const payload = typeof rows[0].payload === 'string' ? JSON.parse(rows[0].payload) : rows[0].payload;
        
        // Delete file if exists
        if (payload.finalDocumentUrl && payload.finalDocumentUrl.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '../public', payload.finalDocumentUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("📎 File deleted:", filePath);
          }
        }
      } catch (e) {
        console.error("Error deleting file:", e);
      }
    }
    
    const [result] = await pool.query("DELETE FROM mous WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "MoU tidak ditemukan" });
    }
    
    console.log("✅ MoU deleted successfully");
    res.json({ message: "MoU berhasil dihapus" });
  } catch (error) {
    console.error("❌ Delete mou error:", error);
    res.status(500).json({ message: "Gagal menghapus MoU" });
  }
};