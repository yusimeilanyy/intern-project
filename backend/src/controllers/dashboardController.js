// ========================================
// DASHBOARD CONTROLLER - STATISTIK DOKUMEN
// ========================================
import { pool } from "../db.js";

// ========================================
// GET STATISTIK DOKUMEN AKAN EXPIRED
// ========================================
export const getExpiringStats = async (req, res) => {
  try {
    console.log("📊 [Dashboard] Mengambil statistik dokumen akan expired...");

    // ========================================
    // QUERY 1: DOKUMEN URGENT (≤7 hari)
    // ========================================
    const [urgentDocs] = await pool.query(`
      SELECT 
        m.id,
        m.category,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.documentType')) AS documentType,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.institutionalLevel')) AS institutionalLevel,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')) AS endDate,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.bpsdmpPIC')) AS picName,
        DATEDIFF(
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
          CURDATE()
        ) AS daysRemaining
      FROM mous m
      WHERE 
        -- Pastikan ada tanggal expired di payload
        JSON_EXTRACT(m.payload, '$.cooperationEndDate') IS NOT NULL
        -- Hanya dokumen yang belum expired
        AND STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d') > CURDATE()
        -- Hanya dokumen yang akan expired dalam 7 hari
        AND DATEDIFF(
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
          CURDATE()
        ) <= 7
      ORDER BY daysRemaining ASC
    `);

    console.log(`   ✅ Ditemukan ${urgentDocs.length} dokumen URGENT (≤7 hari)`);

    // ========================================
    // QUERY 2: DOKUMEN WARNING (8-14 hari)
    // ========================================
    const [warningDocs] = await pool.query(`
      SELECT 
        m.id,
        m.category,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.documentType')) AS documentType,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.institutionalLevel')) AS institutionalLevel,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')) AS endDate,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.bpsdmpPIC')) AS picName,
        DATEDIFF(
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
          CURDATE()
        ) AS daysRemaining
      FROM mous m
      WHERE 
        JSON_EXTRACT(m.payload, '$.cooperationEndDate') IS NOT NULL
        AND STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d') > CURDATE()
        -- Hanya dokumen yang akan expired dalam 8-14 hari
        AND DATEDIFF(
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
          CURDATE()
        ) > 7
        AND DATEDIFF(
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
          CURDATE()
        ) <= 14
      ORDER BY daysRemaining ASC
    `);

    console.log(`   ✅ Ditemukan ${warningDocs.length} dokumen WARNING (8-14 hari)`);

    // ========================================
    // QUERY 3: DOKUMEN SUDAH EXPIRED
    // ========================================
    const [expiredDocs] = await pool.query(`
      SELECT 
        m.id,
        m.category,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.documentType')) AS documentType,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.institutionalLevel')) AS institutionalLevel,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')) AS endDate,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.bpsdmpPIC')) AS picName,
        JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.status')) AS status,
        DATEDIFF(
          CURDATE(),
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d')
        ) AS daysExpired
      FROM mous m
      WHERE 
        JSON_EXTRACT(m.payload, '$.cooperationEndDate') IS NOT NULL
        -- Hanya dokumen yang sudah expired
        AND STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d') < CURDATE()
        -- Kecuali yang sudah diperpanjang
        AND JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.status')) != 'Diperpanjang'
      ORDER BY endDate DESC
    `);

    console.log(`   ✅ Ditemukan ${expiredDocs.length} dokumen SUDAH EXPIRED\n`);

    // ========================================
    // FORMAT DATA UNTUK FRONTEND
    // ========================================
    const formattedResponse = {
      urgent: {
        count: urgentDocs.length,
        documents: urgentDocs.map(doc => ({
          id: doc.id,
          type: doc.documentType || (doc.category === 'pks' ? 'PKS' : 'MoU'),
          institution: doc.institutionalLevel,
          endDate: doc.endDate,
          daysRemaining: parseInt(doc.daysRemaining),
          picName: doc.picName,
          urgency: 'high' // Tingkat urgensi: high, medium, low
        }))
      },
      warning: {
        count: warningDocs.length,
        documents: warningDocs.map(doc => ({
          id: doc.id,
          type: doc.documentType || (doc.category === 'pks' ? 'PKS' : 'MoU'),
          institution: doc.institutionalLevel,
          endDate: doc.endDate,
          daysRemaining: parseInt(doc.daysRemaining),
          picName: doc.picName,
          urgency: 'medium'
        }))
      },
      expired: {
        count: expiredDocs.length,
        documents: expiredDocs.map(doc => ({
          id: doc.id,
          type: doc.documentType || (doc.category === 'pks' ? 'PKS' : 'MoU'),
          institution: doc.institutionalLevel,
          endDate: doc.endDate,
          daysExpired: parseInt(doc.daysExpired),
          picName: doc.picName,
          status: doc.status || 'Kadaluarsa'
        }))
      }
    };

    // Kirim response ke frontend
    res.json(formattedResponse);
    
  } catch (error) {
    console.error("❌ [Dashboard] Error mengambil statistik:", error);
    res.status(500).json({ 
      message: "Gagal mengambil statistik dokumen", 
      error: error.message 
    });
  }
};