import React, { useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";  // Mengimpor komponen grafik Bar dan Line dari react-chartjs-2
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
} from "chart.js";  // Mengimpor elemen-elemen dari Chart.js untuk membuat grafik

// Mendaftarkan komponen-komponen yang diperlukan ke ChartJS
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
  // Hook untuk menyimpan tahun yang dipilih, default adalah tahun sekarang
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  /* =========================
     THEME (ORANGE + TEAL) - ENHANCED
     ========================= */
  // Mendefinisikan warna-warna yang digunakan di grafik dan elemen UI
  const colors = {
    navy: "#c7632a", // warna navy
    navySoft: "rgba(199, 99, 42, 0.12)", // warna navy soft (transparan)
    teal: "#07b8af", // warna teal
    tealSoft: "rgba(7, 184, 175, 0.15)", // warna teal soft (transparan)
    tealDark: "#008a9a", // warna teal gelap
    orange: "#FF6B35", // warna oranye
    orangeSoft: "rgba(255, 107, 53, 0.15)", // warna oranye soft (transparan)
    orangeDark: "#D35400", // warna oranye gelap
    text: "#0F172A", // warna teks utama
    muted: "#64748B", // warna teks sekunder
    grid: "rgba(2, 6, 23, 0.06)", // warna grid untuk skala
    cardBorder: "rgba(2, 6, 23, 0.08)", // warna border card
    cardShadow: "0 4px 12px rgba(0, 0, 0, 0.04)", // shadow untuk card
  };

  /* =========================
     YEAR OPTIONS
     ========================= */
  // Mendapatkan tahun-tahun yang ada dalam data dokumen untuk dropdown
  const yearOptions = useMemo(() => {
    const years = new Set();
    documents.forEach((doc) => {
      if (doc.cooperationStartDate) {
        const yearNum = parseInt(doc.cooperationStartDate.split("-")[0], 10); // Mengambil tahun dari tanggal mulai
        if (!isNaN(yearNum) && yearNum >= 2020) years.add(yearNum); // Menambahkan tahun ke set jika valid
      }
    });
    const currentYear = new Date().getFullYear();  // Menambahkan tahun saat ini
    for (let i = 0; i <= 5; i++) years.add(currentYear + i);  // Menambahkan 5 tahun ke depan
    return Array.from(years).sort((a, b) => b - a);  // Mengubah set menjadi array dan mengurutkan tahun dari terbaru
  }, [documents]);

  /* =========================
     BAR – MOU vs PKS - ENHANCED
     ========================= */
  // Data untuk grafik perbandingan MoU vs PKS (Aktif vs Kadaluarsa)
  const comparisonData = useMemo(
    () => ({
      labels: ["MoU", "PKS"],  // Label untuk dua kategori dokumen
      datasets: [
        {
          label: "Aktif",  // Label untuk data Aktif
          data: [stats.mou?.active || 0, stats.pks?.active || 0],  // Data untuk dokumen aktif (MoU dan PKS)
          backgroundColor: colors.teal,  // Warna latar belakang untuk bar
          borderColor: "transparent",  // Tidak ada border
          borderWidth: 0,  // Border tidak ditampilkan
          borderRadius: 8,  // Membuat sudut bar menjadi bulat
          maxBarThickness: 50,  // Ketebalan maksimum bar
          categoryPercentage: 0.85,  // Mengatur lebar kategori
          barPercentage: 0.95,  // Mengatur lebar bar dalam kategori
          hoverBackgroundColor: colors.tealDark,  // Warna saat hover
        },
        {
          label: "Kadaluarsa",  // Label untuk data Kadaluarsa
          data: [stats.mou?.expired || 0, stats.pks?.expired || 0],  // Data untuk dokumen kadaluarsa (MoU dan PKS)
          backgroundColor: colors.orange,  // Warna latar belakang untuk bar
          borderColor: "transparent",  // Tidak ada border
          borderWidth: 0,  // Border tidak ditampilkan
          borderRadius: 8,  // Membuat sudut bar menjadi bulat
          maxBarThickness: 50,  // Ketebalan maksimum bar
          categoryPercentage: 0.85,  // Mengatur lebar kategori
          barPercentage: 0.95,  // Mengatur lebar bar dalam kategori
          hoverBackgroundColor: colors.orangeDark,  // Warna saat hover
        },
      ],
    }),
    [stats, colors]
  );

  /* =========================
     LINE – MONTHLY TREND - ENHANCED
     ========================= */
  // Label untuk grafik tren bulanan
  const monthlyLabels = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  // Menghitung jumlah dokumen MoU dan PKS berdasarkan bulan dan tahun yang dipilih
  const { mou, pks } = useMemo(() => {
    const monthlyCount = {
      mou: Array(12).fill(0),  // Array untuk menghitung MoU per bulan
      pks: Array(12).fill(0),  // Array untuk menghitung PKS per bulan
    };

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;  // Pola untuk memvalidasi tanggal

    documents.forEach((doc) => {
      const date = doc.cooperationStartDate;
      if (!date || !datePattern.test(date)) return;  // Jika tanggal tidak valid, lewati

      const [year, month] = date.split("-");  // Memisahkan tahun dan bulan dari tanggal
      if (parseInt(year, 10) !== selectedYear) return;  // Jika tahun tidak sesuai, lewati

      const monthIndex = parseInt(month, 10) - 1;  // Menentukan index bulan
      if (monthIndex < 0 || monthIndex > 11) return;  // Pastikan bulan valid

      if (doc.documentType === "MoU") monthlyCount.mou[monthIndex] += 1;  // Menambahkan data MoU
      if (doc.documentType === "PKS") monthlyCount.pks[monthIndex] += 1;  // Menambahkan data PKS
    });

    return monthlyCount;  // Mengembalikan jumlah dokumen MoU dan PKS per bulan
  }, [documents, selectedYear]);

  // Mengecek apakah ada data untuk ditampilkan di grafik bulanan
  const hasData = useMemo(
    () => mou.some((v) => v > 0) || pks.some((v) => v > 0),  // Memeriksa apakah ada data di MoU atau PKS
    [mou, pks]
  );

  // Data untuk grafik tren bulanan
  const monthlyData = useMemo(
    () => ({
      labels: monthlyLabels,  // Menampilkan label bulan
      datasets: [
        {
          label: "MoU Baru",  // Label untuk MoU
          data: mou,  // Data untuk MoU
          borderColor: colors.teal,  // Warna border untuk MoU
          backgroundColor: colors.tealSoft,  // Warna latar belakang untuk MoU
          borderWidth: 2.5,  // Ketebalan border
          tension: 0.4,  // Kekuatan kelengkungan garis
          fill: true,  // Mengisi area di bawah garis
          pointRadius: 4,  // Radius titik pada garis
          pointHoverRadius: 6,  // Radius titik saat hover
          pointBackgroundColor: colors.teal,  // Warna titik
          pointBorderColor: "transparent",  // Menghilangkan border titik
          pointBorderWidth: 0,  // Tidak ada border untuk titik
          pointHoverBackgroundColor: colors.tealDark,  // Warna titik saat hover
          pointHoverBorderColor: "transparent",  // Tidak ada border saat hover
        },
        {
          label: "PKS Baru",  // Label untuk PKS
          data: pks,  // Data untuk PKS
          borderColor: colors.orange,  // Warna border untuk PKS
          backgroundColor: colors.orangeSoft,  // Warna latar belakang untuk PKS
          borderWidth: 2.5,  // Ketebalan border
          tension: 0.4,  // Kekuatan kelengkungan garis
          fill: true,  // Mengisi area di bawah garis
          pointRadius: 4,  // Radius titik pada garis
          pointHoverRadius: 6,  // Radius titik saat hover
          pointBackgroundColor: colors.orange,  // Warna titik
          pointBorderColor: "transparent",  // Menghilangkan border titik
          pointBorderWidth: 0,  // Tidak ada border untuk titik
          pointHoverBackgroundColor: colors.orangeDark,  // Warna titik saat hover
          pointHoverBorderColor: "transparent",  // Tidak ada border saat hover
        },
      ],
    }),
    [mou, pks, colors]
  );

  /* =========================
     OPTIONS – ENHANCED VISUAL
     ========================= */
  // Pengaturan dasar untuk semua grafik
  const baseOptions = useMemo(
    () => ({
      responsive: true,  // Membuat grafik responsif
      maintainAspectRatio: false,  // Memungkinkan pengaturan rasio aspek bebas
      layout: { padding: { top: 8, right: 12, bottom: 6, left: 12 } },  // Mengatur padding grafik
      interaction: {
        mode: "index",  // Interaksi berdasarkan sumbu X
        intersect: false,  // Tidak perlu berinteraksi dengan sumbu Y
        axis: "x",  // Interaksi hanya pada sumbu X
      },
      plugins: {
        legend: {
          position: "bottom",  // Menempatkan legenda di bawah grafik
          align: "center",  // Menyusun legenda di tengah
          maxHeight: 36,  // Membatasi tinggi maksimum legenda
          labels: {
            color: "#64748b",  // Warna label legenda
            boxWidth: 10,  // Ukuran kotak di legenda
            boxHeight: 10,  // Ukuran kotak di legenda
            usePointStyle: true,  // Menggunakan gaya titik pada legenda
            pointStyle: "circle",  // Bentuk titik pada legenda
            padding: 12,  // Jarak antara label dan titik
            font: { size: 13, weight: "500", family: "inherit" },  // Ukuran font dan berat font
          },
        },
        tooltip: {
          backgroundColor: "#fff",  // Warna latar belakang tooltip
          titleColor: colors.text,  // Warna judul tooltip
          titleFont: { weight: "600" },  // Berat font untuk judul tooltip
          bodyColor: colors.muted,  // Warna isi tooltip
          padding: 12,  // Padding tooltip
          borderColor: "rgba(0, 0, 0, 0.1)",  // Border tooltip
          borderWidth: 1,  // Ketebalan border tooltip
          cornerRadius: 8,  // Membulatkan sudut tooltip
          displayColors: true,  // Menampilkan warna di tooltip
          bodyFont: { size: 11 },  // Ukuran font untuk isi tooltip
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}`,  // Format label tooltip
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: colors.muted,  // Warna teks ticks
            font: { size: 11, weight: "500" },  // Ukuran dan berat font ticks
            maxRotation: 0,  // Tidak ada rotasi pada ticks
            minRotation: 0,  // Tidak ada rotasi pada ticks
          },
          grid: {
            display: false,  // Menyembunyikan grid sumbu X
            drawBorder: false,  // Tidak ada border pada sumbu X
          },
        },
        y: {
          beginAtZero: true,  // Memulai sumbu Y dari 0
          ticks: {
            color: colors.muted,  // Warna ticks sumbu Y
            precision: 0,  // Menghilangkan desimal pada ticks
            font: { size: 11, weight: "500" },  // Ukuran dan berat font ticks
            stepSize: 1,  // Mengatur langkah sumbu Y
          },
          grid: {
            color: colors.grid,  // Warna grid sumbu Y
            drawBorder: false,  // Tidak ada border pada sumbu Y
          },
        },
      },
      animation: {
        duration: 800,  // Durasi animasi grafik
        easing: "easeOutQuart",  // Easing untuk animasi
      },
    }),
    [colors]  // Menggunakan warna yang telah didefinisikan
  );

  // Kelas dan gaya untuk card
  const cardClass = "bg-white rounded-xl border";
  const cardBorderStyle = {
    borderColor: colors.cardBorder,  // Warna border card
    boxShadow: colors.cardShadow,  // Gaya shadow card
    transition: "all 0.3s ease",  // Transisi gaya shadow saat hover
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
        {/* Judul dan Subjudul */}
        <div className="pt-5 pb-3 mt-3" style={{ paddingLeft: 28, paddingRight: 28 }}>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Perbandingan MoU & PKS
              </h3>
              <p className="stat-subtitle mt-1" style={{ color: colors.muted }}>
                Status aktif vs kadaluarsa
              </p>
            </div>
          </div>
        </div>

        {/* Grafik Bar */}
        <div className="px-4 pb-4 pt-1 mt-3">
          <div className="h-56">
            <Bar
              data={comparisonData}  // Data untuk grafik bar
              options={{
                ...baseOptions,  // Menggunakan pengaturan dasar
                scales: {
                  x: {
                    stacked: true,  // Menyusun data dalam satu tumpukan
                    grid: { display: false },  // Menyembunyikan grid sumbu X
                    ticks: {
                      color: colors.muted,  // Warna ticks sumbu X
                      font: { size: 11, weight: "500" },  // Ukuran dan berat font ticks sumbu X
                    },
                    border: { display: false },  // Tidak ada border pada sumbu X
                  },
                  y: {
                    stacked: true,  // Menyusun data dalam satu tumpukan
                    beginAtZero: true,  // Memulai sumbu Y dari 0
                    ticks: {
                      color: colors.muted,  // Warna ticks sumbu Y
                      precision: 0,  // Menghilangkan desimal
                    },
                    grid: { color: colors.grid },  // Warna grid sumbu Y
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
        {/* Judul dan Subjudul */}
        <div className="pt-5 pb-3 mt-3" style={{ paddingLeft: 28, paddingRight: 28 }}>
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                Tren Dokumen Baru (Bulanan)
              </h3>
              <p className="stat-subtitle mt-1" style={{ color: colors.muted }}>
                Berdasarkan tanggal mulai kerja sama
              </p>
            </div>

            {/* Dropdown Tahun */}
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

        {/* Grafik Line */}
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