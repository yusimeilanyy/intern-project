// ========================================
// IMPORT LIBRARY YANG DIBUTUHKAN
// ========================================
import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CalendarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// ========================================
// COMPONENT UTAMA
// ========================================
export default function ExpiringStatsWidget() {
  // State untuk menyimpan data dari API
  const [stats, setStats] = useState({
    urgent: { count: 0, documents: [] },
    warning: { count: 0, documents: [] },
    expired: { count: 0, documents: [] }
  });
  
  // State untuk loading
  const [loading, setLoading] = useState(true);
  
  // State untuk expand/collapse widget
  const [expanded, setExpanded] = useState(false);
  
  // ✅ STATE TAMBAHAN UNTUK FILTER KATEGORI
  const [activeCategory, setActiveCategory] = useState("all");

  // ✅ STATE TAMBAHAN UNTUK FITUR PERPANJANGAN
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  // ========================================
  // EFFECT: FETCH DATA SAAT COMPONENT MOUNT
  // ========================================
  useEffect(() => {
    // Fungsi untuk fetch data dari API
    const fetchStats = async () => {
      try {
        // Ambil token dari localStorage
        const token = localStorage.getItem('token');
        
        // Fetch data dari API
        const response = await fetch('/api/dashboard/expiring-stats', {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        });
        
        // Cek jika response OK
        if (response.ok) {
          const data = await response.json();
          setStats(data); // Simpan data ke state
        } else {
          console.error('Gagal fetch data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false); // Set loading false setelah selesai
      }
    };

    // Jalankan fetch
    fetchStats();
    
    // Refresh setiap 5 menit (300000 ms)
    const interval = setInterval(fetchStats, 300000);
    
    // Cleanup interval saat component unmount
    return () => clearInterval(interval);
  }, []); // [] = hanya dijalankan sekali saat mount

  // ========================================
  // ✅ HANDLER UNTUK FITUR PERPANJANGAN
  // ========================================
  
  // Handler klik tombol Perpanjang
  const handleRenewClick = (doc) => {
    setSelectedDoc(doc);
    setShowRenewModal(true);
  };

  // Handler klik tombol Lihat History
  const handleViewHistory = async (docId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/renewal/${docId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
        setShowHistoryModal(true);
      } else {
        alert('Gagal mengambil history perpanjangan');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Terjadi kesalahan saat mengambil history');
    }
  };

  // Handler submit form perpanjangan
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newEndDate = formData.get('newEndDate');
    const notes = formData.get('notes');
    
    if (!newEndDate) {
      alert('Tanggal berakhir baru wajib diisi');
      return;
    }
    
    try {
      setRenewalLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/renewal/${selectedDoc.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newEndDate, notes })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        alert(`✅ Dokumen berhasil diperpanjang!\n\nTanggal baru: ${new Date(newEndDate).toLocaleDateString('id-ID')}\nPerpanjangan: ${result.document.extensionYears} tahun`);
        
        // Refresh data
        const freshResponse = await fetch('/api/dashboard/expiring-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          setStats(freshData);
        }
        
        // Tutup modal
        setShowRenewModal(false);
        setSelectedDoc(null);
      } else {
        const error = await response.json();
        alert(`❌ Gagal memperpanjang: ${error.message}`);
      }
    } catch (error) {
      console.error('Error renewing document:', error);
      alert('Terjadi kesalahan saat memperpanjang dokumen');
    } finally {
      setRenewalLoading(false);
    }
  };

  // ✅ HANDLER: TANDAI SEBAGAI TIDAK DIPERPANJANG
  const markAsNotRenewed = async (docId) => {
    if (!window.confirm("⚠️ Yakin dokumen ini tidak akan diperpanjang? Ini bersifat permanen dan tidak bisa dibatalkan.")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mous/${docId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Selesai' })
      });

      if (response.ok) {
        alert('✅ Dokumen ditandai sebagai "Tidak Diperpanjang".');
        // Refresh data
        const freshResponse = await fetch('/api/dashboard/expiring-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (freshResponse.ok) {
          const freshData = await freshResponse.json();
          setStats(freshData);
        }
      } else {
        const err = await response.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal menandai dokumen.');
    }
  };

  // ========================================
  // FUNGSI BANTU: GET WARNA BADGE BERDASARKAN URGENCY
  // ========================================
  const getUrgencyBadge = (urgency) => {
    if (urgency === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (urgency === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // ========================================
  // RENDER: SAAT LOADING
  // ========================================
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
  const totalDocs = stats.urgent.count + stats.warning.count;

  // ========================================
  // RENDER: TIDAK ADA DOKUMEN
  // ========================================
  if (totalDocs === 0) {
    return (
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
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
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Header Widget */}
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 cursor-pointer"
          onClick={() => setExpanded(!expanded)} // Toggle expand/collapse
        >
          <div className="flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-red-600" />
            <div>
              <h4 className="font-bold text-red-800">Dokumen Perlu Perhatian</h4>
              <p className="text-sm text-red-600 mt-1">
                {expanded ? 'Klik untuk sembunyikan' : 'Klik untuk selengkapnya'}
              </p>
            </div>
          </div>
          
          {/* ✅ PERBAIKAN: HANYA TAMPILKAN URGENT + PERINGATAN + TOTAL (HAPUS KADALUARSA) */}
          <div className="flex items-center gap-4">
            {/* URGENT */}
            <div 
              className={`text-right cursor-pointer ${
                activeCategory === 'urgent' 
                  ? 'text-red-800 font-bold' 
                  : 'text-red-600 hover:text-red-800'
              }`}
              onClick={() => setActiveCategory('urgent')}
            >
              <div className="text-xs font-medium">URGENT</div>
              <div className="text-2xl font-bold">{stats.urgent.count}</div>
            </div>
            
            {/* PERINGATAN */}
            <div 
              className={`text-right cursor-pointer ${
                activeCategory === 'warning' 
                  ? 'text-yellow-800 font-bold' 
                  : 'text-yellow-600 hover:text-yellow-800'
              }`}
              onClick={() => setActiveCategory('warning')}
            >
              <div className="text-xs font-medium">PERINGATAN</div>
              <div className="text-2xl font-bold">{stats.warning.count}</div>
            </div>
            
            <div className="w-px h-8 bg-red-200"></div>
            
            {/* TOTAL */}
            <div 
              className={`text-right cursor-pointer ${
                activeCategory === 'all' 
                  ? 'text-gray-800 font-bold' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveCategory('all')}
            >
              <div className="text-xs text-gray-600 font-medium">TOTAL</div>
              <div className="text-2xl font-bold text-gray-800">{totalDocs}</div>
            </div>
          </div>
        </div>

        {/* Content (Collapsible) */}
        {expanded && (
          <div className="divide-y divide-gray-200">
            {/* Bagian 1: Dokumen URGENT */}
            {activeCategory === 'urgent' && stats.urgent.count > 0 && (
              <div className="p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <h4 className="font-bold text-red-800">⚠️ SANGAT URGENT (≤7 hari)</h4>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.urgent.documents.map(doc => (
                    <div key={doc.id} className="bg-white p-3 rounded-lg border-l-4 border-red-500 hover:bg-red-100 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Jenis Dokumen & Instansi */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              doc.type === 'PKS' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="text-sm font-medium">{doc.institution}</span>
                          </div>
                          
                          {/* Tanggal & Sisa Waktu */}
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
            {activeCategory === 'warning' && stats.warning.count > 0 && (
              <div className="p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-bold text-yellow-800">⏳ PERINGATAN (8-14 hari)</h4>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.warning.documents.map(doc => (
                    <div key={doc.id} className="bg-white p-3 rounded-lg border-l-4 border-yellow-500 hover:bg-yellow-100 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Jenis Dokumen & Instansi */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              doc.type === 'PKS' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {doc.type}
                            </span>
                            <span className="text-sm font-medium">{doc.institution}</span>
                          </div>
                          
                          {/* Tanggal & Sisa Waktu */}
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
        {expanded && (
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4" />
                <span>Email reminder otomatis dikirim 14 hari & 7 hari sebelum dokumen kadaluarsa</span>
              </div>
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
      {showRenewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <ArrowPathIcon className="h-6 w-6 text-green-600" />
              Perpanjang Dokumen
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedDoc.type}</strong> dengan <strong>{selectedDoc.institution}</strong>
            </p>
            
            <form onSubmit={handleRenewSubmit} className="space-y-4">
              {/* Tanggal Berakhir Baru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berakhir Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="newEndDate"
                  defaultValue={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  min={new Date(Date.now() + 1).toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Dokumen akan diperpanjang tanpa membuat dokumen baru. Status berubah menjadi "Aktif".
                </p>
              </div>
              
              {/* Catatan (Opsional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Perpanjangan (Opsional)
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Contoh: Perpanjangan sesuai hasil evaluasi tahun 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Tombol Aksi */}
              <div className="flex gap-2 pt-4 border-t">
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
      {showHistoryModal && historyData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
              Riwayat Perpanjangan
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>{historyData.type}</strong> - <strong>{historyData.institution}</strong>
            </p>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium text-gray-700">Jumlah Perpanjangan:</p>
                <p className="text-2xl font-bold text-green-600">{historyData.renewalCount || 0}x</p>
              </div>
              
              {historyData.renewalCount > 0 && (
                <>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Catatan Terakhir:</p>
                    <p className="text-sm text-gray-800">{historyData.renewalNotes || '-'}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Perpanjangan Terakhir:</p>
                    <p className="text-sm text-gray-800">
                      {historyData.renewedAt 
                        ? new Date(historyData.renewedAt).toLocaleDateString('id-ID') 
                        : '-'}
                    </p>
                  </div>
                  
                  <div className="bg-emerald-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Total Perpanjangan:</p>
                    <p className="text-sm text-gray-800 font-semibold">
                      {historyData.extensionYears || 0} tahun
                    </p>
                  </div>
                </>
              )}
              
              {historyData.renewalCount === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>Belum ada history perpanjangan</p>
                </div>
              )}
            </div>
            
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