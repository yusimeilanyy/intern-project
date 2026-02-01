import React from 'react';
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

const ChartContainer = ({ stats }) => {

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
     LINE – TREND (FOCUS DATA)
     ========================= */
  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const monthlyData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'MoU Baru',
        data: stats.monthlyTrend?.mou || Array(12).fill(0),
        borderColor: '#00336C',
        backgroundColor: 'rgba(0, 51, 108, 0.15)',
        tension: 0.45,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#00336C',
      },
      {
        label: 'PKS Baru',
        data: stats.monthlyTrend?.pks || Array(12).fill(0),
        borderColor: '#00B5AA',
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
      {/* HANYA BAR CHART */}
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

      {/* LINE CHART */}
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