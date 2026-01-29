import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import ChartContainer from './ChartContainer';
import DocumentTable from './DocumentTable';
import './Dashboard.css'; // ← Path yang benar (tanpa "pages/")

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK DATA (hapus ini setelah backend siap)
    const mockStats = {
      totalMou: 25,
      totalPks: 18,
      activeCount: 35,
      expiredCount: 5,
      expiringSoonCount: 3,
      mou: { active: 20, expired: 5 },
      pks: { active: 15, expired: 3 },
      monthlyTrend: {
        mou: [2, 3, 1, 4, 2, 3, 1, 2, 4, 3, 2, 1],
        pks: [1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 3, 2]
      }
    };

    const mockDocuments = [
      {
        id: 1,
        type: 'MoU',
        documentNumber: 'MoU/001/2024',
        partnerName: 'Pemda Jakarta',
        startDate: '2024-01-15',
        endDate: '2025-01-15',
        status: 'active'
      },
      {
        id: 2,
        type: 'PKS',
        documentNumber: 'PKS/002/2024',
        partnerName: 'Universitas Indonesia',
        startDate: '2024-02-01',
        endDate: '2025-02-01',
        status: 'active'
      },
      {
        id: 3,
        type: 'MoU',
        documentNumber: 'MoU/003/2023',
        partnerName: 'Pemda Bandung',
        startDate: '2023-03-10',
        endDate: '2024-03-10',
        status: 'expired'
      }
    ];

    setTimeout(() => {
      setStats(mockStats);
      setDocuments(mockDocuments);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Memuat data dashboard...</p>
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
          value={stats?.totalMou || 0} 
          icon="fa-file-contract" 
          color="primary" 
        />
        <StatCard 
          title="Total PKS" 
          value={stats?.totalPks || 0} 
          icon="fa-file-contract" 
          color="success" 
        />
        <StatCard 
          title="Aktif" 
          value={stats?.activeCount || 0} 
          icon="fa-check-circle" 
          color="success" 
          subtitle={`+${stats?.activeCount - stats?.expiredCount} dari total`}
        />
        <StatCard 
          title="Kadaluarsa" 
          value={stats?.expiredCount || 0} 
          icon="fa-exclamation-triangle" 
          color="danger" 
        />
      </div>

      {/* Grafik */}
      <ChartContainer stats={stats} />

      {/* Tabel Dokumen */}
      <DocumentTable documents={documents} loading={loading} />
    </div>
  );
};

export default Dashboard;