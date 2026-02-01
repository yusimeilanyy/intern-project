import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ChartContainer from './ChartContainer';
import DocumentTable from './DocumentTable';
import './Dashboard.css';
import ExpiringStatsWidget from './ExpiringStatsWidget'; // ✅ SUDAH ADA

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ TAMBAHAN: Filter untuk jenis dokumen
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all'); // 'all', 'MoU', 'PKS'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Ambil token dari localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }
        
        console.log("📊 Fetching dashboard data...");
        
        // 1. Fetch data dari API backend dengan token
        const response = await fetch(`/api/dashboard?t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
        
        // 2. Simpan data ke state
        setStats({
          totalMou: data.totalMou,
          totalPks: data.totalPks,
          activeCount: data.activeCount,
          expiredCount: data.expiredCount,
          mou: data.mou,
          pks: data.pks
        });
        
        // ✅ PERBAIKAN: Simpan dokumen dengan validasi
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
        
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
        setError(err.message);
        
        // Jika error 401, hapus token dan redirect ke login
        if (err.message.includes('401') || err.message.includes('sesi')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    // 3. Fetch data saat komponen dimount
    fetchData();
    
    // 4. Auto-refresh setiap 5 menit
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  // ✅ TAMBAHAN: Filter dokumen berdasarkan documentType
  const filteredDocuments = documents.filter(doc => {
    if (documentTypeFilter === 'all') return true;
    return doc.documentType === documentTypeFilter;
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
      
      {/* ✅ WIDGET REMINDER - DITAMBAHKAN DI SINI */}
      <ExpiringStatsWidget />
      
      {/* Statistik Utama */}
      <div className="stats-grid">
        <StatCard 
          title="Total MoU" 
          value={stats.totalMou} 
          icon="fa-file-contract" 
          color="primary" 
        />
        <StatCard 
          title="Total PKS" 
          value={stats.totalPks} 
          icon="fa-file-contract" 
          color="success" 
        />
        <StatCard 
          title="Aktif" 
          value={stats.activeCount} 
          icon="fa-check-circle" 
          color="success" 
          subtitle={`+${stats.activeCount - stats.expiredCount} dari total`}
        />
        <StatCard 
          title="Kadaluarsa" 
          value={stats.expiredCount} 
          icon="fa-exclamation-triangle" 
          color="danger" 
        />
      </div>

      {/* Grafik */}
      <ChartContainer stats={stats} />

      {/* ✅ TAMBAHAN: Filter Jenis Dokumen */}
      <div className="filter-section" style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#fff', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', color: '#374151' }}>Filter Jenis Dokumen:</span>
          <button
            onClick={() => setDocumentTypeFilter('all')}
            className={`filter-btn ${documentTypeFilter === 'all' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: documentTypeFilter === 'all' ? 'none' : '1px solid #e5e7eb',
              backgroundColor: documentTypeFilter === 'all' ? '#3b82f6' : '#fff',
              color: documentTypeFilter === 'all' ? '#fff' : '#374151',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Semua ({documents.length})
          </button>
          <button
            onClick={() => setDocumentTypeFilter('MoU')}
            className={`filter-btn ${documentTypeFilter === 'MoU' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: documentTypeFilter === 'MoU' ? 'none' : '1px solid #e5e7eb',
              backgroundColor: documentTypeFilter === 'MoU' ? '#3b82f6' : '#fff',
              color: documentTypeFilter === 'MoU' ? '#fff' : '#374151',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            MoU ({documents.filter(d => d.documentType === 'MoU').length})
          </button>
          <button
            onClick={() => setDocumentTypeFilter('PKS')}
            className={`filter-btn ${documentTypeFilter === 'PKS' ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: documentTypeFilter === 'PKS' ? 'none' : '1px solid #e5e7eb',
              backgroundColor: documentTypeFilter === 'PKS' ? '#10b981' : '#fff',
              color: documentTypeFilter === 'PKS' ? '#fff' : '#374151',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            PKS ({documents.filter(d => d.documentType === 'PKS').length})
          </button>
        </div>
      </div>

      {/* Tabel Dokumen dengan filter */}
      <DocumentTable 
        documents={filteredDocuments} 
        loading={false} 
      />
    </div>
  );
};

export default Dashboard;