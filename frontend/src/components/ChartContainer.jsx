import React, { useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
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
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartContainer = ({ stats, documents = [] }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  /* =========================
     THEME (ORANGE + TEAL) - ENHANCED
     ========================= */
  const colors = {
    navy: "#c7632a",
    navySoft: "rgba(199, 99, 42, 0.12)",
    teal: "#07b8af",
    tealSoft: "rgba(7, 184, 175, 0.15)",
    tealDark: "#008a9a",
    orange: "#FF6B35",
    orangeSoft: "rgba(255, 107, 53, 0.15)",
    orangeDark: "#D35400",
    text: "#0F172A",
    muted: "#64748B",
    grid: "rgba(2, 6, 23, 0.06)",
    cardBorder: "rgba(2, 6, 23, 0.08)",
    cardShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
  };

  /* =========================
     YEAR OPTIONS
     ========================= */
  const yearOptions = useMemo(() => {
    const years = new Set();
    documents.forEach((doc) => {
      if (doc.cooperationStartDate) {
        const yearNum = parseInt(doc.cooperationStartDate.split("-")[0], 10);
        if (!isNaN(yearNum) && yearNum >= 2020) years.add(yearNum);
      }
    });
    const currentYear = new Date().getFullYear();
    for (let i = 0; i <= 5; i++) years.add(currentYear + i);
    return Array.from(years).sort((a, b) => b - a);
  }, [documents]);

  /* =========================
     BAR – MOU vs PKS - ENHANCED
     ========================= */
  const comparisonData = useMemo(
    () => ({
      labels: ["MoU", "PKS"],
      datasets: [
        {
          label: "Aktif",
          data: [stats.mou?.active || 0, stats.pks?.active || 0],
          backgroundColor: colors.teal,
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: 8,
          maxBarThickness: 50,
          categoryPercentage: 0.85,
          barPercentage: 0.95,
          hoverBackgroundColor: colors.tealDark,
        },
        {
          label: "Kadaluarsa",
          data: [stats.mou?.expired || 0, stats.pks?.expired || 0],
          backgroundColor: colors.orange,
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: 8,
          maxBarThickness: 50,
          categoryPercentage: 0.85,
          barPercentage: 0.95,
          hoverBackgroundColor: colors.orangeDark,
        },
      ],
    }),
    [stats, colors]
  );

  /* =========================
     LINE – MONTHLY TREND - ENHANCED
     ========================= */
  const monthlyLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const { mou, pks } = useMemo(() => {
    const monthlyCount = {
      mou: Array(12).fill(0),
      pks: Array(12).fill(0),
    };

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    documents.forEach((doc) => {
      const date = doc.cooperationStartDate;
      if (!date || !datePattern.test(date)) return;

      const [year, month] = date.split("-");
      if (parseInt(year, 10) !== selectedYear) return;

      const monthIndex = parseInt(month, 10) - 1;
      if (monthIndex < 0 || monthIndex > 11) return;

      if (doc.documentType === "MoU") monthlyCount.mou[monthIndex] += 1;
      if (doc.documentType === "PKS") monthlyCount.pks[monthIndex] += 1;
    });

    return monthlyCount;
  }, [documents, selectedYear]);

  const hasData = useMemo(
    () => mou.some((v) => v > 0) || pks.some((v) => v > 0),
    [mou, pks]
  );

  const monthlyData = useMemo(
    () => ({
      labels: monthlyLabels,
      datasets: [
        {
          label: "MoU Baru",
          data: mou,
          borderColor: colors.teal,
          backgroundColor: colors.tealSoft,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.teal,
          // ✅ jangan ada border putih, biar sama seperti legend bulat solid
          pointBorderColor: "transparent",
          pointBorderWidth: 0,
          pointHoverBackgroundColor: colors.tealDark,
          pointHoverBorderColor: "transparent",
        },
        {
          label: "PKS Baru",
          data: pks,
          borderColor: colors.orange,
          backgroundColor: colors.orangeSoft,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.orange,
          pointBorderColor: "transparent",
          pointBorderWidth: 0,
          pointHoverBackgroundColor: colors.orangeDark,
          pointHoverBorderColor: "transparent",
        },
      ],
    }),
    [mou, pks, colors]
  );

  /* =========================
     OPTIONS – ENHANCED VISUAL
     ========================= */
  const baseOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 12, bottom: 6, left: 12 } },
      interaction: {
        mode: "index",
        intersect: false,
        axis: "x",
      },
      plugins: {
        legend: {
          position: "bottom",
          align: "center",
          maxHeight: 36,
          labels: {
            color: "#64748b",
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: "circle",
            padding: 12,
            font: { size: 13, weight: "500", family: "inherit" },
            generateLabels: (chart) => {
              const original =
                ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
              return original.map((l) => ({
                ...l,
                pointStyle: "circle",
                lineWidth: 0,
                strokeStyle: "transparent",
              }));
            },
          },
        },
        tooltip: {
          backgroundColor: "#fff",
          titleColor: colors.text,
          titleFont: { weight: "600" },
          bodyColor: colors.muted,
          padding: 12,
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          bodyFont: { size: 11 },
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: colors.muted,
            font: { size: 11, weight: "500" },
            maxRotation: 0,
            minRotation: 0,
          },
          grid: {
            display: false,
            drawBorder: false,
          },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: colors.muted,
            precision: 0,
            font: { size: 11, weight: "500" },
            stepSize: 1,
          },
          grid: {
            color: colors.grid,
            drawBorder: false,
          },
          border: { display: false },
        },
      },
      animation: {
        duration: 800,
        easing: "easeOutQuart",
      },
    }),
    [colors]
  );

  const cardClass = "bg-white rounded-xl border";
  const cardBorderStyle = {
    borderColor: colors.cardBorder,
    boxShadow: colors.cardShadow,
    transition: "all 0.3s ease",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* BAR CARD - header kiri */}
      <div
        className={cardClass}
        style={cardBorderStyle}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.08)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = colors.cardShadow)}
      >
<div
  className="pt-5 pb-3 mt-3"
  style={{ paddingLeft: 28, paddingRight: 28 }}
>
          {/* ✅ judul & subjudul pojok kiri */}
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Perbandingan MoU & PKS
              </h3>
              <p className="stat-subtitle mt-1" style={{ color: colors.muted }}>
                Status aktif vs kadaluarsa
              </p>
            </div>
            <div />
          </div>
        </div>

        <div className="px-4 pb-4 pt-1 mt-3">
          <div className="h-56">
            <Bar
              data={comparisonData}
              options={{
                ...baseOptions,
                scales: {
                  x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                      color: colors.muted,
                      font: { size: 11, weight: "500" },
                      maxRotation: 0,
                      minRotation: 0,
                    },
                    border: { display: false },
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                      color: colors.muted,
                      precision: 0,
                      font: { size: 11, weight: "500" },
                      stepSize: 1,
                    },
                    grid: { color: colors.grid },
                    border: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* LINE CARD - header kiri + Tahun rapi */}
      <div
        className={cardClass}
        style={cardBorderStyle}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.08)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = colors.cardShadow)}
      >
<div
  className="pt-5 pb-3 mt-3"
  style={{ paddingLeft: 28, paddingRight: 28 }}
>
  <div className="flex items-center justify-between gap-4">
    <div className="text-left">
      <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
        Tren Dokumen Baru (Bulanan)
      </h3>
      <p className="stat-subtitle mt-1" style={{ color: colors.muted }}>
        Berdasarkan tanggal mulai kerja sama
      </p>
    </div>

    {/* Tahun: kasih margin kanan biar tidak nempel tepi */}
    <div className="flex items-center gap-2" style={{ marginRight: 8 }}>
      <span className="text-xs" style={{ color: colors.muted }}>
        Tahun
      </span>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
        className="px-3 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all"
        style={{
          borderColor: colors.cardBorder,
          backgroundColor: "#fff",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        }}
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  </div>
</div>


        <div className="px-4 pb-4 pt-1 mt-3">
          <div className="h-56">
            {hasData ? (
              <Line data={monthlyData} options={baseOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{
                    background: `conic-gradient(${colors.tealSoft} 0% 25%, ${colors.orangeSoft} 25% 50%, ${colors.tealSoft} 50% 75%, ${colors.orangeSoft} 75% 100%)`,
                    color: colors.text,
                  }}
                >
                  <i className="fas fa-chart-line text-lg" />
                </div>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
                  Tidak ada data untuk tahun {selectedYear}
                </p>
                <p className="text-xs mt-1" style={{ color: colors.muted }}>
                  Dokumen baru akan muncul di sini
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;