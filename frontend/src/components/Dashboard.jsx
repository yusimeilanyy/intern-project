// ========================================
// IMPORT LIBRARY DAN KOMPONEN YANG DIBUTUHKAN
// ========================================
import React, { useState, useEffect } from 'react'; // Berfungsi untuk mengimpor React dan hook useState/useEffect untuk manajemen state dan lifecycle component
import StatCard from './StatCard'; // Berfungsi untuk mengimpor komponen StatCard yang menampilkan kartu statistik (Total MoU, PKS, dll)
import ChartContainer from './ChartContainer'; // Berfungsi untuk mengimpor komponen ChartContainer yang menampilkan grafik visualisasi data
import DocumentTable from './DocumentTable'; // Berfungsi untuk mengimpor komponen DocumentTable yang menampilkan daftar dokumen dalam bentuk tabel
import './Dashboard.css'; // Berfungsi untuk mengimpor file CSS yang berisi styling khusus untuk halaman Dashboard
import ExpiringStatsWidget from './ExpiringStatsWidget'; // Berfungsi untuk mengimpor komponen widget yang menampilkan dokumen yang akan segera kadaluarsa

// ========================================
// DEFINISI KOMPONEN UTAMA DASHBOARD
// ========================================
const Dashboard = () => {
  // ========================================
  // STATE MANAGEMENT - MENYIMPAN DATA DINAMIS
  // ========================================
  
  // Berfungsi untuk menyimpan data statistik dashboard (total MoU, PKS, aktif, expired) yang diambil dari API
  const [stats, setStats] = useState(null);
  
  // Berfungsi untuk menyimpan array daftar dokumen yang akan ditampilkan di tabel
  const [documents, setDocuments] = useState([]);
  
  // Berfungsi untuk menandai apakah data sedang dalam proses loading (true = sedang loading, false = selesai)
  const [loading, setLoading] = useState(true);
  
  // Berfungsi untuk menyimpan pesan error jika terjadi kegagalan saat fetch data dari server
  const [error, setError] = useState(null);
  
  // Berfungsi untuk menyimpan filter jenis dokumen yang dipilih user ('all', 'MoU', atau 'PKS')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  
  // Berfungsi untuk menyimpan filter status dokumen yang dipilih user ('all', 'Aktif', atau 'Kadaluarsa')
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Berfungsi untuk mengontrol tampilan modal perpanjangan dokumen (true = modal terbuka)
  const [showRenewModal, setShowRenewModal] = useState(false);
  
  // Berfungsi untuk menyimpan data dokumen yang dipilih user untuk diperpanjang
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Berfungsi untuk mengontrol tampilan modal riwayat perpanjangan dokumen
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Berfungsi untuk menyimpan data history perpanjangan yang diambil dari API
  const [historyData, setHistoryData] = useState(null);

  // ========================================
  // HANDLER FUNGSI - MENANGANI INTERAKSI USER
  // ========================================
  
  // Berfungsi untuk menangani klik pada card statistik, lalu menerapkan filter sesuai jenis yang diklik
  const handleStatClick = (filterType, value) => {
    // Jika filter berdasarkan jenis dokumen (MoU/PKS), set documentTypeFilter dan reset statusFilter
    if (filterType === 'documentType') {
      setDocumentTypeFilter(value);
      setStatusFilter('all');
    // Jika filter berdasarkan status (Aktif/Kadaluarsa), set statusFilter dan reset documentTypeFilter
    } else if (filterType === 'status') {
      setStatusFilter(value);
      setDocumentTypeFilter('all');
    }
  };

  // Berfungsi untuk membuka modal perpanjangan dokumen ketika user klik tombol "Perpanjang"
  const handleRenewClick = (doc) => {
    setSelectedDoc(doc); // Simpan dokumen yang dipilih ke state
    setShowRenewModal(true); // Tampilkan modal perpanjangan
  };

  // Berfungsi untuk mengambil dan menampilkan riwayat perpanjangan dokumen berdasarkan ID
  const handleViewHistory = async (docId) => {
    try {
      const token = localStorage.getItem('token'); // Ambil token auth dari localStorage untuk validasi API
      // Fetch data history dari endpoint API dengan menyertakan token authorization
      const response = await fetch(`/api/renewal/${docId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Jika response sukses (status 200), parse JSON dan tampilkan di modal
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
        setShowHistoryModal(true);
      } else {
        alert('Gagal mengambil riwayau perpanjangan'); // Tampilkan alert jika gagal
      }
    } catch (error) {
      console.error('Error fetching history:', error); // Log error ke console untuk debugging
      alert('Terjadi kesalahan saat mengambil riwayat'); // Tampilkan alert ke user
    }
  };

  // ========================================
  // FUNGSI BANTU: MENGHITUNG STATISTIK DOKUMEN
  // ========================================
  // Berfungsi untuk menghitung jumlah dokumen aktif dan kadaluarsa berdasarkan tanggal berakhir
  const calculateStats = (docs) => {
    const today = new Date(); // Buat objek tanggal hari ini
    today.setHours(0, 0, 0, 0); // Reset waktu ke 00:00:00 agar perbandingan hanya berdasarkan tanggal
    
    // Inisialisasi variabel counter untuk masing-masing kategori dokumen
    let activeMou = 0;
    let expiredMou = 0;
    let activePks = 0;
    let expiredPks = 0;
    
    // Loop melalui setiap dokumen untuk dikategorikan
    docs.forEach(doc => {
      // Skip dokumen yang tidak memiliki tanggal berakhir atau formatnya '-'
      if (!doc.cooperationEndDate || doc.cooperationEndDate === '-') return;
      
      // Validasi format tanggal harus YYYY-MM-DD menggunakan regex
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(doc.cooperationEndDate)) {
        console.warn("⚠️ Format tanggal tidak valid:", doc.cooperationEndDate, "dokumen:", doc.id);
        return;
      }
      
      const endDate = new Date(doc.cooperationEndDate); // Konversi string tanggal ke objek Date
      // Validasi apakah tanggal yang dikonversi valid (bukan NaN)
      if (isNaN(endDate.getTime())) {
        console.warn("⚠️ Tanggal tidak valid:", doc.cooperationEndDate, "dokumen:", doc.id);
        return;
      }
      
      endDate.setHours(0, 0, 0, 0); // Reset waktu endDate agar perbandingan akurat
      
      // Jika tanggal berakhir >= hari ini, dokumen masih aktif
      if (endDate >= today) {
        if (doc.documentType === 'MoU') activeMou++; // Tambah counter MoU aktif
        else if (doc.documentType === 'PKS') activePks++; // Tambah counter PKS aktif
      } else {
        // Jika tanggal berakhir < hari ini, dokumen sudah kadaluarsa
        if (doc.documentType === 'MoU') expiredMou++; // Tambah counter MoU expired
        else if (doc.documentType === 'PKS') expiredPks++; // Tambah counter PKS expired
      }
    });

    // Return object statistik yang akan disimpan ke state
    return {
      totalMou: docs.filter(d => d.documentType === 'MoU').length, // Hitung total semua MoU
      totalPks: docs.filter(d => d.documentType === 'PKS').length, // Hitung total semua PKS
      activeCount: activeMou + activePks, // Total dokumen aktif (MoU + PKS)
      expiredCount: expiredMou + expiredPks, // Total dokumen expired (MoU + PKS)
      mou: { active: activeMou, expired: expiredMou }, // Detail statistik MoU
      pks: { active: activePks, expired: expiredPks } // Detail statistik PKS
    };
  };

  // ========================================
  // EFFECT: FETCH DATA SAAT COMPONENT MOUNT
  // ========================================
  // Berfungsi untuk menjalankan side effect: mengambil data dari API saat component pertama kali dirender
  useEffect(() => {
    // Fungsi async untuk fetch data dashboard dari backend
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading true untuk menampilkan spinner
        const token = localStorage.getItem('token'); // Ambil token auth dari localStorage
        
        // Validasi: jika tidak ada token, lempar error untuk redirect ke login
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }
        
        console.log("📊 Fetching dashboard data..."); // Log untuk debugging
        
        // Fetch data dari endpoint API dengan menyertakan token dan timestamp untuk bypass cache
        const response = await fetch(`/api/mous/dashboard?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Handle error response dari server
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Sesi Anda telah berakhir. Silakan login ulang.'); // Error khusus untuk session expired
          }
          throw new Error('Gagal mengambil data dari server'); // Error umum
        }
        
        const data = await response.json(); // Parse response JSON dari server
        
        // Log informasi ringkas data yang diterima untuk debugging
        console.log("✅ Dashboard data received:", {
          totalMou: data.totalMou,
          totalPks: data.totalPks,
          totalDocuments: data.documents?.length
        });
        
        // Validasi: pastikan documents adalah array, jika tidak gunakan array kosong
        const documentsArray = Array.isArray(data.documents) ? data.documents : [];
        // Hitung statistik berdasarkan data dokumen yang diterima
        const calculatedStats = calculateStats(documentsArray);
        
        // Update state dengan data yang sudah diproses
        setStats(calculatedStats); // Simpan statistik ke state
        setDocuments(documentsArray); // Simpan daftar dokumen ke state
        
      } catch (err) {
        console.error("❌ Error fetching dashboard ", err); // Log error detail ke console
        setError(err.message); // Simpan pesan error ke state untuk ditampilkan di UI
        
        // Jika error terkait autentikasi, hapus token dan redirect ke halaman login
        if (err.message.includes('401') || err.message.includes('sesi')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false); // Set loading false di finally block agar selalu dijalankan (sukses/gagal)
      }
    };

    fetchData(); // Jalankan fungsi fetch pertama kali saat component mount
    
    // Setup interval untuk auto-refresh data setiap 5 menit (300000 ms)
    const interval = setInterval(fetchData, 300000);
    
    // Cleanup function: hapus interval saat component unmount untuk mencegah memory leak
    return () => clearInterval(interval);
  }, []); // Empty dependency array = hanya dijalankan sekali saat component pertama kali dirender

  // ========================================
  // FILTERING DOKUMEN BERDASARKAN STATE FILTER
  // ========================================
  // Berfungsi untuk memfilter array dokumen berdasarkan pilihan filter user (jenis dokumen dan status)
  const filteredDocuments = documents.filter(doc => {
    // Filter 1: Jika documentTypeFilter bukan 'all', hanya tampilkan dokumen dengan jenis yang sesuai
    if (documentTypeFilter !== 'all' && doc.documentType !== documentTypeFilter) {
      return false; // Exclude dokumen yang tidak sesuai filter
    }
    
    // Filter 2: Jika statusFilter bukan 'all', lakukan filtering berdasarkan status aktif/expired
    if (statusFilter !== 'all') {
      const today = new Date(); // Ambil tanggal hari ini
      today.setHours(0, 0, 0, 0); // Reset waktu untuk perbandingan akurat
      
      // Konversi string endDate ke objek Date, handle jika null atau '-'
      const endDate = doc.cooperationEndDate ? new Date(doc.cooperationEndDate) : null;
      if (!endDate || doc.cooperationEndDate === '-') return false; // Skip jika tidak ada tanggal
      
      // Validasi format tanggal harus YYYY-MM-DD
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(doc.cooperationEndDate)) {
        return false;
      }
      
      // Validasi apakah tanggal yang dikonversi valid
      if (isNaN(endDate.getTime())) {
        return false;
      }
      
      endDate.setHours(0, 0, 0, 0); // Reset waktu endDate
      
      // Jika filter status 'Aktif', hanya tampilkan dokumen dengan endDate >= hari ini
      if (statusFilter === 'Aktif') {
        return endDate >= today;
      // Jika filter status 'Kadaluarsa', hanya tampilkan dokumen dengan endDate < hari ini
      } else if (statusFilter === 'Kadaluarsa') {
        return endDate < today;
      }
    }
    
    // Jika semua filter lolos, include dokumen ini dalam hasil
    return true;
  });

  // ========================================
  // RENDER: TAMPILAN LOADING STATE
  // ========================================
  // Berfungsi untuk menampilkan UI loading spinner saat data sedang diambil dari server
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Memuat data dashboard...</p>
      </div>
    );
  }

  // ========================================
  // RENDER: TAMPILAN ERROR STATE
  // ========================================
  // Berfungsi untuk menampilkan UI pesan error jika fetch data gagal
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  // ========================================
  // RENDER: TAMPILAN UTAMA DASHBOARD (SUCCESS STATE)
  // ========================================
  return (
    // Container utama dengan padding dan margin untuk layout dashboard
    <div className="flex-grow container mx-auto px-4 py-6 mt-1">
      {/* Judul halaman dashboard */}
      <h3 className="text-xl font-bold text-[#006db0] mb-1">Overview Kerja Sama</h3>
      {/* Subtitle/deskripsi halaman */}
      <p className="text-gray-500 text-sm mb-6">
         Pantau status, masa berlaku dan tindakan yang diperlukan untuk semua dokumen kerja sama
      </p>
      
      {/* Komponen widget yang menampilkan dokumen yang akan segera kadaluarsa (urgent/warning) */}
      <ExpiringStatsWidget />

      {/* Spacer/pembatas vertikal dengan tinggi 24px */}
      <div style={{ height: '24px' }}></div>
      
      {/* Grid container untuk menampilkan 4 card statistik */}
      <div className="stats-grid">
        {/* Card Total MoU - bisa diklik untuk filter dokumen MoU */}
        <div 
          onClick={() => handleStatClick('documentType', 'MoU')} // Trigger filter MoU saat diklik
          style={{ cursor: 'pointer' }} // Ubah cursor jadi pointer untuk indikasi bisa diklik
          title="Klik untuk melihat semua MoU" // Tooltip saat hover
        >
          <StatCard 
            title="Total MoU" // Judul card
            value={stats.totalMou} // Angka total dari state
            subtitle={`${stats.mou?.active || 0} aktif`} // Subtitle menunjukkan jumlah aktif
            icon="fa-file-contract" // Icon Font Awesome
            color="primary" // Warna tema card
          />
        </div>
        
        {/* Card Total PKS - bisa diklik untuk filter dokumen PKS */}
        <div 
          onClick={() => handleStatClick('documentType', 'PKS')} // Trigger filter PKS saat diklik
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat semua PKS"
        >
          <StatCard 
            title="Total PKS" 
            value={stats.totalPks} 
            subtitle={`${stats.pks?.active || 0} aktif`} 
            icon="fa-file-contract" 
            color="primary" 
          />
        </div>
        
        {/* Card Dokumen Aktif - bisa diklik untuk filter status Aktif */}
        <div 
          onClick={() => {
            setDocumentTypeFilter('all'); // Reset filter jenis dokumen
            setStatusFilter('Aktif'); // Set filter status ke Aktif
          }}
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat dokumen aktif"
        >
          <StatCard 
            title="Dokumen Aktif" 
            value={(stats.mou?.active || 0) + (stats.pks?.active || 0)} // Total aktif = MoU aktif + PKS aktif
            subtitle={`${(stats.mou?.active || 0) + (stats.pks?.active || 0)} aktif dari ${stats.totalMou + stats.totalPks} dokumen`} 
            icon="fa-check-circle" 
            color="success" 
          />
        </div>
        
        {/* Card Dokumen Kadaluarsa - bisa diklik untuk filter status Kadaluarsa */}
        <div 
          onClick={() => {
            setDocumentTypeFilter('all'); // Reset filter jenis dokumen
            setStatusFilter('Kadaluarsa'); // Set filter status ke Kadaluarsa
          }}
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat dokumen kadaluarsa"
        >
          <StatCard 
            title="Dokumen Kadaluarsa" 
            value={stats.expiredCount} // Total expired dari state
            subtitle={`${stats.expiredCount} kadaluarsa dari ${stats.totalMou + stats.totalPks} dokumen`} 
            icon="fa-exclamation-circle" 
            color="danger" 
          />
        </div>
      </div>

      {/* Section filter aktif - hanya tampil jika ada filter yang diterapkan */}
      {(documentTypeFilter !== 'all' || statusFilter !== 'all') && (
        <div className="filter-section" style={{ 
          marginBottom: '10px', 
          padding: '15px', 
          backgroundColor: 'rgb(255, 255, 255)', 
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {/* Menampilkan teks filter yang sedang aktif */}
              <span style={{ fontWeight: '500', color: '#0f1729', fontSize: '14px' }}>
                🔍 
                {documentTypeFilter !== 'all' && <strong> {documentTypeFilter}</strong>}
                {statusFilter !== 'all' && <strong> {statusFilter}</strong>}
              </span>
              {/* Menampilkan jumlah dokumen yang sesuai filter */}
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#0b2e4b' }}>
                Menampilkan {filteredDocuments.length} dari {documents.length} dokumen
              </p>
            </div>
            {/* Tombol Reset Filter - mengembalikan semua filter ke 'all' */}
            <button
              onClick={() => {
                setDocumentTypeFilter('all');
                setStatusFilter('all');
              }}
              style={{
                padding: '6px 16px',
                borderRadius: '10px',
                backgroundColor: '#07b8af',
                color: 'white',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: 13
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#008a9a'} // Efek hover
              onMouseLeave={(e) => e.target.style.backgroundColor = '#07b8af'} // Efek hover out
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}
      
      {/* Komponen tabel dokumen - menampilkan data yang sudah difilter */}
      <DocumentTable
        documents={filteredDocuments} // Pass data dokumen yang sudah difilter
        statusFilter={statusFilter === 'Kadaluarsa' ? 'Kadaluarsa' : 'all'} // Pass filter status khusus untuk kolom aksi
        loading={false} // Loading handled by parent, jadi false di sini
        onRefresh={() => {
          window.location.reload(); // Callback untuk refresh halaman
        }}
      />

      {/* Spacer vertikal */}
      <div style={{ height: '24px' }}></div> 

      {/* Komponen grafik/chart untuk visualisasi data statistik */}
      <ChartContainer stats={stats} documents={documents} />
      
      {/* Spacer vertikal besar */}
      <div style={{ height: '50px' }}></div>
      
      {/* ========================================
          MODAL PERPANJANGAN DOKUMEN
          ======================================== */}
      {/* Modal ini hanya dirender jika showRenewModal true DAN selectedDoc ada */}
      {showRenewModal && selectedDoc && (
        // Overlay modal dengan background semi-transparan
        <div style={{
          position: 'fixed', // Position fixed agar menutupi seluruh viewport
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', // Background gelap transparan
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000 // Z-index tinggi agar di atas elemen lain
        }}>
          {/* Container konten modal */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Header modal dengan judul dan tombol close */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                Perpanjang Dokumen
              </h2>
              {/* Tombol close (X) untuk menutup modal */}
              <button 
                onClick={() => {
                  setShowRenewModal(false); // Hide modal
                  setSelectedDoc(null); // Reset selected doc
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'} // Hover effect
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                &times;
              </button>
            </div>
            {/* Body modal: menampilkan info dokumen yang akan diperpanjang */}
            <div style={{ padding: '24px' }}>
              <p><strong>Dokumen:</strong> {selectedDoc.documentNumber || selectedDoc.officeDocNumber || 'N/A'}</p>
              <p><strong>Mitra:</strong> {selectedDoc.institution || 'N/A'}</p>
              <p><strong>Tanggal Berakhir Saat Ini:</strong> {formatDate(selectedDoc.endDate || selectedDoc.cooperationEndDate)}</p>
              
              {/* Tombol tutup modal */}
              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={() => {
                    setShowRenewModal(false);
                    setSelectedDoc(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#cbd5e1'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          MODAL RIWAYAT PERPANJANGAN
          ======================================== */}
      {/* Modal ini hanya dirender jika showHistoryModal true DAN historyData ada */}
      {showHistoryModal && historyData && (
        // Overlay modal dengan background semi-transparan
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          {/* Container konten modal */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Header modal dengan judul dan tombol close */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                Riwayat Perpanjangan
              </h2>
              {/* Tombol close (X) untuk menutup modal */}
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistoryData(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                &times;
              </button>
            </div>
            {/* Body modal: menampilkan detail history perpanjangan */}
            <div style={{ padding: '24px' }}>
              <p><strong>Dokumen:</strong> {historyData.type} - {historyData.institution}</p>
              <p><strong>Jumlah Perpanjangan:</strong> {historyData.renewalCount || 0}x</p>
              {/* Tampilkan catatan terakhir jika ada */}
              {historyData.renewalNotes && (
                <p><strong>Catatan Terakhir:</strong> {historyData.renewalNotes}</p>
              )}
              
              {/* Tombol tutup modal */}
              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={() => {
                    setShowHistoryModal(false);
                    setHistoryData(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#cbd5e1'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================
// FUNGSI BANTU: FORMAT TANGGAL KE BAHASA INDONESIA
// ========================================
// Berfungsi untuk mengonversi string tanggal menjadi format lokal Indonesia (contoh: "5 Maret 2026")
const formatDate = (dateString) => {
  if (!dateString) return '-'; // Return '-' jika tanggal kosong/null
  const date = new Date(dateString); // Konversi string ke objek Date
  // Format tanggal menggunakan locale 'id-ID' dengan tahun, bulan panjang, dan tanggal
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Export komponen Dashboard sebagai default export agar bisa diimpor di file lain
export default Dashboard;