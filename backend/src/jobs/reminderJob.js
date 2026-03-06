// ========================================
// REMINDER JOB - OTOMATIS SETIAP HARI
// ========================================
import cron from 'node-cron';
import { pool } from '../db.js';
import { sendToPIC } from '../controllers/emailController.js';

export const setupReminderJobs = () => {
  
  // ========================================
  // JOB: CEK & KIRIM REMINDER OTOMATIS SETIAP HARI
  // ========================================
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [AUTO REMINDER] Memeriksa dokumen akan expired dalam 14 hari...');
    
    try {
      // ========================================
      // QUERY: AMBIL DOKUMEN YANG AKAN EXPIRED 1-14 HARI
      // ========================================
      const [documents] = await pool.query(`
        SELECT 
          m.id,
          m.category,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.documentType')) AS documentType,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.institutionalLevel')) AS institutionalLevel,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationStartDate')) AS startDate,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')) AS endDate,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.bpsdmpPIC')) AS picName,
          
          (
            SELECT u.email 
            FROM users u 
            WHERE u.full_name = JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.bpsdmpPIC'))
               OR u.username = JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.bpsdmpPIC'))
            LIMIT 1
          ) AS picEmail
          
        FROM mous m
        WHERE 
          JSON_EXTRACT(m.payload, '$.cooperationEndDate') IS NOT NULL
          AND STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d') > CURDATE()
          AND DATEDIFF(
            STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
            CURDATE()
          ) <= 14
          AND DATEDIFF(
            STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
            CURDATE()
          ) > 0
        ORDER BY endDate ASC
      `);

      const docCount = documents.length;
      
      if (docCount === 0) {
        console.log('✅ [AUTO REMINDER] Tidak ada dokumen yang akan expired dalam 14 hari');
        return;
      }

      console.log(`📧 [AUTO REMINDER] Ditemukan ${docCount} dokumen akan expired dalam 14 hari`);

      // ========================================
      // Kirim email ke PIC (per dokumen)
      // ========================================
      let picSuccess = 0;
      let picFailed = 0;
      
      for (const doc of documents) {
        try {
          const daysRemaining = Math.floor(
            (new Date(doc.endDate) - new Date()) / (1000 * 60 * 60 * 24)
          );

          if (!doc.picEmail) {
            console.log(`   ⚠️  Email tidak ditemukan untuk PIC "${doc.picName}" (Dokumen ID ${doc.id})`);
            picFailed++;
            continue; 
          }

          const reminderData = {
            id: doc.id,
            type: doc.documentType || (doc.category === 'pks' ? 'PKS' : 'MoU'),
            institution: doc.institutionalLevel,
            startDate: doc.startDate,
            endDate: doc.endDate,
            picName: doc.picName,
            picEmail: doc.picEmail 
          };

          // Kirim ke PIC
          const picResult = await sendToPIC(reminderData, daysRemaining);
          
          if (picResult.success) {
            picSuccess++;
            console.log(`   ✅ Email ke PIC terkirim untuk dokumen ID ${doc.id}: ${doc.institutionalLevel} (${daysRemaining} hari) -> ${doc.picEmail}`);
          } else {
            picFailed++;
            console.log(`   ❌ Gagal kirim ke PIC untuk dokumen ID ${doc.id}`);
          }
        } catch (error) {
          picFailed++;
          console.error(`   ❌ Error kirim ke PIC untuk dokumen ID ${doc.id}:`, error.message);
        }
      }

      // ========================================
      // LOG FINAL
      // ========================================
      console.log(`✅ [AUTO REMINDER] Selesai!`);
      console.log(`   • Email ke PIC: ${picSuccess} berhasil, ${picFailed} gagal`);
      
    } catch (error) {
      console.error('❌ [AUTO REMINDER] Error:', error);
    }
  }, {
    // ✅ Set timezone ke WITA (Asia/Makassar, UTC+8)
    timezone: "Asia/Makassar"
  });

  console.log('   [AUTO REMINDER] Scheduler aktif:');
  console.log('   • Setiap hari jam 08:00 WITA');
  console.log('   • Cek dokumen akan expired dalam 1-14 hari');
  console.log('   • Kirim email ke PIC otomatis');
};