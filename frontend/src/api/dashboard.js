import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ChartContainer from './ChartContainer';
import DocumentTable from './DocumentTable';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch data dari API backend
        const response = await fetch('/api/dashboard');
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data dari server');
        }
        
        const data = await response.json();
        
        // 2. Simpan data ke state
        setStats({
          totalMou: data.totalMou,
          totalPks: data.totalPks,
          activeCount: data.activeCount,
          expiredCount: data.expiredCount,
          mou: data.mou,
          pks: data.pks
        });
        
        setDocuments(data.documents);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // 3. Fetch data saat komponen dimount
    fetchData();
    
    // 4. Opsional: Auto-refresh setiap 5 menit
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

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
        <p className="error-message">Error: {error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard MoU & PKS</h1>
      
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

      {/* Tabel Dokumen */}
      <DocumentTable 
        documents={documents} 
        loading={false} 
      />
    </div>
  );
};

export default Dashboard;