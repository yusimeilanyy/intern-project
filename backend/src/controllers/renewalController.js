// ========================================
// RENEWAL CONTROLLER - PERPANJANGAN DOKUMEN
// ========================================
import { pool } from "../db.js";

// ========================================
// PERPANJANG DOKUMEN (SEBELUM/SETELAH KADALUARSA)
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

    // ✅ FIX: Parse payload (handle jika sudah object dari MySQL)
    const oldPayload = typeof rows[0].payload === 'string' 
      ? JSON.parse(rows[0].payload) 
      : { ...rows[0].payload };
    
    // ✅ NORMALISASI TANGGAL (tanpa waktu)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentEndDate = new Date(oldPayload.cooperationEndDate);
    currentEndDate.setHours(0, 0, 0, 0);
    
    const newEndDateNormalized = new Date(newEndDate);
    newEndDateNormalized.setHours(0, 0, 0, 0);

    // ✅ HITUNG HARI SAMPAI EXPIRED
    const daysUntilExpiry = Math.ceil((currentEndDate - today) / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Debug Perpanjangan Dokumen ID ${id}:`);
    console.log(`   Hari ini: ${today.toISOString().split('T')[0]}`);
    console.log(`   Tanggal berakhir lama: ${currentEndDate.toISOString().split('T')[0]}`);
    console.log(`   Sisa waktu: ${daysUntilExpiry} hari`);
    console.log(`   Tanggal berakhir baru: ${newEndDateNormalized.toISOString().split('T')[0]}`);

    // ✅ VALIDASI WINDOW WAKTU PERPANJANGAN
    
    // Tidak boleh terlalu awal (lebih dari 90 hari sebelum expired)
    if (daysUntilExpiry > 90) {
      return res.status(400).json({ 
        message: `Dokumen masih terlalu lama untuk diperpanjang (masih ${daysUntilExpiry} hari lagi). Perpanjangan hanya dapat dilakukan maksimal 90 hari sebelum berakhir.` 
      });
    }

    // Tidak boleh terlalu lama expired (lebih dari 30 hari)
    if (daysUntilExpiry < -30) {
      return res.status(400).json({ 
        message: "Dokumen sudah terlalu lama kadaluarsa (lebih dari 30 hari). Silakan buat dokumen baru karena masa grace period telah berakhir." 
      });
    }

    // Validasi tanggal baru harus lebih besar dari tanggal lama
    if (newEndDateNormalized <= currentEndDate) {
      return res.status(400).json({ 
        message: "Tanggal berakhir baru harus lebih besar dari tanggal berakhir saat ini" 
      });
    }

    // Validasi tanggal baru tidak boleh di masa lalu
    if (newEndDateNormalized < today) {
      return res.status(400).json({ 
        message: "Tanggal berakhir baru tidak boleh di masa lalu" 
      });
    }

    // ✅ AMBIL STATUS AKHIR SEBELUM KADALUARSA
    const preservedSubStatus =
      oldPayload.lastActiveSubStatus ||
      oldPayload.subStatus ||
      oldPayload.statusAkhir ||
      oldPayload.status ||
      "Aktif";

    // ✅ HITUNG DURASI PERPANJANGAN (dalam tahun)
    const currentStartDate = new Date(oldPayload.cooperationStartDate);
    currentStartDate.setHours(0, 0, 0, 0);
    
    const originalDuration = (currentEndDate - currentStartDate) / (1000 * 60 * 60 * 24 * 365);
    const newDuration = (newEndDateNormalized - currentStartDate) / (1000 * 60 * 60 * 24 * 365);
    const extensionYears = Math.round((newDuration - originalDuration) * 10) / 10; // 1 desimal

    // ✅ PREPARE NEW PAYLOAD
    const newPayload = {
      ...oldPayload,
      cooperationEndDate: newEndDate,
      status: preservedSubStatus, 
      subStatus: preservedSubStatus,
      statusAkhir: preservedSubStatus,
      renewalNotes: notes || `Diperpanjang dengan status akhir: ${preservedSubStatus} pada ${new Date().toLocaleDateString('id-ID')}`,
      renewedAt: new Date().toISOString(),
      renewalCount: (parseInt(oldPayload.renewalCount) || 0) + 1,
      extensionYears: extensionYears,
      lastRenewalDaysBeforeExpiry: daysUntilExpiry,
      renewalHistory: [
        ...(oldPayload.renewalHistory || []),
        {
          date: new Date().toISOString(),
          oldEndDate: oldPayload.cooperationEndDate,
          newEndDate: newEndDate,
          subStatusBefore: oldPayload.subStatus || oldPayload.statusAkhir || oldPayload.status,
          subStatusAfter: preservedSubStatus,
          daysBeforeExpiry: daysUntilExpiry,
          notes: notes || 'Diperpanjang otomatis',
          renewedBy: req.user?.id || 'system'
        }
      ]
    };

    // ✅ UPDATE DOKUMEN DI DATABASE
    await pool.query(
      "UPDATE mous SET payload = ?, updated_at = NOW() WHERE id = ?",
      [JSON.stringify(newPayload), id]
    );

    // ✅ LOG SUCCESS
    console.log(`✅ Dokumen ID ${id} BERHASIL diperpanjang`);
    console.log(`   - Status dikembalikan ke: ${preservedSubStatus}`);
    console.log(`   - Tanggal lama: ${oldPayload.cooperationEndDate}`);
    console.log(`   - Tanggal baru: ${newEndDate}`);
    console.log(`   - Durasi perpanjangan: ${extensionYears} tahun`);
    console.log(`   - Diperpanjang ${daysUntilExpiry > 0 ? 'SEBELUM' : 'SETELAH'} expired (${Math.abs(daysUntilExpiry)} hari)`);

    // ✅ KIRIM RESPONSE
    res.json({
      message: "Dokumen berhasil diperpanjang",
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
        statusAkhir: preservedSubStatus,
        renewedAt: newPayload.renewedAt,
        daysBeforeExpiry: daysUntilExpiry
      }
    });
    
  } catch (error) {
    console.error("❌ Error renewing document:", error);
    console.error("❌ Stack trace:", error.stack);
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

    // ✅ FIX: Parse payload (handle jika sudah object dari MySQL)
    const payload = typeof rows[0].payload === 'string' 
      ? JSON.parse(rows[0].payload) 
      : { ...rows[0].payload };
    
    res.json({
      id: parseInt(id),
      type: payload.documentType || (rows[0].category === 'pks' ? 'PKS' : 'MoU'),
      institution: payload.institutionalLevel,
      renewalCount: parseInt(payload.renewalCount) || 0,
      renewalNotes: payload.renewalNotes || '',
      renewedAt: payload.renewedAt || null,
      extensionYears: payload.extensionYears || 0,
      lastRenewalDaysBeforeExpiry: payload.lastRenewalDaysBeforeExpiry || null,
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

    // ✅ FIX: Parse payload (handle jika sudah object dari MySQL)
    const payload = typeof rows[0].payload === 'string' 
      ? JSON.parse(rows[0].payload) 
      : { ...rows[0].payload };
    
    // Normalisasi tanggal
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(payload.cooperationEndDate);
    endDate.setHours(0, 0, 0, 0);
    
    // Hitung hari sejak expired
    const daysSinceExpiry = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));

    // ✅ VALIDASI: Dokumen harus sudah expired (atau akan expired dalam 7 hari)
    if (daysSinceExpiry < -7) {
      return res.status(400).json({ 
        message: "Dokumen belum waktunya ditandai sebagai 'tidak diperpanjang'. Dokumen masih berlaku atau akan berakhir dalam waktu dekat." 
      });
    }

    // ✅ SIMPAN STATUS AKHIR SEBELUM DIUBAH
    const updatedPayload = {
      ...payload,
      lastActiveSubStatus: payload.subStatus || payload.statusAkhir || payload.status || 'Aktif',
      status: 'Selesai',
      subStatus: 'Tidak Diperpanjang',
      statusAkhir: 'Tidak Diperpanjang',
      renewalStatus: 'not_renewed',
      markedAsNotRenewedAt: new Date().toISOString(),
      daysBeforeExpiryWhenMarked: daysSinceExpiry < 0 ? Math.abs(daysSinceExpiry) : null,
      notRenewedReason: payload.notRenewedReason || 'Dokumen ditandai manual sebagai tidak diperpanjang'
    };

    // Simpan ke database
    await pool.query(
      "UPDATE mous SET payload = ?, updated_at = NOW() WHERE id = ?",
      [JSON.stringify(updatedPayload), id]
    );

    console.log(`✅ Dokumen ID ${id} ditandai sebagai 'tidak diperpanjang'`);
    console.log(`   - Status akhir tersimpan: ${updatedPayload.lastActiveSubStatus}`);
    console.log(`   - Ditandai ${daysSinceExpiry >= 0 ? 'SETELAH' : 'SEBELUM'} expired (${Math.abs(daysSinceExpiry)} hari)`);
    
    res.json({
      message: "Dokumen berhasil ditandai sebagai tidak diperpanjang",
      document: {
        id: parseInt(id),
        status: 'Selesai',
        subStatus: 'Tidak Diperpanjang',
        lastActiveSubStatus: updatedPayload.lastActiveSubStatus
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