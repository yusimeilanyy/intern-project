import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ChartContainer from './ChartContainer';
import DocumentTable from './DocumentTable';
import './Dashboard.css';
import ExpiringStatsWidget from './ExpiringStatsWidget';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const handleStatClick = (filterType, value) => {
    if (filterType === 'documentType') {
      setDocumentTypeFilter(value);
      setStatusFilter('all');
    } else if (filterType === 'status') {
      setStatusFilter(value);
      setDocumentTypeFilter('all');
    }
  };

  const handleRenewClick = (doc) => {
    setSelectedDoc(doc);
    setShowRenewModal(true);
  };

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
        alert('Gagal mengambil riwayau perpanjangan');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Terjadi kesalahan saat mengambil riwayat');
    }
  };

  const calculateStats = (docs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let activeMou = 0;
    let expiredMou = 0;
    let activePks = 0;
    let expiredPks = 0;
    docs.forEach(doc => {
      if (!doc.cooperationEndDate || doc.cooperationEndDate === '-') return;
      
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(doc.cooperationEndDate)) {
        console.warn("⚠️ Format tanggal tidak valid:", doc.cooperationEndDate, "dokumen:", doc.id);
        return;
      }
      
      const endDate = new Date(doc.cooperationEndDate);
      if (isNaN(endDate.getTime())) {
        console.warn("⚠️ Tanggal tidak valid:", doc.cooperationEndDate, "dokumen:", doc.id);
        return;
      }
      
      endDate.setHours(0, 0, 0, 0);
      
      if (endDate >= today) {
        if (doc.documentType === 'MoU') activeMou++;
        else if (doc.documentType === 'PKS') activePks++;
      } else {
        if (doc.documentType === 'MoU') expiredMou++;
        else if (doc.documentType === 'PKS') expiredPks++;
      }
    });

    return {
      totalMou: docs.filter(d => d.documentType === 'MoU').length,
      totalPks: docs.filter(d => d.documentType === 'PKS').length,
      activeCount: activeMou + activePks,
      expiredCount: expiredMou + expiredPks,
      mou: { active: activeMou, expired: expiredMou },
      pks: { active: activePks, expired: expiredPks }
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }
        
        console.log("📊 Fetching dashboard data...");
        
        const response = await fetch(`/api/mous/dashboard?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Sesi Anda telah berakhir. Silakan login ulang.');
          }
          throw new Error('Gagal mengambil data dari server');
        }
        
        const data = await response.json();
        
        console.log("✅ Dashboard data received:", {
          totalMou: data.totalMou,
          totalPks: data.totalPks,
          totalDocuments: data.documents?.length
        });
        
        const documentsArray = Array.isArray(data.documents) ? data.documents : [];
        const calculatedStats = calculateStats(documentsArray);
        
        setStats(calculatedStats);
        setDocuments(documentsArray);
        
      } catch (err) {
        console.error("❌ Error fetching dashboard ", err);
        setError(err.message);
        
        if (err.message.includes('401') || err.message.includes('sesi')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const filteredDocuments = documents.filter(doc => {
    if (documentTypeFilter !== 'all' && doc.documentType !== documentTypeFilter) {
      return false;
    }
    
    if (statusFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = doc.cooperationEndDate ? new Date(doc.cooperationEndDate) : null;
      if (!endDate || doc.cooperationEndDate === '-') return false;
      
      // ✅ VALIDASI FORMAT TANGGAL
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(doc.cooperationEndDate)) {
        return false;
      }
      
      if (isNaN(endDate.getTime())) {
        return false;
      }
      
      endDate.setHours(0, 0, 0, 0);
      
      if (statusFilter === 'Aktif') {
        return endDate >= today;
      } else if (statusFilter === 'Kadaluarsa') {
        return endDate < today;
      }
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Memuat data dashboard...</p>
      </div>
    );
  }

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

  return (
    <div className="flex-grow container mx-auto px-4 py-6 mt-1">
      <h2 className="text-xl font-bold text-[#006db0] mb-1">Overview Kerja Sama</h2>
      <p className="text-gray-500 text-sm mb-6">
         Pantau status, masa berlaku dan tindakan yang diperlukan untuk semua dokumen kerja sama
      </p>
      
      <ExpiringStatsWidget />

      <div style={{ height: '24px' }}></div>
      
      <div className="stats-grid">
        <div 
          onClick={() => handleStatClick('documentType', 'MoU')} 
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat semua MoU"
        >
          <StatCard 
            title="Total MoU" 
            value={stats.totalMou} 
            subtitle={`${stats.mou?.active || 0} aktif`} 
            icon="fa-file-contract" 
            color="primary" 
          />
        </div>
        <div 
          onClick={() => handleStatClick('documentType', 'PKS')} 
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
        <div 
          onClick={() => {
            setDocumentTypeFilter('all');
            setStatusFilter('Aktif');
          }}
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat dokumen aktif"
        >
          <StatCard 
            title="Dokumen Aktif" 
            value={(stats.mou?.active || 0) + (stats.pks?.active || 0)} 
            subtitle={`${(stats.mou?.active || 0) + (stats.pks?.active || 0)} aktif dari ${stats.totalMou + stats.totalPks} dokumen`} 
            icon="fa-check-circle" 
            color="success" 
          />
        </div>
        {/* ✅ TAMBAHKAN STAT CARD BARU UNTUK DOKUMEN KADALUARSA */}
        <div 
          onClick={() => {
            setDocumentTypeFilter('all');
            setStatusFilter('Kadaluarsa');
          }}
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat dokumen kadaluarsa"
        >
          <StatCard 
            title="Dokumen Kadaluarsa" 
            value={stats.expiredCount} 
            subtitle={`${stats.expiredCount} dari ${stats.totalMou + stats.totalPks} dokumen`} 
            icon="fa-exclamation-circle" 
            color="danger" 
          />
        </div>
      </div>

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
        <span style={{ fontWeight: '500', color: '#0f1729', fontSize: '14px' }}>
          🔍 
          {documentTypeFilter !== 'all' && <strong> {documentTypeFilter}</strong>}
          {statusFilter !== 'all' && <strong> {statusFilter}</strong>}
        </span>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#0b2e4b' }}>
          Menampilkan {filteredDocuments.length} dari {documents.length} dokumen
        </p>
      </div>
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
        onMouseEnter={(e) => e.target.style.backgroundColor = '#008a9a'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#07b8af'}
      >
        Reset Filter
      </button>
    </div>
  </div>
)}
      
<DocumentTable
  documents={filteredDocuments}
  statusFilter={statusFilter === 'Kadaluarsa' ? 'Kadaluarsa' : 'all'}
  loading={false}
  onRefresh={() => {
    window.location.reload();
  }}
/>

      
      <div style={{ height: '24px' }}></div> 

      <ChartContainer stats={stats} documents={documents} />
      
      {/* ✅ MODAL PERPANJANGAN */}
      {showRenewModal && selectedDoc && (
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
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
              <button 
                onClick={() => {
                  setShowRenewModal(false);
                  setSelectedDoc(null);
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
            <div style={{ padding: '24px' }}>
              <p><strong>Dokumen:</strong> {selectedDoc.documentNumber || selectedDoc.officeDocNumber || 'N/A'}</p>
              <p><strong>Mitra:</strong> {selectedDoc.institution || 'N/A'}</p>
              <p><strong>Tanggal Berakhir Saat Ini:</strong> {formatDate(selectedDoc.endDate || selectedDoc.cooperationEndDate)}</p>
              
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

      {/* ✅ MODAL HISTORY */}
      {showHistoryModal && historyData && (
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
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
            <div style={{ padding: '24px' }}>
              <p><strong>Dokumen:</strong> {historyData.type} - {historyData.institution}</p>
              <p><strong>Jumlah Perpanjangan:</strong> {historyData.renewalCount || 0}x</p>
              {historyData.renewalNotes && (
                <p><strong>Catatan Terakhir:</strong> {historyData.renewalNotes}</p>
              )}
              
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

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default Dashboard;