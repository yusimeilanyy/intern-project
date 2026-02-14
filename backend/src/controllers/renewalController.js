// ========================================
// RENEWAL CONTROLLER - PERPANJANGAN DOKUMEN
// ========================================
import { pool } from "../db.js";

// ========================================
// PERPANJANG DOKUMEN YANG SUDAH KADALUARSA
// ========================================
export const renewExpiredDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, notes } = req.body;
    
    // Validasi input
    if (!newEndDate) {
      return res.status(400).json({ message: "Tanggal berakhir baru wajib diisi" });
    }

    // Validasi format tanggal
    const endDate = new Date(newEndDate);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Format tanggal tidak valid" });
    }

    // Ambil dokumen dari database
    const [rows] = await pool.query("SELECT * FROM mous WHERE id = ?", [id]);
    
    if (!rows[0]) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan" });
    }

    // Parse payload
    const oldPayload = JSON.parse(rows[0].payload);
    
    // Validasi: Dokumen harus sudah kadaluarsa
    const today = new Date();
    const currentEndDate = new Date(oldPayload.cooperationEndDate);
    
    if (currentEndDate > today) {
      return res.status(400).json({ 
        message: "Dokumen belum kadaluarsa. Tidak perlu diperpanjang." 
      });
    }

    // ✅ AMBIL STATUS AKHIR SEBELUM KADALUARSA
const preservedSubStatus =
  oldPayload.lastActiveSubStatus ||
  oldPayload.subStatus ||
  oldPayload.statusAkhir ||
  oldPayload.status ||        // kalau status proses ada, pakai ini
  "Baru";                     // fallback paling aman

    // Hitung durasi perpanjangan (dalam tahun)
    const currentStartDate = new Date(oldPayload.cooperationStartDate);
    const originalDuration = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24 * 365);
    const newDuration = (endDate - currentStartDate) / (1000 * 60 * 60 * 24 * 365);
    const extensionYears = Math.round(newDuration - originalDuration);

    // ✅ UPDATE: KEMBALIKAN STATUS AKHIR KE NILAI SEBELUM KADALUARSA
    const newPayload = {
      ...oldPayload,
      cooperationEndDate: newEndDate,
      status: preservedSubStatus, 
      subStatus: preservedSubStatus,        // ✅ KEMBALIKAN STATUS AKHIR
      statusAkhir: preservedSubStatus,      // ✅ KEMBALIKAN STATUS AKHIR
      renewalNotes: notes || `Diperpanjang dengan status akhir: ${preservedSubStatus} pada ${new Date().toLocaleDateString('id-ID')}`,
      renewedAt: new Date().toISOString(),
      renewalCount: (parseInt(oldPayload.renewalCount) || 0) + 1,
      extensionYears: extensionYears,
      renewalHistory: [
        ...(oldPayload.renewalHistory || []),
        {
          date: new Date().toISOString(),
          oldEndDate: oldPayload.cooperationEndDate,
          newEndDate: newEndDate,
          subStatusBefore: oldPayload.subStatus || oldPayload.statusAkhir,
          subStatusAfter: preservedSubStatus,
          notes: notes || 'Diperpanjang otomatis'
        }
      ]
    };

    // Update dokumen di database
    await pool.query(
      "UPDATE mous SET payload = ?, updated_at = NOW() WHERE id = ?",
      [JSON.stringify(newPayload), id]
    );

    console.log(`✅ Dokumen ID ${id} berhasil diperpanjang`);
    console.log(`   - Status akhir dikembalikan ke: ${preservedSubStatus}`);
    console.log(`   - Tanggal lama: ${oldPayload.cooperationEndDate}`);
    console.log(`   - Tanggal baru: ${newEndDate}`);

    // Kirim response
    res.json({
      message: "Dokumen berhasil diperpanjang dengan status akhir dipertahankan",
      document: {
        id: parseInt(id),
        type: newPayload.documentType || (rows[0].category === 'pks' ? 'PKS' : 'MoU'),
        institution: newPayload.institutionalLevel,
        oldEndDate: oldPayload.cooperationEndDate,
        newEndDate: newEndDate,
        renewalCount: newPayload.renewalCount,
        extensionYears: extensionYears,
        status: 'Aktif',
        subStatus: preservedSubStatus,
        statusAkhir: preservedSubStatus
      }
    });
    
  } catch (error) {
    console.error("❌ Error renewing document:", error);
    res.status(500).json({ 
      message: "Gagal memperpanjang dokumen", 
      error: error.message 
    });
  }
};

// ========================================
// GET HISTORY PERPANJANGAN DOKUMEN
// ========================================
export const getRenewalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query("SELECT * FROM mous WHERE id = ?", [id]);
    
    if (!rows[0]) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan" });
    }

    const payload = JSON.parse(rows[0].payload);
    
    res.json({
      id: parseInt(id),
      type: payload.documentType || (rows[0].category === 'pks' ? 'PKS' : 'MoU'),
      institution: payload.institutionalLevel,
      renewalCount: parseInt(payload.renewalCount) || 0,
      renewalNotes: payload.renewalNotes || '',
      renewedAt: payload.renewedAt || null,
      extensionYears: payload.extensionYears || 0,
      history: payload.renewalHistory || []
    });
    
  } catch (error) {
    console.error("Error getting renewal history:", error);
    res.status(500).json({ message: "Gagal mengambil history perpanjangan" });
  }
};

// ========================================
// TANDAI DOKUMEN KADALUARSA SEBAGAI "TIDAK DIPERPANJANG"
// ========================================
export const markAsNotRenewed = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ambil dokumen dari database
    const [rows] = await pool.query("SELECT * FROM mous WHERE id = ?", [id]);
    
    if (!rows[0]) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan" });
    }

    // Parse payload
    const payload = JSON.parse(rows[0].payload);
    
    // Pastikan dokumen sudah kadaluarsa
    const today = new Date();
    const endDate = new Date(payload.cooperationEndDate);
    if (endDate > today) {
      return res.status(400).json({ 
        message: "Dokumen belum kadaluarsa. Tidak bisa ditandai sebagai 'tidak diperpanjang'." 
      });
    }

    // ✅ SIMPAN STATUS AKHIR SEBELUM DIUBAH
    const updatedPayload = {
      ...payload,
      lastActiveSubStatus: payload.subStatus || payload.statusAkhir || 'Aktif', // ✅ SIMPAN STATUS AKHIR
      status: 'Selesai',
      renewalStatus: 'not_renewed',
      markedAsNotRenewedAt: new Date().toISOString()
    };

    // Simpan ke database
    await pool.query(
      "UPDATE mous SET payload = ?, updated_at = NOW() WHERE id = ?",
      [JSON.stringify(updatedPayload), id]
    );

    console.log(`✅ Dokumen ID ${id} ditandai sebagai 'tidak diperpanjang'`);
    
    res.json({
      message: "Dokumen berhasil ditandai sebagai tidak diperpanjang",
      document: {
        id: parseInt(id),
        status: 'Selesai'
      }
    });
    
  } catch (error) {
    console.error("❌ Error marking as not renewed:", error);
    res.status(500).json({ 
      message: "Gagal menandai dokumen", 
      error: error.message 
    });
  }
};