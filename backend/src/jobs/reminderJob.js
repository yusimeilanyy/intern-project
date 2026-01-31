// ========================================
// REMINDER JOB - OTOMATIS SETIAP HARI
// ========================================
import cron from 'node-cron';
import { pool } from '../db.js';
import { sendToPIC, sendToManager } from '../controllers/emailController.js';

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
          m.team_id,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.documentType')) AS documentType,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.institutionalLevel')) AS institutionalLevel,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationStartDate')) AS startDate,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')) AS endDate,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.bpsdmpPIC')) AS picName,
          JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.pic_email')) AS picEmail
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
      // ✅ LETAKKAN KODE INI DI SINI! (SETelah query, sebelum log final)
      // ========================================
      
      // Kumpulkan dokumen per tim
      const docsByTeam = {};
      for (const doc of documents) {
        const teamId = doc.team_id || 0; // team_id NULL = 0
        if (!docsByTeam[teamId]) {
          docsByTeam[teamId] = [];
        }
        docsByTeam[teamId].push(doc);
      }

      // Kirim email ke PIC (per dokumen)
      let picSuccess = 0;
      let picFailed = 0;
      
      for (const doc of documents) {
        try {
          const daysRemaining = Math.floor(
            (new Date(doc.endDate) - new Date()) / (1000 * 60 * 60 * 24)
          );

          const reminderData = {
            id: doc.id,
            type: doc.documentType || (doc.category === 'pks' ? 'PKS' : 'MoU'),
            institution: doc.institutionalLevel,
            startDate: doc.startDate,
            endDate: doc.endDate,
            picName: doc.picName,
            picEmail: doc.picEmail,
            team_id: doc.team_id
          };

          // Kirim ke PIC
          const picResult = await sendToPIC(reminderData, daysRemaining);
          
          if (picResult.success) {
            picSuccess++;
            console.log(`   ✅ Email ke PIC terkirim untuk dokumen ID ${doc.id}: ${doc.institutionalLevel} (${daysRemaining} hari)`);
          } else {
            picFailed++;
            console.log(`   ❌ Gagal kirim ke PIC untuk dokumen ID ${doc.id}`);
          }
        } catch (error) {
          picFailed++;
          console.error(`   ❌ Error kirim ke PIC untuk dokumen ID ${doc.id}:`, error.message);
        }
      }

      // Kirim email ke Manager (per tim, bukan per dokumen)
      let managerSuccess = 0;
      let managerFailed = 0;
      
      for (const [teamId, docs] of Object.entries(docsByTeam)) {
        try {
          const managerResult = await sendToManager(parseInt(teamId), docs);
          
          if (managerResult.success) {
            managerSuccess++;
            console.log(`   ✅ Email ringkasan ke manager tim ${teamId} terkirim (${docs.length} dokumen)`);
          } else {
            managerFailed++;
            console.log(`   ❌ Gagal kirim ke manager tim ${teamId}`);
          }
        } catch (error) {
          managerFailed++;
          console.error(`   ❌ Error kirim ke manager tim ${teamId}:`, error.message);
        }
      }

      // ========================================
      // LOG FINAL
      // ========================================
      console.log(`✅ [AUTO REMINDER] Selesai!`);
      console.log(`   • Email ke PIC: ${picSuccess} berhasil, ${picFailed} gagal`);
      console.log(`   • Email ke Manager: ${managerSuccess} berhasil, ${managerFailed} gagal`);
      
    } catch (error) {
      console.error('❌ [AUTO REMINDER] Error:', error);
    }
  });

  console.log('✅ [AUTO REMINDER] Scheduler aktif:');
  console.log('   • Setiap hari jam 08:00 WIB');
  console.log('   • Cek dokumen akan expired dalam 1-14 hari');
  console.log('   • Kirim email ke PIC + Manager otomatis');
};