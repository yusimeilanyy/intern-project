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
  
  // ✅ TAMBAHKAN STATE UNTUK FILTER STATUS
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Aktif', 'Kadaluarsa'

  // ✅ TAMBAHKAN HANDLER UNTUK KLIK STAT CARDS
  const handleStatClick = (filterType, value) => {
    if (filterType === 'documentType') {
      setDocumentTypeFilter(value);
      setStatusFilter('all'); // Reset status filter
    } else if (filterType === 'status') {
      setStatusFilter(value);
      setDocumentTypeFilter('all'); // Reset document type filter
    }
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
        
        const response = await fetch(`/api/dashboard?t=${Date.now()}`, {
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
        
        setStats({
          totalMou: data.totalMou,
          totalPks: data.totalPks,
          activeCount: data.activeCount,
          expiredCount: data.expiredCount,
          mou: data.mou,
          pks: data.pks
        });
        
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
        
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
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

  // ✅ FILTER DOKUMEN BERDASARKAN KEDUA FILTER (DOCUMENT TYPE + STATUS)
  const filteredDocuments = documents.filter(doc => {
    // Filter by Document Type
    if (documentTypeFilter !== 'all' && doc.documentType !== documentTypeFilter) {
      return false;
    }
    
    // Filter by Status (Aktif/Kadaluarsa berdasarkan tanggal)
    if (statusFilter !== 'all') {
      const today = new Date();
      const endDate = doc.cooperationEndDate ? new Date(doc.cooperationEndDate) : null;
      
      if (!endDate || doc.cooperationEndDate === '-') return false;
      
      if (statusFilter === 'Aktif') {
        return endDate > today;
      } else if (statusFilter === 'Kadaluarsa') {
        return endDate <= today;
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
    <div className="dashboard-container">
      <h1 className="dashboard-title">Ringkasan MoU & PKS</h1>
      
      {/* ✅ WIDGET REMINDER */}
      <ExpiringStatsWidget />
      
      {/* ✅ STAT CARDS DENGAN ONCLICK - WRAP DALAM DIV KLIKABLE */}
      <div className="stats-grid">
        <div 
          onClick={() => handleStatClick('documentType', 'MoU')} 
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat semua MoU"
        >
          <StatCard 
            title="Total MoU" 
            value={stats.totalMou} 
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
            icon="fa-file-contract" 
            color="success" 
          />
        </div>
        <div 
          onClick={() => handleStatClick('status', 'Aktif')} 
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat dokumen aktif"
        >
          <StatCard 
            title="Aktif" 
            value={stats.activeCount} 
            icon="fa-check-circle" 
            color="success" 
            subtitle={`+${stats.activeCount - stats.expiredCount} dari total`}
          />
        </div>
        <div 
          onClick={() => handleStatClick('status', 'Kadaluarsa')} 
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat dokumen kadaluarsa"
        >
          <StatCard 
            title="Kadaluarsa" 
            value={stats.expiredCount} 
            icon="fa-exclamation-triangle" 
            color="danger" 
          />
        </div>
      </div>

      {/* Grafik */}
      <ChartContainer stats={stats} />

      {/* ✅ TAMBAHKAN INFO FILTER AKTIF */}
      {(documentTypeFilter !== 'all' || statusFilter !== 'all') && (
        <div className="filter-section" style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          borderLeft: '4px solid #2196f3',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: '600', color: '#1565c0', fontSize: '14px' }}>
                🔍 Filter Aktif: 
                {documentTypeFilter !== 'all' && <strong> {documentTypeFilter}</strong>}
                {statusFilter !== 'all' && <strong> {statusFilter}</strong>}
              </span>
              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#546e7a' }}>
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
                borderRadius: '6px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1565c0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#1976d2'}
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Tabel Dokumen dengan filter LENGKAP */}
      <DocumentTable 
        documents={filteredDocuments} 
        loading={false} 
      />
    </div>
  );
};

export default Dashboard;