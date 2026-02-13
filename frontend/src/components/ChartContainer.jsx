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
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* BAR CHART - Kiri */}
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <i className="fas fa-chart-bar text-blue-600"></i>
        Perbandingan MoU & PKS
      </h3>
      <div className="h-80">
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

    {/* LINE CHART - Kanan */}
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-chart-line text-green-600"></i>
          Tren Dokumen Baru (Bulanan)
        </h3>
        {/* Filter Tahun */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {generateYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="h-80">
        {/* Tampilkan pesan jika tidak ada data */}
        {hasData ? (
          <Line data={monthlyData} options={options} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <i className="fas fa-chart-line text-4xl mb-3"></i>
            <p className="text-base font-medium">Tidak ada data untuk tahun {selectedYear}</p>
            <p className="text-sm mt-1">Dokumen baru akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default ChartContainer;