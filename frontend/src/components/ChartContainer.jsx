import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const ChartContainer = ({ stats, documents = [] }) => {
  // ✅ STATE UNTUK FILTER TAHUN
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  /* =========================
     GENERATE LIST TAHUN DARI DATA
     ========================= */
  const generateYearOptions = () => {
    const years = new Set();
    
    // Ambil tahun dari dokumen yang ada (minimal 2020)
    documents.forEach(doc => {
      if (doc.cooperationStartDate) {
        const year = doc.cooperationStartDate.split('-')[0];
        const yearNum = parseInt(year);
        if (!isNaN(yearNum) && yearNum >= 2020) {
          years.add(yearNum);
        }
      }
    });
    
    // Tambahkan tahun sekarang dan 10 tahun ke depan
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 10; i++) {
      years.add(currentYear + i);
    }
    
    return Array.from(years).sort((a, b) => b - a);
  };

  /* =========================
     BAR – MOU vs PKS (HIDUP)
     ========================= */
  const comparisonData = {
    labels: ['MoU', 'PKS'],
    datasets: [
      {
        label: 'Aktif',
        data: [stats.mou?.active || 0, stats.pks?.active || 0],
        backgroundColor: '#00B5AA',
        hoverBackgroundColor: '#00E0CF',
        borderRadius: 6,
      },
      {
        label: 'Kadaluarsa',
        data: [stats.mou?.expired || 0, stats.pks?.expired || 0],
        backgroundColor: '#FF6B35',
        hoverBackgroundColor: '#FF8A5B',
        borderRadius: 6,
      },
    ],
  };

  /* =========================
     LINE – TREND (HITUNG DARI DOKUMEN)
     ========================= */
  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // ✅ HITUNG DARI DOKUMEN YANG SUDAH ADA (FILTER PER TAHUN)
  const calculateMonthlyTrend = () => {
    const monthlyCount = {
      mou: Array(12).fill(0),
      pks: Array(12).fill(0)
    };

    documents.forEach(doc => {
      const date = doc.cooperationStartDate;
      if (!date) return;
      
      // ✅ Validasi format tanggal YYYY-MM-DD
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        console.warn("⚠️ Format tanggal tidak valid:", date);
        return;
      }
      
      const [year, month] = date.split('-');
      
      // Filter berdasarkan tahun yang dipilih
      if (parseInt(year) !== selectedYear) return;
      
      const monthIndex = parseInt(month) - 1;
      
      if (monthIndex >= 0 && monthIndex < 12) {
        if (doc.documentType === 'MoU') {
          monthlyCount.mou[monthIndex]++;
        } else if (doc.documentType === 'PKS') {
          monthlyCount.pks[monthIndex]++;
        }
      }
    });

    return monthlyCount;
  };

  // ✅ HITUNG TREN DARI DOKUMEN
  const { mou, pks } = calculateMonthlyTrend();

  // ✅ CEK APAKAH ADA DATA
  const hasData = mou.some(val => val > 0) || pks.some(val => val > 0);

  const monthlyData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'MoU Baru',
        data: mou,
        borderColor: '#00336C',
        borderWidth: 2,
        backgroundColor: 'rgba(0, 51, 108, 0.15)',
        tension: 0.45,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#00336C',
      },
      {
        label: 'PKS Baru',
        data: pks,
        borderColor: '#00B5AA',
        borderWidth: 2,
        backgroundColor: 'rgba(0, 181, 170, 0.18)',
        tension: 0.45,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#00B5AA',
      },
    ],
  };

  /* =========================
     OPTIONS – INTERAKTIF
     ========================= */
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#00336C',
          font: { size: 13, weight: 600 },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#00336C',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        padding: 12,
        borderColor: '#00B5AA',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#475569',
          font: { size: 12 },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#475569',
          precision: 0,
          font: { size: 12 },
        },
        grid: {
          color: 'rgba(0,0,0,0.06)',
        },
      },
    },
  };

  return (
    <div className="chart-container">
      {/* BAR CHART */}
      <div className="chart-row">
        <div className="chart-box">
          <h3 className="chart-title">
            <i className="fas fa-chart-bar"></i> Perbandingan MoU & PKS
          </h3>
          <div className="chart-wrapper">
            <Bar
              data={comparisonData}
              options={{
                ...options,
                scales: {
                  x: { stacked: true },
                  y: { stacked: true, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* JARAK ANTAR WIDGET */}
      <div style={{ height: '24px' }}></div> 

      {/* LINE CHART DENGAN FILTER TAHUN */}
      <div className="chart-box full-width">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="chart-title">
            <i className="fas fa-chart-line"></i> Tren Dokumen Baru (Bulanan)
          </h3>
          {/* ✅ DROPDOWN FILTER TAHUN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Tahun :</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '90px'
              }}
            >
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="chart-wrapper">
          {/* ✅ TAMPILKAN PESAN JIKA TIDAK ADA DATA */}
          {hasData ? (
            <Line data={monthlyData} options={options} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-chart-line text-4xl mb-4"></i>
              <p className="text-lg font-medium">Tidak ada data untuk tahun {selectedYear}</p>
              <p className="text-sm mt-2">Dokumen baru akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;