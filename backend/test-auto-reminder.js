// test-auto-reminder.js
import 'dotenv/config';
import { pool } from './src/db.js';
import { sendToPIC, sendToManager } from './src/controllers/emailController.js';

console.log('🧪 TEST AUTO REMINDER SYSTEM');
console.log('================================\n');

async function testAutoReminder() {
  try {
    // Query dokumen yang akan expired dalam 14 hari
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
        ) = 14
    `);

    console.log(`📊 Ditemukan ${documents.length} dokumen akan expired dalam 14 hari\n`);

    if (documents.length === 0) {
      console.log('⚠️  Tidak ada dokumen untuk di-test');
      console.log('💡 Tips: Buat dokumen dengan tanggal expired 14 hari dari sekarang');
      return;
    }

    // Kirim email untuk setiap dokumen
    for (const doc of documents) {
      console.log(`📧 Mengirim email untuk dokumen ID ${doc.id}:`);
      console.log(`   - Jenis: ${doc.documentType || 'MoU'}`);
      console.log(`   - Mitra: ${doc.institutionalLevel}`);
      console.log(`   - PIC: ${doc.picName}`);
      console.log(`   - Email PIC: ${doc.picEmail}`);
      console.log(`   - Team ID: ${doc.team_id}`);
      
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

      try {
        // Kirim ke PIC
        const picResult = await sendToPIC(reminderData, 14);
        if (picResult.success) {
          console.log('   ✅ Email ke PIC berhasil terkirim');
        } else {
          console.log('   ❌ Gagal kirim email ke PIC');
        }

        // Kirim ke Manager
        const managerResult = await sendToManager(doc.team_id, [reminderData]);
        if (managerResult.success) {
          console.log('   ✅ Email ke Manager berhasil terkirim');
        } else {
          console.log('   ❌ Gagal kirim email ke Manager');
        }

        console.log('');
      } catch (error) {
        console.error('   ❌ Error:', error.message);
      }
    }

    console.log('✨ Test selesai!');
    console.log('📬 Periksa email Anda untuk hasil test');

  } catch (error) {
    console.error('❌ Test gagal:', error);
  }
}

testAutoReminder();