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

  const handleStatClick = (filterType, value) => {
    if (filterType === 'documentType') {
      setDocumentTypeFilter(value);
      setStatusFilter('all');
    } else if (filterType === 'status') {
      setStatusFilter(value);
      setDocumentTypeFilter('all');
    }
  };

  // ✅ PERBAIKAN: calculateStats dengan validasi tanggal
  const calculateStats = (docs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let activeMou = 0;
    let expiredMou = 0;
    let activePks = 0;
    let expiredPks = 0;

    docs.forEach(doc => {
      if (!doc.cooperationEndDate || doc.cooperationEndDate === '-') return;
      
      // ✅ VALIDASI FORMAT TANGGAL
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

  // ✅ PERBAIKAN: Filter dengan validasi tanggal
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
    <div className="dashboard-container">
      <h1 className="dashboard-title">Ringkasan MoU & PKS</h1>
      
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
            color="success" 
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
            color="success" 
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
      </div>

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

      
      <DocumentTable 
        documents={filteredDocuments} 
        loading={false} 
      />
      
      <div style={{ height: '24px' }}></div> 

      <ChartContainer stats={stats} documents={documents} />
    </div>
  );
};

export default Dashboard;