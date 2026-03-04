// ========================================
// IMPORT LIBRARY YANG DIBUTUHKAN
// ========================================
// Berfungsi untuk mengimpor React dan hook useState/useEffect yang digunakan untuk manajemen state dan side effect pada component
import React, { useState, useEffect } from 'react';
// Berfungsi untuk mengimpor ikon-ikon dari library Heroicons yang akan digunakan sebagai visual indicator di UI widget
import { 
  BellIcon, // Berfungsi untuk ikon notifikasi/bell yang menandakan ada dokumen perlu perhatian
  CalendarIcon, // Berfungsi untuk ikon kalender yang menampilkan informasi tanggal
  ClockIcon, // Berfungsi untuk ikon jam yang menampilkan informasi sisa waktu/hari
  ExclamationTriangleIcon, // Berfungsi untuk ikon tanda seru yang menandakan status urgent/warning
  ArrowPathIcon, // Berfungsi untuk ikon panah berputar yang menandakan aksi perpanjangan/refresh
  InformationCircleIcon // Berfungsi untuk ikon informasi yang menampilkan detail/history
} from '@heroicons/react/24/outline';

// ========================================
// COMPONENT UTAMA
// ========================================
// Berfungsi untuk mendefinisikan komponen functional ExpiringStatsWidget yang menampilkan widget statistik dokumen yang akan kadaluarsa
export default function ExpiringStatsWidget() {
  // ========================================
  // STATE MANAGEMENT - MENYIMPAN DATA DINAMIS COMPONENT
  // ========================================
  
  // Berfungsi untuk menyimpan objek stats yang berisi data dokumen urgent, warning, dan expired dari API
  const [stats, setStats] = useState({
    urgent: { count: 0, documents: [] }, // Berfungsi untuk menyimpan data dokumen dengan urgensi tinggi (≤7 hari)
    warning: { count: 0, documents: [] }, // Berfungsi untuk menyimpan data dokumen dengan urgensi sedang (8-14 hari)
    expired: { count: 0, documents: [] } // Berfungsi untuk menyimpan data dokumen yang sudah kadaluarsa (tidak ditampilkan di UI)
  });
  
  // Berfungsi untuk menandai apakah data sedang dalam proses loading dari API (true = loading, false = selesai)
  const [loading, setLoading] = useState(true);
  
  // Berfungsi untuk mengontrol state expand/collapse widget (true = konten detail terbuka, false = tertutup)
  const [expanded, setExpanded] = useState(false);
  
  // ✅ STATE TAMBAHAN UNTUK FILTER KATEGORI
  // Berfungsi untuk menyimpan kategori filter yang aktif: 'all', 'urgent', atau 'warning'
  const [activeCategory, setActiveCategory] = useState("all");

  // ✅ STATE TAMBAHAN UNTUK FITUR PERPANJANGAN
  // Berfungsi untuk mengontrol tampilan modal form perpanjangan dokumen
  const [showRenewModal, setShowRenewModal] = useState(false);
  // Berfungsi untuk menyimpan objek dokumen yang dipilih user untuk diperpanjang
  const [selectedDoc, setSelectedDoc] = useState(null);
  // Berfungsi untuk menandai apakah proses submit perpanjangan sedang berjalan (untuk disable tombol dan show loading)
  const [renewalLoading, setRenewalLoading] = useState(false);
  // Berfungsi untuk mengontrol tampilan modal riwayat perpanjangan dokumen
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  // Berfungsi untuk menyimpan data history perpanjangan yang diambil dari API
  const [historyData, setHistoryData] = useState(null);

  // ========================================
  // EFFECT: FETCH DATA SAAT COMPONENT MOUNT
  // ========================================
  // Berfungsi untuk menjalankan side effect: mengambil data statistik dari API saat component pertama kali dirender
  useEffect(() => {
    // Berfungsi untuk mendefinisikan fungsi async yang fetch data dari endpoint API
    const fetchStats = async () => {
      try {
        // Berfungsi untuk mengambil token autentikasi dari localStorage untuk authorization API
        const token = localStorage.getItem('token');
        
        // Berfungsi untuk melakukan HTTP GET request ke endpoint API dengan menyertakan header authorization
        const response = await fetch('/api/dashboard/expiring-stats', {
          headers: { 
            Authorization: `Bearer ${token}` // Berfungsi untuk mengirim token Bearer agar request terautentikasi
          }
        });
        
        // Berfungsi untuk mengecek apakah response dari server sukses (status code 200-299)
        if (response.ok) {
          const data = await response.json(); // Berfungsi untuk parse response JSON dari server
          setStats(data); // Berfungsi untuk update state stats dengan data yang diterima dari API
        } else {
          // Berfungsi untuk log error ke console jika response tidak OK
          console.error('Gagal fetch data:', response.statusText);
        }
      } catch (error) {
        // Berfungsi untuk handle exception/error yang terjadi saat proses fetch
        console.error('Error fetching stats:', error);
      } finally {
        // Berfungsi untuk set loading menjadi false di finally block agar selalu dijalankan (sukses/gagal)
        setLoading(false); // Berfungsi agar UI loading spinner hilang setelah proses selesai
      }
    };

    // Berfungsi untuk menjalankan fungsi fetchStats pertama kali saat component mount
    fetchStats();
    
    // Berfungsi untuk setup interval auto-refresh data setiap 5 menit (300000 milidetik)
    const interval = setInterval(fetchStats, 300000);
    
    // Berfungsi untuk cleanup function: menghapus interval saat component unmount agar tidak ada memory leak
    return () => clearInterval(interval);
  }, []); // Berfungsi untuk dependency array kosong: effect hanya dijalankan sekali saat component pertama kali mount

  // ========================================
  // ✅ HANDLER UNTUK FITUR PERPANJANGAN
  // ========================================
  
  // Berfungsi untuk handler ketika user klik tombol "Perpanjang" pada sebuah dokumen
  const handleRenewClick = (doc) => {
    setSelectedDoc(doc); // Berfungsi untuk menyimpan dokumen yang dipilih ke state selectedDoc
    setShowRenewModal(true); // Berfungsi untuk menampilkan modal form perpanjangan
  };

  // Berfungsi untuk handler async ketika user klik tombol "Lihat History" pada dokumen
  const handleViewHistory = async (docId) => {
    try {
      const token = localStorage.getItem('token'); // Berfungsi untuk ambil token auth dari localStorage
      // Berfungsi untuk fetch data history perpanjangan dari endpoint API dengan parameter docId
      const response = await fetch(`/api/renewal/${docId}/history`, {
        headers: { Authorization: `Bearer ${token}` } // Berfungsi untuk menyertakan token authorization
      });
      
      // Berfungsi untuk cek jika response API sukses
      if (response.ok) {
        const data = await response.json(); // Berfungsi untuk parse JSON response
        setHistoryData(data); // Berfungsi untuk simpan data history ke state
        setShowHistoryModal(true); // Berfungsi untuk tampilkan modal history
      } else {
        // Berfungsi untuk tampilkan alert error jika gagal mengambil data
        alert('Gagal mengambil history perpanjangan');
      }
    } catch (error) {
      // Berfungsi untuk log error ke console debugging
      console.error('Error fetching history:', error);
      // Berfungsi untuk tampilkan alert error ke user
      alert('Terjadi kesalahan saat mengambil history');
    }
  };

  // Berfungsi untuk handler async ketika user submit form perpanjangan dokumen
  const handleRenewSubmit = async (e) => {
    e.preventDefault(); // Berfungsi untuk mencegah default behavior form submit (reload halaman)
    
    const formData = new FormData(e.target); // Berfungsi untuk mengambil data form dari event target
    const newEndDate = formData.get('newEndDate'); // Berfungsi untuk ekstrak nilai input tanggal baru
    const notes = formData.get('notes'); // Berfungsi untuk ekstrak nilai input catatan opsional
    
    // Berfungsi untuk validasi: jika tanggal baru tidak diisi, tampilkan alert dan hentikan proses
    if (!newEndDate) {
      alert('Tanggal berakhir baru wajib diisi');
      return;
    }
    
    try {
      setRenewalLoading(true); // Berfungsi untuk set state loading true agar tombol disabled dan show spinner
      
      const token = localStorage.getItem('token'); // Berfungsi untuk ambil token auth
      // Berfungsi untuk melakukan HTTP PUT request ke endpoint API perpanjangan dengan payload JSON
      const response = await fetch(`/api/renewal/${selectedDoc.id}`, {
        method: 'PUT', // Berfungsi untuk specify method HTTP PUT untuk update resource
        headers: { 
          Authorization: `Bearer ${token}`, // Berfungsi untuk authorization header
          'Content-Type': 'application/json' // Berfungsi untuk specify content type JSON
        },
        body: JSON.stringify({ newEndDate, notes }) // Berfungsi untuk stringify object jadi JSON string untuk request body
      });
      
      // Berfungsi untuk cek jika response API sukses
      if (response.ok) {
        const result = await response.json(); // Berfungsi untuk parse response JSON
        
        // Berfungsi untuk tampilkan alert sukses dengan informasi tanggal baru dan durasi perpanjangan
        alert(`✅ Dokumen berhasil diperpanjang!\n\nTanggal baru: ${new Date(newEndDate).toLocaleDateString('id-ID')}\nPerpanjangan: ${result.document.extensionYears} tahun`);
        
        // Berfungsi untuk fetch ulang data stats dari API agar UI terupdate dengan data terbaru
        const freshResponse = await fetch('/api/dashboard/expiring-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          setStats(freshData); // Berfungsi untuk update state stats dengan data fresh
        }
        
        // Berfungsi untuk menutup modal dan reset state selectedDoc
        setShowRenewModal(false);
        setSelectedDoc(null);
      } else {
        // Berfungsi untuk handle error response dari API
        const error = await response.json();
        alert(`❌ Gagal memperpanjang: ${error.message}`); // Berfungsi untuk tampilkan pesan error dari server
      }
    } catch (error) {
      // Berfungsi untuk handle network error atau exception lainnya
      console.error('Error renewing document:', error);
      alert('Terjadi kesalahan saat memperpanjang dokumen');
    } finally {
      // Berfungsi untuk set loading false di finally block agar tombol selalu enabled kembali
      setRenewalLoading(false);
    }
  };

  // ✅ HANDLER: TANDAI SEBAGAI TIDAK DIPERPANJANG
  // Berfungsi untuk handler async ketika user memilih opsi "Tidak Diperpanjang" pada dokumen kadaluarsa
  const markAsNotRenewed = async (docId) => {
    // Berfungsi untuk konfirmasi ke user sebelum aksi permanen, return jika user batal
    if (!window.confirm("⚠️ Yakin dokumen ini tidak akan diperpanjang? Ini bersifat permanen dan tidak bisa dibatalkan.")) return;

    try {
      const token = localStorage.getItem('token'); // Berfungsi untuk ambil token auth
      // Berfungsi untuk fetch API PATCH untuk update status dokumen menjadi 'Selesai'
      const response = await fetch(`/api/mous/${docId}/status`, {
        method: 'PATCH', // Berfungsi untuk specify method HTTP PATCH untuk partial update
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Selesai' }) // Berfungsi untuk kirim payload update status
      });

      // Berfungsi untuk cek jika response API sukses
      if (response.ok) {
        alert('✅ Dokumen ditandai sebagai "Tidak Diperpanjang".'); // Berfungsi untuk tampilkan alert sukses
        // Berfungsi untuk fetch ulang data stats agar UI terupdate
        const freshResponse = await fetch('/api/dashboard/expiring-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          setStats(freshData);
        }
      } else {
        // Berfungsi untuk handle error response dari API
        const err = await response.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (error) {
      // Berfungsi untuk handle exception/error
      console.error('Error:', error);
      alert('Gagal menandai dokumen.');
    }
  };

  // ========================================
  // FUNGSI BANTU: GET WARNA BADGE BERDASARKAN URGENCY
  // ========================================
  // Berfungsi untuk mengembalikan string class Tailwind CSS berdasarkan level urgensi dokumen
  const getUrgencyBadge = (urgency) => {
    // Berfungsi untuk return class badge merah jika urgensi tinggi
    if (urgency === 'high') return 'bg-red-100 text-red-800 border-red-200';
    // Berfungsi untuk return class badge kuning jika urgensi sedang
    if (urgency === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    // Berfungsi untuk return class badge abu-abu sebagai fallback/default
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ========================================
  // RENDER: SAAT LOADING
  // ========================================
  // Berfungsi untuk menampilkan UI skeleton loading saat data sedang diambil dari API
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ PERBAIKAN: HANYA HITUNG URGENT + WARNING (HAPUS EXPIRED)
  // Berfungsi untuk menghitung total dokumen yang perlu perhatian (urgent + warning saja, expired tidak dihitung)
  const totalDocs = stats.urgent.count + stats.warning.count;

  // ========================================
  // RENDER: TIDAK ADA DOKUMEN
  // ========================================
  // Berfungsi untuk menampilkan UI state "semua aman" jika tidak ada dokumen urgent/warning
  if (totalDocs === 0) {
    return (
      <div className="bg-green-50 rounded-lg border border-green-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-green-600" />
            <h3 className="font-bold text-lg text-green-800">Semua Dokumen Aman</h3>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
            0 dokumen
          </span>
        </div>
        <p className="mt-2 text-green-700 text-sm">
          ✅ Tidak ada dokumen yang akan expired dalam 14 hari ke depan
        </p>
      </div>
    );
  }

  // ========================================
  // RENDER: TAMPILAN UTAMA (ADA DOKUMEN)
  // ========================================
  return (
    <>
      {/* ✅ TAMBAHAN: shadow-sm hover:shadow-md transition-shadow pada container utama */}
      {/* Berfungsi untuk container utama widget dengan styling border, shadow, dan hover effect */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header Widget */}
        {/* Berfungsi untuk header widget yang bisa diklik untuk toggle expand/collapse */}
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-200 transition"
          onClick={() => setExpanded(!expanded)} // Berfungsi untuk toggle state expanded ketika header diklik
        >
          <div className="flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-red-600" />
            <div>
              <h4 className="font-bold text-red-800">Dokumen Perlu Perhatian</h4>
              {/* Berfungsi untuk menampilkan teks hint yang berubah sesuai state expanded */}
              <p className="text-sm text-red-600 mt-1">
                {expanded ? 'Klik untuk sembunyikan' : 'Klik untuk selengkapnya'}
              </p>
            </div>
          </div>
          
          {/* ✅ PERBAIKAN: HANYA TAMPILKAN URGENT + PERINGATAN + TOTAL (HAPUS KADALUARSA) */}
          {/* Berfungsi untuk container flex yang menampilkan angka statistik urgent, warning, dan total */}
          <div className="flex items-center gap-4">
            {/* URGENT */}
            {/* Berfungsi untuk display angka dokumen urgent yang bisa diklik untuk filter kategori */}
            <div 
              className={`text-right cursor-pointer ${
                activeCategory === 'urgent' 
                  ? 'text-red-800 font-bold' 
                  : 'text-red-600 hover:text-red-800'
              }`}
              onClick={() => setActiveCategory('urgent')} // Berfungsi untuk set filter kategori ke 'urgent' saat diklik
            >
              <div className="text-xs font-medium">MENDESAK</div>
              <div className="text-2xl font-bold">{stats.urgent.count}</div>
            </div>
            
            {/* PERINGATAN */}
            {/* Berfungsi untuk display angka dokumen warning yang bisa diklik untuk filter kategori */}
            <div 
              className={`text-right cursor-pointer ${
                activeCategory === 'warning' 
                  ? 'text-yellow-800 font-bold' 
                  : 'text-yellow-600 hover:text-yellow-800'
              }`}
              onClick={() => setActiveCategory('warning')} // Berfungsi untuk set filter kategori ke 'warning' saat diklik
            >
              <div className="text-xs font-medium">PERINGATAN</div>
              <div className="text-2xl font-bold">{stats.warning.count}</div>
            </div>
            
            {/* Berfungsi untuk garis pemisah vertikal antar section angka */}
            <div className="w-px h-8 bg-red-200"></div>
            
            {/* TOTAL */}
            {/* Berfungsi untuk display total dokumen yang bisa diklik untuk reset filter ke 'all' */}
            <div 
              className={`text-right cursor-pointer ${
                activeCategory === 'all' 
                  ? 'text-gray-800 font-bold' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveCategory('all')} // Berfungsi untuk reset filter ke 'all' saat diklik
            >
              <div className="text-xs text-gray-600 font-medium">TOTAL</div>
              <div className="text-2xl font-bold text-gray-800">{totalDocs}</div>
            </div>
          </div>
        </div>

        {/* Content (Collapsible) */}
        {/* Berfungsi untuk conditional render: hanya tampilkan konten detail jika expanded = true */}
        {expanded && (
          <div className="divide-y divide-gray-200">
            {/* Bagian 1: Dokumen URGENT */}
            {/* Berfungsi untuk conditional render section urgent: hanya tampil jika filter urgent/all DAN ada data */}
            {activeCategory === 'urgent' && stats.urgent.count > 0 && (
              <div className="p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <h4 className="font-bold text-red-800">SANGAT MENDESAK (≤7 hari)</h4>
                </div>
                
                {/* Berfungsi untuk container list dokumen dengan scroll vertikal jika overflow */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Berfungsi untuk memetakan array dokumen urgent menjadi list item */}
                  {stats.urgent.documents.map(doc => (
                    <div key={doc.id} className="bg-white p-3 rounded-lg border-l-4 border-red-500 hover:bg-red-100 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Jenis Dokumen & Instansi */}
                          {/* Berfungsi untuk display badge jenis dokumen (PKS/MoU) dan nama instansi */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              doc.type === 'PKS' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="text-sm font-medium">{doc.institution}</span>
                          </div>
                          
                          {/* Tanggal & Sisa Waktu */}
                          {/* Berfungsi untuk display informasi tanggal berakhir dan sisa hari */}
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{new Date(doc.endDate).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-600 font-semibold mt-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>{doc.daysRemaining} hari lagi</span>
                            </div>
                          </div>
                          
                          {/* Pesan Reminder */}
                          {/* Berfungsi untuk display box pesan reminder dengan styling urgent */}
                          <div className="mt-2 bg-red-100 border border-red-200 rounded p-2">
                            <p className="text-xs text-red-800 font-medium">
                              📢 <strong>SEGERA SIAPKAN DOKUMEN DAN LAKUKAN KOORDINASI</strong><br/>
                              Masa berlaku dokumen akan segera berakhir dalam waktu kurang dari 7 hari. <br />
                              Segera lakukan koordinasi dengan pihak terkait untuk memastikan kelengkapan administrasi.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian 2: Dokumen WARNING */}
            {/* Berfungsi untuk conditional render section warning: hanya tampil jika filter warning/all DAN ada data */}
            {activeCategory === 'warning' && stats.warning.count > 0 && (
              <div className="p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-bold text-yellow-800">PERINGATAN (8-14 hari)</h4>
                </div>
                
                {/* Berfungsi untuk container list dokumen warning dengan scroll vertikal */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Berfungsi untuk memetakan array dokumen warning menjadi list item */}
                  {stats.warning.documents.map(doc => (
                    <div key={doc.id} className="bg-white p-3 rounded-lg border-l-4 border-yellow-500 hover:bg-yellow-100 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Jenis Dokumen & Instansi */}
                          {/* Berfungsi untuk display badge jenis dokumen dan nama instansi */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              doc.type === 'PKS' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="text-sm font-medium">{doc.institution}</span>
                          </div>
                          
                          {/* Tanggal & Sisa Waktu */}
                          {/* Berfungsi untuk display informasi tanggal berakhir dan sisa hari */}
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{new Date(doc.endDate).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-600 font-semibold mt-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>{doc.daysRemaining} hari lagi</span>
                            </div>
                          </div>
                          
                          {/* Pesan Reminder */}
                          {/* Berfungsi untuk display box pesan reminder dengan styling warning */}
                          <div className="mt-2 bg-yellow-100 border border-yellow-200 rounded p-2">
                            <p className="text-xs text-yellow-800 font-medium">
                              📢 <strong>SEGERA SIAPKAN DOKUMEN DAN LAKUKAN KOORDINASI</strong><br/>
                              Masa berlaku dokumen akan segera berakhir dalam waktu 8-14 hari. <br />
                              Mohon segera melakukan persiapan dan koordinasi sesuai ketentuan yang berlaku.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ PERBAIKAN: HAPUS SELURUH BAGIAN EXPIRED (KADALUARSA) */}
            {/* Bagian 3: Dokumen EXPIRED - DIHAPUS SEPENUHNYA */}

            {/* Tampilkan pesan jika kategori tidak memiliki dokumen */}
            {/* Berfungsi untuk conditional render pesan empty state jika filter aktif tapi tidak ada data */}
            {activeCategory !== 'all' && 
             ((activeCategory === 'urgent' && stats.urgent.count === 0) ||
              (activeCategory === 'warning' && stats.warning.count === 0)) && (
              <div className="p-6 text-center text-gray-500">
                Tidak ada dokumen dalam kategori ini
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {/* Berfungsi untuk conditional render footer info hanya saat expanded = true */}
        {expanded && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4" />
                <span>Email reminder otomatis dikirim 14 hari & 7 hari sebelum dokumen kadaluarsa</span>
              </div>
              {/* Berfungsi untuk tombol "Sembunyikan" yang menutup konten detail */}
              <button 
                onClick={() => setExpanded(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sembunyikan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ MODAL PERPANJANGAN */}
      {/* Berfungsi untuk conditional render modal form perpanjangan hanya saat showRenewModal = true DAN selectedDoc ada */}
      {showRenewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <ArrowPathIcon className="h-6 w-6 text-green-600" />
              Perpanjang Dokumen
            </h3>
            {/* Berfungsi untuk menampilkan info dokumen yang akan diperpanjang */}
            <p className="text-gray-600 mb-4">
              <strong>{selectedDoc.type}</strong> dengan <strong>{selectedDoc.institution}</strong>
            </p>
            
            {/* Berfungsi untuk form dengan handler submit yang memanggil handleRenewSubmit */}
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              {/* Tanggal Berakhir Baru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berakhir Baru <span className="text-red-500">*</span>
                </label>
                {/* Berfungsi untuk input date picker dengan default value 1 tahun dari sekarang */}
                <input
                  type="date"
                  name="newEndDate"
                  defaultValue={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  min={new Date(Date.now() + 1).toISOString().split('T')[0]} // Berfungsi untuk validasi: tidak boleh pilih tanggal di masa lalu
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {/* Berfungsi untuk hint text bahwa status akan otomatis berubah jadi Aktif */}
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Dokumen akan diperpanjang tanpa membuat dokumen baru. Status berubah menjadi "Aktif".
                </p>
              </div>
              
              {/* Catatan (Opsional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Perpanjangan (Opsional)
                </label>
                {/* Berfungsi untuk textarea input catatan dengan placeholder contoh */}
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Contoh: Perpanjangan sesuai hasil evaluasi tahun 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Tombol Aksi */}
              {/* Berfungsi untuk container flex dengan 2 tombol: Batal dan Submit */}
              <div className="flex gap-2 pt-4 border-t">
                {/* Berfungsi untuk tombol Batal yang menutup modal dan reset state */}
                <button
                  type="button"
                  onClick={() => {
                    setShowRenewModal(false);
                    setSelectedDoc(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                {/* Berfungsi untuk tombol Submit yang disabled saat loading dan menampilkan spinner */}
                <button
                  type="submit"
                  disabled={renewalLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  {renewalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    'Perpanjang Sekarang'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL HISTORY PERPANJANGAN */}
      {/* Berfungsi untuk conditional render modal history hanya saat showHistoryModal = true DAN historyData ada */}
      {showHistoryModal && historyData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
              Riwayat Perpanjangan
            </h3>
            {/* Berfungsi untuk menampilkan info dokumen yang history-nya ditampilkan */}
            <p className="text-gray-600 mb-4">
              <strong>{historyData.type}</strong> - <strong>{historyData.institution}</strong>
            </p>
            
            <div className="space-y-3">
              {/* Berfungsi untuk card menampilkan jumlah total perpanjangan */}
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-700">Jumlah Perpanjangan:</p>
                <p className="text-2xl font-bold text-green-600">{historyData.renewalCount || 0}x</p>
              </div>
              
              {/* Berfungsi untuk conditional render detail history hanya jika renewalCount > 0 */}
              {historyData.renewalCount > 0 && (
                <>
                  {/* Berfungsi untuk card menampilkan catatan terakhir perpanjangan */}
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Catatan Terakhir:</p>
                    <p className="text-sm text-gray-800">{historyData.renewalNotes || '-'}</p>
                  </div>
                  
                  {/* Berfungsi untuk card menampilkan tanggal perpanjangan terakhir */}
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Perpanjangan Terakhir:</p>
                    <p className="text-sm text-gray-800">
                      {historyData.renewedAt 
                        ? new Date(historyData.renewedAt).toLocaleDateString('id-ID') 
                        : '-'}
                    </p>
                  </div>
                  
                  {/* Berfungsi untuk card menampilkan total durasi perpanjangan dalam tahun */}
                  <div className="bg-emerald-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Total Perpanjangan:</p>
                    <p className="text-sm text-gray-800 font-semibold">
                      {historyData.extensionYears || 0} tahun
                    </p>
                  </div>
                </>
              )}
              
              {/* Berfungsi untuk conditional render pesan empty state jika belum ada history */}
              {historyData.renewalCount === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>Belum ada history perpanjangan</p>
                </div>
              )}
            </div>
            
            {/* Berfungsi untuk tombol Tutup yang menutup modal dan reset state */}
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setHistoryData(null);
              }}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}