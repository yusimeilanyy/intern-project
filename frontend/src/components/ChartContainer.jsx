import React from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler, // ✅ TAMBAHKAN INI
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler, // ✅ TAMBAHKAN INI
);

const ChartContainer = ({ stats }) => {
  // Pie Chart - Status Distribution
  const statusData = {
    labels: ['Aktif', 'Kadaluarsa', 'Akan Kadaluarsa'],
    datasets: [
      {
        data: [
          stats.activeCount || 0,
          stats.expiredCount || 0,
          stats.expiringSoonCount || 0
        ],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  // Bar Chart - MoU vs PKS
  const comparisonData = {
    labels: ['MoU', 'PKS'],
    datasets: [
      {
        label: 'Aktif',
        data: [stats.mou?.active || 0, stats.pks?.active || 0],
        backgroundColor: '#10b981',
      },
      {
        label: 'Kadaluarsa',
        data: [stats.mou?.expired || 0, stats.pks?.expired || 0],
        backgroundColor: '#ef4444',
      },
    ],
  };

  // Line Chart - Monthly Trend
  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'MoU Baru',
        data: stats.monthlyTrend?.mou || Array(12).fill(0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'PKS Baru',
        data: stats.monthlyTrend?.pks || Array(12).fill(0),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-row">
        <div className="chart-box">
          <h3 className="chart-title">
            <i className="fas fa-chart-pie"></i> Distribusi Status Dokumen
          </h3>
          <div className="chart-wrapper">
            <Pie data={statusData} options={options} />
          </div>
        </div>

        <div className="chart-box">
          <h3 className="chart-title">
            <i className="fas fa-chart-bar"></i> Perbandingan MoU vs PKS
          </h3>
          <div className="chart-wrapper">
            <Bar 
              data={comparisonData} 
              options={{ 
                ...options, 
                scales: { 
                  x: { stacked: true }, 
                  y: { stacked: true, beginAtZero: true } 
                } 
              }} 
            />
          </div>
        </div>
      </div>

      <div className="chart-box full-width">
        <h3 className="chart-title">
          <i className="fas fa-chart-line"></i> Tren Dokumen Baru (Bulanan)
        </h3>
        <div className="chart-wrapper">
          <Line data={monthlyData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;