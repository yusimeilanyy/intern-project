// ========================================
// EMAIL CONTROLLER - HYBRID NOTIFICATION
// ========================================
import nodemailer from 'nodemailer';
import { pool } from '../db.js';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ========================================
// GET USERS BY ROLE & TEAM
// ========================================
const getUsersByRole = async (role, teamId = null) => {
  try {
    let query = `
      SELECT id, full_name, email, role, team_id 
      FROM users 
      WHERE is_active = TRUE AND email IS NOT NULL
    `;
    
    const params = [];
    
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    if (teamId) {
      query += ' AND team_id = ?';
      params.push(teamId);
    }
    
    query += ' ORDER BY full_name ASC';
    
    const [users] = await pool.query(query, params);
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

// ========================================
// KIRIM KE PIC DOKUMEN (DETAIL LENGKAP)
// ========================================
export const sendToPIC = async (doc, daysRemaining) => {
  try {
    const picEmail = doc.picEmail;
    
    if (!picEmail) {
      console.log('⚠️ PIC email tidak ditemukan untuk dokumen ID:', doc.id);
      return { success: false, message: 'No PIC email' };
    }

    const urgency = daysRemaining <= 7 ? '⚠️ SANGAT URGENT' : 
                    daysRemaining <= 10 ? '⏳ MENDESAK' : '📅 Perlu Perhatian';
    
    const urgencyColor = daysRemaining <= 7 ? '#ef4444' : 
                         daysRemaining <= 10 ? '#f59e0b' : '#3b82f6';

    const startDate = doc.startDate ? new Date(doc.startDate).toLocaleDateString('id-ID') : '-';
    const endDate = doc.endDate ? new Date(doc.endDate).toLocaleDateString('id-ID') : '-';

    const mailOptions = {
      from: `"BPSDMP Kominfo Manado" <${process.env.EMAIL_USER}>`,
      to: picEmail,
      cc: process.env.ADMIN_EMAIL,
      subject: `🔔 [${urgency}] Dokumen Anda akan expired: ${doc.type} - ${doc.institution}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
            .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: ${urgencyColor}; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .info-box { background: #f1f5f9; border-radius: 10px; padding: 25px; margin: 20px 0; border-left: 4px solid ${urgencyColor}; }
            .btn { display: inline-block; background: ${urgencyColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 15px 0; }
            .footer { background: #e2e8f0; padding: 20px; text-align: center; color: #4b5563; font-size: 14px; border-top: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 NOTIFIKASI KHUSUS PIC</h1>
              <p>${urgency}</p>
            </div>
            
            <div class="content">
              <p><strong>Halo ${doc.picName},</strong></p>
              
              <p>Anda menerima email ini karena Anda adalah <strong>PIC</strong> untuk dokumen berikut yang akan <strong>expired dalam ${daysRemaining} hari</strong>:</p>
              
              <div class="info-box">
                <p><strong>📋 Jenis Dokumen:</strong> ${doc.type}</p>
                <p><strong>🏢 Mitra:</strong> ${doc.institution}</p>
                <p><strong>📅 Periode:</strong> ${startDate} → ${endDate}</p>
                <p><strong>⏳ Sisa Waktu:</strong> <strong style="color: ${urgencyColor};">${daysRemaining} hari</strong></p>
              </div>

              <h3>📝 Tindakan yang Harus Dilakukan:</h3>
              <ol>
                <li><strong>Segera konfirmasi</strong> dengan mitra apakah kerja sama akan diperpanjang</li>
                <li><strong>Siapkan draft perpanjangan</strong> jika diperlukan</li>
                <li><strong>Jadwalkan pertemuan</strong> dengan mitra untuk membahas perpanjangan</li>
                <li><strong>Proses perpanjangan</strong> minimal <strong>7 hari sebelum expired</strong></li>
              </ol>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">
                  📊 Lihat Detail & Proses Perpanjangan
                </a>
              </div>

              <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; background: #fffbeb; padding: 15px; border-radius: 8px;">
                <p><strong>ℹ️ Catatan:</strong></p>
                <ul>
                  <li>Email ini juga dikirim ke admin untuk monitoring</li>
                  <li>Jika Anda sudah memproses perpanjangan, abaikan email ini</li>
                  <li>Untuk bantuan, hubungi admin sistem</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>Dikirim oleh Sistem Manajemen MoU/PKS</p>
              <p>BPSDMP Kominfo Manado</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email ke PIC terkirim: ${picEmail}`);
    
    return { success: true, recipient: picEmail };
  } catch (error) {
    console.error(`❌ Gagal kirim email ke PIC untuk dokumen ID ${doc.id}:`, error);
    return { success: false, error: error.message };
  }
};

// ========================================
// KIRIM KE MANAGER (RINGKASAN TIM)
// ========================================
export const sendToManager = async (teamId, expiringDocs) => {
  try {
    const managers = await getUsersByRole('manager', teamId);
    
    if (managers.length === 0) {
      console.log(`⚠️ Tidak ada manager untuk team_id: ${teamId}`);
      return { success: false, message: 'No managers found' };
    }

    const totalDocs = expiringDocs.length;
    const urgentDocs = expiringDocs.filter(d => d.daysRemaining <= 7).length;

    const mailOptions = {
      from: `"BPSDMP Kominfo Manado" <${process.env.EMAIL_USER}>`,
      bcc: managers.map(m => m.email),
      subject: `📊 Ringkasan Tim: ${totalDocs} dokumen akan expired (${urgentDocs} URGENT)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
            .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: #3b82f6; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .summary { background: #dbeafe; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
            .summary-number { font-size: 28px; font-weight: bold; }
            .doc-list { margin: 25px 0; }
            .doc-item { padding: 15px; margin: 10px 0; border-radius: 8px; background: #f8fafc; }
            .doc-urgent { background: #fef2f2; border-left: 4px solid #ef4444; }
            .footer { background: #e2e8f0; padding: 20px; text-align: center; color: #4b5563; font-size: 14px; border-top: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 RINGKASAN TIM</h1>
              <p>Dokumen yang akan expired</p>
            </div>
            
            <div class="content">
              <p>Halo Manager Tim,</p>
              
              <div class="summary">
                <div class="summary-number">${totalDocs}</div>
                <div>Dokumen Akan Expired</div>
                <div style="margin-top: 10px; color: ${urgentDocs > 0 ? '#ef4444' : '#3b82f6'}; font-weight: bold;">
                  ${urgentDocs > 0 ? `${urgentDocs} DOKUMEN URGENT` : 'Tidak ada dokumen URGENT'}
                </div>
              </div>
              
              ${urgentDocs > 0 ? `
                <h3 style="color: #ef4444;">⚠️ DOKUMEN URGENT (HARUS DIPROSES SEGERA)</h3>
              ` : ''}
              
              <div class="doc-list">
                ${expiringDocs.map(doc => `
                  <div class="doc-item ${doc.daysRemaining <= 7 ? 'doc-urgent' : ''}">
                    <strong>${doc.type}</strong>: ${doc.institution}
                    <div style="color: ${doc.daysRemaining <= 7 ? '#ef4444' : '#3b82f6'}; margin-top: 5px;">
                      ${doc.daysRemaining} hari lagi
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard"="btn" style="background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  📊 Lihat Semua Dokumen
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Dikirim oleh Sistem Manajemen MoU/PKS</p>
              <p>BPSDMP Kominfo Manado</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email ringkasan ke manager terkirim untuk team_id: ${teamId}`);
    
    return { success: true, recipients: managers.map(m => m.email) };
  } catch (error) {
    console.error(`❌ Gagal kirim email ke manager untuk team_id ${teamId}:`, error);
    return { success: false, error: error.message };
  }
};

// ========================================
// KIRIM DAILY DIGEST UNTUK ADMIN
// ========================================
export const sendDailyDigest = async () => {
  try {
    const [expiringDocs] = await pool.query(`
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
        AND DATEDIFF(
          STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d'),
          CURDATE()
        ) <= 14
      ORDER BY daysRemaining ASC
    `);

    const [expiredToday] = await pool.query(`
      SELECT COUNT(*) AS count FROM mous m
      WHERE 
        JSON_EXTRACT(m.payload, '$.cooperationEndDate') IS NOT NULL
        AND DATE(STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(m.payload, '$.cooperationEndDate')), '%Y-%m-%d')) = CURDATE()
    `);

    const totalExpiring = expiringDocs.length;
    const urgentDocs = expiringDocs.filter(d => d.daysRemaining <= 7).length;

    const adminEmails = (await getUsersByRole('admin')).map(u => u.email).filter(email => email);

    if (adminEmails.length === 0) {
      console.log('⚠️ Tidak ada admin untuk daily digest');
      return;
    }

    const mailOptions = {
      from: `"BPSDMP Kominfo Manado" <${process.env.EMAIL_USER}>`,
      to: adminEmails.join(', '),
      subject: `📊 Daily Digest: ${totalExpiring} dokumen akan expired (Termasuk ${urgentDocs} URGENT)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
            .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: #1e40af; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .summary { display: flex; justify-content: space-around; text-align: center; margin: 25px 0; }
            .summary-item { padding: 15px; border-radius: 10px; }
            .summary-total { background: #dbeafe; }
            .summary-urgent { background: #fee2e2; }
            .summary-expired { background: #ffedd5; }
            .summary-number { font-size: 28px; font-weight: bold; margin: 5px 0; }
            .doc-list { margin: 25px 0; }
            .doc-item { padding: 12px; margin: 8px 0; border-radius: 8px; background: #f8fafc; border-left: 4px solid #3b82f6; }
            .doc-urgent { border-left-color: #ef4444; background: #fef2f2; }
            .doc-days { font-weight: bold; color: #ef4444; }
            .footer { background: #e2e8f0; padding: 20px; text-align: center; color: #4b5563; font-size: 14px; border-top: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 DAILY DIGEST</h1>
              <p>Laporan Harian Dokumen MoU/PKS</p>
            </div>
            
            <div class="content">
              <p>Halo Admin,</p>
              
              <p>Berikut ringkasan status dokumen hari ini (${new Date().toLocaleDateString('id-ID')}):</p>
              
              <div class="summary">
                <div class="summary-item summary-total">
                  <div class="summary-number">${totalExpiring}</div>
                  <div>Dokumen<br>Akan Expired</div>
                </div>
                <div class="summary-item summary-urgent">
                  <div class="summary-number">${urgentDocs}</div>
                  <div>Dokumen<br>URGENT (&lt;7 hari)</div>
                </div>
                <div class="summary-item summary-expired">
                  <div class="summary-number">${expiredToday[0].count}</div>
                  <div>Dokumen<br>Expired Hari Ini</div>
                </div>
              </div>

              ${totalExpiring > 0 ? `
                <h3>📋 Dokumen Akan Expired:</h3>
                <div class="doc-list">
                  ${expiringDocs.map(doc => `
                    <div class="doc-item ${doc.daysRemaining <= 7 ? 'doc-urgent' : ''}">
                      <strong>${doc.documentType || (doc.category === 'pks' ? 'PKS' : 'MoU')}</strong>: 
                      ${doc.institutionalLevel || '-'} 
                      <span class="doc-days">(${doc.daysRemaining} hari lagi)</span>
                      <br>
                      <small>PIC: ${doc.picName || '-'}</small>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p>✅ Tidak ada dokumen yang akan expired dalam 14 ke depan.</p>
              `}

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p>
                  <strong>💡 Rekomendasi Hari Ini:</strong><br>
                  ${urgentDocs > 0 ? 
                    `• Segera follow up ${urgentDocs} dokumen URGENT (< 7 hari)` : 
                    `• Semua dokumen dalam kondisi aman`
                  }<br>
                  • Pastikan PIC sudah memproses perpanjangan dokumen expired hari ini
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #1e40af; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  📊 Lihat Dashboard Lengkap
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Daily Digest - Sistem Manajemen MoU/PKS</p>
              <p>BPSDMP Kominfo Manado | ${new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Daily digest terkirim ke ${adminEmails.length} admin`);
  } catch (error) {
    console.error('❌ Gagal kirim daily digest:', error);
  }
};