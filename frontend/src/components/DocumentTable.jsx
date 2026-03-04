// Berfungsi untuk mengimpor ikon AlignCenter dari library lucide-react (meski di kode ini belum digunakan, bisa untuk future feature)
import { AlignCenter } from "lucide-react";
// Berfungsi untuk mengimpor React dan hook yang dibutuhkan: useEffect untuk side effect, useMemo untuk optimasi render, useState untuk manajemen state lokal
import React, { useEffect, useMemo, useState } from "react";

// ========================================
// FUNGSI BANTU: MENENTUKAN WARNA BADGE STATUS
// ========================================
// Berfungsi untuk mengembalikan konfigurasi badge (teks dan warna) berdasarkan status dokumen yang diterima
const getStatusBadge = (status) => {
  // Berfungsi untuk mendefinisikan mapping antara key status dengan konfigurasi badge-nya
  const badges = {
    active: { text: "Aktif", tone: "success" }, // Berfungsi untuk status dokumen yang masih berlaku
    expired: { text: "Kadaluarsa", tone: "danger" }, // Berfungsi untuk status dokumen yang sudah lewat tanggal berakhir
    expiring: { text: "Akan Kadaluarsa", tone: "warning" }, // Berfungsi untuk status dokumen yang akan segera expired
  };
  // Berfungsi untuk mengembalikan badge sesuai status, atau fallback ke 'neutral' jika status tidak dikenali
  return badges[status] || { text: status, tone: "neutral" };
};

// ========================================
// FUNGSI BANTU: FORMAT TANGGAL KE BAHASA INDONESIA
// ========================================
// Berfungsi untuk mengonversi string tanggal menjadi format lokal Indonesia (contoh: "11 Februari 2026")
const formatDate = (dateString) => {
  // Berfungsi untuk return '-' jika tanggal kosong/null agar tidak error
  if (!dateString) return "-";
  // Berfungsi untuk mengonversi string tanggal ke objek Date JavaScript
  const date = new Date(dateString);
  // Berfungsi untuk validasi: jika tanggal invalid (NaN), return '-'
  if (isNaN(date.getTime())) return "-";
  // Berfungsi untuk format tanggal menggunakan locale 'id-ID' dengan hari angka, bulan panjang, tahun angka
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ========================================
// FUNGSI BANTU: MENENTUKAN JENIS DOKUMEN
// ========================================
// Berfungsi untuk mengekstrak jenis dokumen (MoU/PKS) dari objek doc, dengan fallback ke berbagai kemungkinan field
const getDocumentType = (doc) => {
  // Berfungsi untuk cek jika doc memiliki payload (bisa string JSON atau object)
  if (doc?.payload) {
    try {
      // Berfungsi untuk parse payload jika masih dalam bentuk string JSON, atau langsung pakai jika sudah object
      const payload = typeof doc.payload === "string" ? JSON.parse(doc.payload) : doc.payload;
      // Berfungsi untuk return documentType dari payload jika ada (prioritas utama)
      if (payload.documentType) return payload.documentType;
      // Berfungsi untuk return field 'type' sebagai fallback jika documentType tidak ada
      if (payload.type) return payload.type;
      // Berfungsi untuk return field 'jenisDokumen' sebagai fallback terakhir dari payload
      if (payload.jenisDokumen) return payload.jenisDokumen;
    } catch (e) {
      // Berfungsi untuk log error jika parsing JSON gagal, agar tidak crash aplikasi
      console.error("Error parsing payload:", e);
    }
  }
  // Berfungsi untuk cek field documentType langsung dari root object doc (fallback level 1)
  if (doc?.documentType) return doc.documentType;
  // Berfungsi untuk cek field type dari root object doc (fallback level 2)
  if (doc?.type) return doc.type;
  // Berfungsi untuk cek field jenisDokumen dari root object doc (fallback level 3)
  if (doc?.jenisDokumen) return doc.jenisDokumen;
  // Berfungsi untuk return default "MoU/PKS" jika semua field tidak ditemukan
  return "MoU/PKS";
};

// ========================================
// FUNGSI BANTU: FILTER DOKUMEN BERDASARKAN JENIS
// ========================================
// Berfungsi untuk memfilter array dokumen berdasarkan parameter documentTypeFilter yang dipilih user
const filterByDocumentType = (documents, documentTypeFilter) => {
  // Berfungsi untuk return semua dokumen jika filter tidak dipilih atau bernilai 'all'
  if (!documentTypeFilter || documentTypeFilter === "all") return documents;

  // Berfungsi untuk normalisasi filter: lowercase dan hapus spasi agar pencocokan lebih fleksibel
  const normalizedFilter = documentTypeFilter.toLowerCase().replace(/\s+/g, "");
  // Berfungsi untuk filter array documents dan return hanya yang sesuai kriteria
  return documents.filter((doc) => {
    // Berfungsi untuk mendapatkan jenis dokumen dari doc dan normalisasi juga
    const docType = getDocumentType(doc).toLowerCase().replace(/\s+/g, "");
    // Berfungsi untuk cek jika filter mencari "mou" atau "memorandum"
    if (normalizedFilter === "mou" || normalizedFilter === "memorandum") {
      // Berfungsi untuk return true jika docType mengandung kata mou atau memorandum
      return docType.includes("mou") || docType.includes("memorandum");
    }
    // Berfungsi untuk cek jika filter mencari "pks" atau "kerja"
    if (normalizedFilter === "pks" || normalizedFilter === "kerja") {
      // Berfungsi untuk return true jika docType mengandung kata pks atau kerja
      return docType.includes("pks") || docType.includes("kerja");
    }
    // Berfungsi untuk cek jika filter mencari "perjanjian kerja" (kombinasi)
    if (normalizedFilter.includes("perjanjian") && normalizedFilter.includes("kerja")) {
      // Berfungsi untuk return true hanya jika docType mengandung kedua kata tersebut
      return docType.includes("perjanjian") && docType.includes("kerja");
    }
    // Berfungsi untuk fallback: cek apakah docType mengandung string filter yang dinormalisasi
    return docType.includes(normalizedFilter);
  });
};

// ========================================
// FUNGSI BANTU: CEK APAKAH DOKUMEN SUDAH KADALUARSA
// ========================================
// Berfungsi untuk menentukan apakah sebuah dokumen sudah melewati tanggal berakhirnya
const isDocumentExpired = (doc) => {
  // Berfungsi untuk return false jika doc tidak memiliki cooperationEndDate atau nilainya '-'
  if (!doc?.cooperationEndDate || doc.cooperationEndDate === "-") return false;

  // Berfungsi untuk membuat objek Date hari ini
  const today = new Date();
  // Berfungsi untuk reset waktu hari ini ke 00:00:00 agar perbandingan hanya berdasarkan tanggal
  today.setHours(0, 0, 0, 0);

  // Berfungsi untuk mengonversi string endDate ke objek Date
  const endDate = new Date(doc.cooperationEndDate);
  // Berfungsi untuk validasi: jika endDate invalid, return false
  if (isNaN(endDate.getTime())) return false;

  // Berfungsi untuk reset waktu endDate juga agar perbandingan akurat
  endDate.setHours(0, 0, 0, 0);
  // Berfungsi untuk return true jika endDate < today (artinya sudah kadaluarsa)
  return endDate < today;
};

/* =========================
   ✅ UPDATE KECIL: AMBIL STATUS PROSES DARI ROOT DULU (subStatus/statusAkhir)
   ========================= */
// ========================================
// FUNGSI BANTU: MENENTUKAN STATUS PROSES DOKUMEN
// ========================================
// Berfungsi untuk menentukan status proses dokumen dengan prioritas: root status > subStatus/statusAkhir > payload > fallback expired/active
const getProcessStatus = (doc) => {
  // Berfungsi untuk mengambil nilai status dari root object doc
  const rootStatus = doc?.status;

  // Berfungsi untuk normalisasi rootStatus: trim, lowercase, dan cek apakah termasuk lifecycle status
  const s = (rootStatus || "").toString().trim().toLowerCase();
  const isLifecycle = s === "aktif" || s === "kadaluarsa" || s === "active" || s === "expired" || s === "expiring";

  // Berfungsi untuk return rootStatus jika ada DAN bukan lifecycle status (artinya ini status proses custom)
  if (rootStatus && !isLifecycle) return rootStatus;

  // Berfungsi untuk mengambil subStatus atau statusAkhir dari root doc sebagai prioritas berikutnya
  const rootLastProcess = doc?.subStatus || doc?.statusAkhir;
  // Berfungsi untuk return jika ditemukan
  if (rootLastProcess) return rootLastProcess;

  // Berfungsi untuk cek payload jika status di root tidak ditemukan
  if (doc?.payload) {
    try {
      // Berfungsi untuk parse payload jika masih string JSON
      const payload = typeof doc.payload === "string" ? JSON.parse(doc.payload) : doc.payload;
      const payloadStatus = payload?.status;
      const payloadLast = payload?.subStatus || payload?.statusAkhir;

      // Berfungsi untuk return status dari payload jika ada
      if (payloadStatus) return payloadStatus;
      // Berfungsi untuk return subStatus/statusAkhir dari payload jika ada
      if (payloadLast) return payloadLast;
    } catch (e) {}
    // Berfungsi untuk silent catch error parsing agar tidak crash
  }

  // Berfungsi untuk fallback: return 'expired' atau 'active' berdasarkan perbandingan tanggal
  return isDocumentExpired(doc) ? "expired" : "active";
};

/* =========================
   MODAL UI (INLINE)
   ========================= */
// ========================================
// KONSTANTA WARNA - UNTUK KONSISTENSI TEMA VISUAL
// ========================================
// Berfungsi untuk menyimpan kode warna teal utama yang digunakan di seluruh komponen
const TEAL = "#07b8af";
// Berfungsi untuk menyimpan kode warna teal gelap untuk efek hover
const TEAL_DARK = "#008a9a";
// Berfungsi untuk menyimpan kode warna navy untuk teks judul dan heading
const NAVY = "#0b2e4b";
// Berfungsi untuk menyimpan kode warna teks utama
const TEXT = "#0f172a";
// Berfungsi untuk menyimpan kode warna teks sekunder/muted
const MUTED = "#64748b";
// Berfungsi untuk menyimpan kode warna border dengan opacity
const BORDER = "rgba(2, 6, 23, 0.10)";

// ========================================
// KOMPONEN: MODAL SHELL (WRAPPER MODAL)
// ========================================
// Berfungsi sebagai container overlay untuk semua modal, menangani klik luar untuk menutup modal
function ModalShell({ open, onClose, children }) {
  // Berfungsi untuk return null jika modal tidak aktif, agar tidak dirender sama sekali
  if (!open) return null;

  // Berfungsi untuk merender overlay dengan posisi fixed menutupi seluruh layar
  return (
    <div
      // Berfungsi untuk menutup modal ketika user klik area overlay (di luar konten modal)
      onMouseDown={onClose}
      style={{
        position: "fixed", // Berfungsi agar modal tetap di posisi relatif terhadap viewport
        inset: 0, // Berfungsi untuk top:0, right:0, bottom:0, left:0 sekaligus
        background: "rgba(15, 23, 42, 0.55)", // Berfungsi untuk background gelap semi-transparan
        zIndex: 9999, // Berfungsi agar modal selalu di atas elemen lain
        display: "flex", // Berfungsi untuk centering konten dengan flexbox
        alignItems: "center", // Berfungsi untuk center vertikal
        justifyContent: "center", // Berfungsi untuk center horizontal
        padding: 14, // Berfungsi untuk memberi jarak dari edge layar
      }}
    >
      <div
        // Berfungsi untuk mencegah event klik di dalam modal memicu onClose (stop propagation)
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "100%", // Berfungsi agar modal responsif di layar kecil
          maxWidth: 560, // Berfungsi untuk membatasi lebar maksimal modal
          background: "#fff", // Berfungsi untuk background putih konten modal
          borderRadius: 14, // Berfungsi untuk sudut membulat
          boxShadow: "0 18px 40px rgba(2,6,23,0.25)", // Berfungsi untuk efek bayangan agar modal terlihat mengambang
          overflow: "hidden", // Berfungsi agar konten tidak keluar dari border radius
        }}
      >
        {/* Berfungsi untuk merender children/konten modal yang dikirim dari parent */}
        {children}
      </div>
    </div>
  );
}

// ========================================
// KOMPONEN: MODAL HEADER
// ========================================
// Berfungsi untuk merender header standar modal dengan ikon, judul, dan tombol close
function ModalHeader({ iconNode, title, onClose }) {
  return (
    <div
      style={{
        padding: "14px 18px 12px", // Berfungsi untuk spacing internal header
        borderBottom: "1px solid rgba(2,6,23,0.08)", // Berfungsi untuk garis pemisah dengan body modal
        display: "flex", // Berfungsi untuk layout horizontal
        alignItems: "center", // Berfungsi untuk center vertikal item
        gap: 10, // Berfungsi untuk jarak antar elemen (ikon, judul, tombol)
      }}
    >
      <div
        style={{
          width: 22, // Berfungsi untuk lebar container ikon
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18, // Berfungsi untuk ukuran ikon
          color: TEAL, // Berfungsi untuk warna ikon teal
          lineHeight: 1, // Berfungsi agar ikon tidak ada spacing vertikal ekstra
        }}
      >
        {/* Berfungsi untuk merender ikon yang dikirim dari parent component */}
        {iconNode}
      </div>

      <div style={{ flex: 1, fontSize: 18, fontWeight: 600, color: NAVY }}>{title}</div>
      {/* Berfungsi untuk flex:1 agar judul mengambil sisa ruang, push tombol close ke kanan */}

      <button
        // Berfungsi untuk memanggil fungsi onClose ketika tombol diklik
        onClick={onClose}
        aria-label="Tutup" // Berfungsi untuk aksesibilitas (screen reader)
        style={{
          border: "none", // Berfungsi untuk menghilangkan border default button
          background: "transparent", // Berfungsi agar background transparan
          fontSize: 18, // Berfungsi untuk ukuran teks 'x'
          cursor: "pointer", // Berfungsi agar cursor berubah jadi tangan saat hover
          color: MUTED, // Berfungsi untuk warna ikon close
          padding: 6, // Berfungsi untuk area klik yang lebih besar
          borderRadius: 10, // Berfungsi untuk sudut membulat saat hover
        }}
      >
        × {/* Berfungsi untuk menampilkan karakter 'x' sebagai ikon close */}
      </button>
    </div>
  );
}

/* ✅ HistoryModal: rapih + scroll nempel sisi modal */
// ========================================
// KOMPONEN: HISTORY MODAL (RIWAYAT PERPANJANGAN)
// ========================================
// Berfungsi untuk menampilkan modal riwayat perpanjangan dokumen dengan list history yang bisa discroll
function HistoryModal({ open, onClose, doc, historyCount = 0, loading, historyData }) {
  // Berfungsi untuk memoize title line agar tidak recalculated setiap render kecuali doc berubah
  const titleLine = useMemo(() => {
    // Berfungsi untuk mendapatkan jenis dokumen dari helper function
    const type = getDocumentType(doc || {});
    // Berfungsi untuk mendapatkan nama partner dengan fallback ke berbagai kemungkinan field
    const partner = doc?.partnerName || doc?.institutionalLevel || doc?.institution || "N/A";
    // Berfungsi untuk return string gabungan "Jenis - Partner"
    return `${type} - ${partner}`;
  }, [doc]); // Berfungsi untuk dependency array: recalculate hanya jika doc berubah

  // Berfungsi untuk mengambil array history dari historyData, fallback ke array kosong jika null
  const historyList = historyData?.history || [];
  // Berfungsi untuk menentukan apakah ada history untuk ditampilkan (bukan loading dan length > 0)
  const hasHistory = !loading && historyList.length > 0;

  return (
    // Berfungsi untuk merender ModalShell dengan props open dan onClose
    <ModalShell open={open} onClose={onClose}>
      {/* Berfungsi untuk merender header modal dengan ikon history, judul, dan tombol close */}
      <ModalHeader iconNode={<i className="fas fa-history" style={{ color: TEAL }} />} title="Riwayat Perpanjangan" onClose={onClose} />

      {/* ✅ BODY WRAPPER: bikin modal tinggi hanya kalau ada riwayat */}
      <div
        style={{
          padding: 16, // Berfungsi untuk spacing internal body modal
          display: "flex", // Berfungsi untuk layout flex column
          flexDirection: "column", // Berfungsi agar children ditumpuk vertikal
          gap: 12, // Berfungsi untuk jarak antar elemen dalam body
          // Berfungsi untuk conditional style: set height 72vh hanya jika ada history, agar bisa scroll
          ...(hasHistory ? { height: "72vh", minHeight: 0 } : {}),
        }}
      >
        <div style={{ textAlign: "center" }}>
          {/* Berfungsi untuk menampilkan judul dokumen dan partner di tengah */}
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{titleLine}</div>

          {/* Berfungsi untuk label "Jumlah Perpanjangan :" */}
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Jumlah Perpanjangan :</div>
          {/* Berfungsi untuk menampilkan angka jumlah perpanjangan dengan font besar, atau loading indicator "…" */}
          <div style={{ fontSize: 30, fontWeight: 800, color: NAVY }}>{loading ? "…" : `${historyCount}x`}</div>
        </div>

        {/* ✅ EMPTY STATE: compact & bersih */}
        {/* Berfungsi untuk menampilkan pesan jika tidak ada history atau masih loading */}
        {!hasHistory ? (
          <div
            style={{
              border: "1px solid rgba(2,6,23,0.08)", // Berfungsi untuk border tipis
              borderRadius: 12, // Berfungsi untuk sudut membulat
              background: "#fff", // Berfungsi untuk background putih
              padding: 16, // Berfungsi untuk spacing internal
              textAlign: "center", // Berfungsi untuk center teks
              color: NAVY, // Berfungsi untuk warna teks navy
              fontSize: 14, // Berfungsi untuk ukuran font
              lineHeight: 1.4, // Berfungsi untuk jarak antar baris teks
            }}
          >
            {/* Berfungsi untuk menampilkan pesan loading atau "Belum ada riwayat" */}
            {loading ? "Memuat riwayat..." : "Belum ada riwayat perpanjangan"}
          </div>
        ) : (
          /* ✅ LIST WRAP: scrollnya di container ini, full lebar modal */
          // Berfungsi untuk container scrollable yang hanya aktif jika ada history
          <div
            style={{
              flex: 1, // Berfungsi agar container ini mengambil sisa ruang vertikal
              minHeight: 0, // Berfungsi untuk fix flexbox overflow issue
              overflowY: "auto", // Berfungsi untuk enable scroll vertikal jika konten overflow
              WebkitOverflowScrolling: "touch", // Berfungsi untuk smooth scroll di iOS
              overscrollBehavior: "contain", // Berfungsi untuk mencegah scroll bounce efek ke parent
              paddingRight: 6, // ✅ kasih ruang supaya scrollbar gak nutup teks
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Berfungsi untuk memetakan array historyList menjadi list item */}
              {historyList.map((h, i) => (
                <div
                  key={i} // Berfungsi untuk React key agar render optimal
                  style={{
                    padding: 14, // Berfungsi untuk spacing internal card
                    borderRadius: 12, // Berfungsi untuk sudut membulat card
                    border: "1px solid rgba(2,6,23,0.08)", // Berfungsi untuk border tipis card
                    background: "#fff", // Berfungsi untuk background putih card
                  }}
                >
                  {/* Berfungsi untuk menampilkan tanggal history dengan format Indonesia */}
                  <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 10 }}>{formatDate(h?.date)}</div>

                  {/* Berfungsi untuk grid layout menampilkan detail history */}
                  <div style={{ fontSize: 13, color: "#334155", display: "grid", gap: 6 }}>
                    <div>
                      <strong>Tanggal Berakhir Lama:</strong> {h?.oldEndDate || "-"}
                      {/* Berfungsi untuk menampilkan tanggal lama, fallback ke '-' jika null */}
                    </div>
                    <div>
                      <strong>Tanggal Berakhir Baru:</strong> {h?.newEndDate || "-"}
                      {/* Berfungsi untuk menampilkan tanggal baru, fallback ke '-' jika null */}
                    </div>
                    <div>
                      <strong>Status Sebelum:</strong> {h?.subStatusBefore || "-"}
                      {/* Berfungsi untuk menampilkan status sebelum perpanjangan */}
                    </div>
                    <div>
                      <strong>Status Sesudah:</strong> {h?.subStatusAfter || "-"}
                      {/* Berfungsi untuk menampilkan status setelah perpanjangan */}
                    </div>
                    <div>
                      <strong>Catatan:</strong> {h?.notes || "-"}
                      {/* Berfungsi untuk menampilkan catatan perpanjangan */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Berfungsi untuk tombol tutup modal di bagian bawah */}
        <button
          // Berfungsi untuk memanggil onClose ketika tombol diklik
          onClick={onClose}
          style={{
            width: "100%", // Berfungsi agar tombol full width
            border: "none", // Berfungsi untuk menghilangkan border default
            background: TEAL, // Berfungsi untuk background warna teal
            color: "#fff", // Berfungsi untuk teks putih
            fontSize: 15, // Berfungsi untuk ukuran font tombol
            fontWeight: 700, // Berfungsi untuk ketebalan font bold
            padding: "12px 14px", // Berfungsi untuk spacing internal tombol
            borderRadius: 12, // Berfungsi untuk sudut membulat
            cursor: "pointer", // Berfungsi agar cursor jadi tangan saat hover
          }}
          // Berfungsi untuk efek hover: ubah background ke teal gelap
          onMouseEnter={(e) => (e.currentTarget.style.background = TEAL_DARK)}
          // Berfungsi untuk efek hover out: kembalikan background ke teal
          onMouseLeave={(e) => (e.currentTarget.style.background = TEAL)}
        >
          Tutup {/* Berfungsi untuk label tombol */}
        </button>
      </div>
    </ModalShell>
  );
}

// ========================================
// KOMPONEN: RENEW MODAL (FORM PERPANJANGAN)
// ========================================
// Berfungsi untuk menampilkan modal form perpanjangan dokumen dengan input tanggal dan catatan
function RenewModal({ open, onClose, doc, onSubmit }) {
  // Berfungsi untuk state input tanggal berakhir baru
  const [newEndDate, setNewEndDate] = useState("");
  // Berfungsi untuk state input catatan perpanjangan
  const [note, setNote] = useState("");

  // Berfungsi untuk effect: reset form ketika modal dibuka
  useEffect(() => {
    if (open) {
      setNewEndDate(""); // Berfungsi untuk clear input tanggal
      setNote(""); // Berfungsi untuk clear input catatan
    }
  }, [open]); // Berfungsi untuk dependency: jalankan hanya ketika 'open' berubah

  // Berfungsi untuk mendapatkan jenis dokumen dari helper function
  const type = getDocumentType(doc || {});
  // Berfungsi untuk mendapatkan nama partner dengan fallback ke berbagai field
  const partner = doc?.partnerName || doc?.institutionalLevel || doc?.institution || "N/A";

  return (
    // Berfungsi untuk merender ModalShell wrapper
    <ModalShell open={open} onClose={onClose}>
      {/* Berfungsi untuk header modal dengan ikon sync dan judul */}
      <ModalHeader iconNode={<i className="fas fa-sync-alt" style={{ color: "#11ba82" }} />} title="Perpanjang Dokumen" onClose={onClose} />

      <div style={{ padding: 18 }}>
        {/* Berfungsi untuk menampilkan info dokumen yang akan diperpanjang */}
        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 14 }}>
          <span style={{ fontWeight: 700 }}>{type}</span> dengan <span style={{ fontWeight: 700 }}>{partner}</span>
        </div>

        {/* Berfungsi untuk label input tanggal dengan indikator wajib (*) */}
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
          Tanggal Berakhir Baru <span style={{ color: "#ef4444" }}>*</span>
        </label>

        <div style={{ position: "relative", marginBottom: 12 }}>
          {/* Berfungsi untuk input date picker yang terkontrol oleh state newEndDate */}
          <input
            type="date"
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)} // Berfungsi untuk update state saat user pilih tanggal
            style={{
              width: "100%", // Berfungsi agar input full width
              padding: "12px 44px 12px 12px", // Berfungsi untuk spacing, kanan lebih besar untuk ikon
              borderRadius: 12, // Berfungsi untuk sudut membulat
              border: `1px solid ${BORDER}`, // Berfungsi untuk border sesuai tema
              outline: "none", // Berfungsi untuk menghilangkan outline default browser saat focus
              fontSize: 14, // Berfungsi untuk ukuran font
              color: TEXT, // Berfungsi untuk warna teks
              background: "#fff", // Berfungsi untuk background putih
            }}
          />
          {/* Berfungsi untuk container ikon calendar (bisa ditambahkan ikon di sini) */}
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none", fontSize: 16 }} />
        </div>

        {/* Berfungsi untuk box warning/info tentang status dokumen */}
        <div
          style={{
            display: "flex", // Berfungsi untuk layout horizontal
            gap: 10, // Berfungsi untuk jarak antara ikon dan teks
            alignItems: "flex-start", // Berfungsi untuk align item ke atas
            background: "rgba(245, 158, 11, 0.12)", // Berfungsi untuk background oranye transparan
            color: "#7c2d12", // Berfungsi untuk warna teks oranye gelap
            padding: 12, // Berfungsi untuk spacing internal
            borderRadius: 12, // Berfungsi untuk sudut membulat
            marginBottom: 14, // Berfungsi untuk jarak ke elemen bawah
          }}
        >
          <div style={{ fontSize: 16, lineHeight: 1 }}>⚠️</div>
          {/* Berfungsi untuk menampilkan teks informasi bahwa status akan otomatis jadi 'Aktif' */}
          <div style={{ lineHeight: 1.35, fontWeight: 600, fontSize: 13 }}>
            Status dokumen Anda akan diperbarui secara otomatis menjadi 'Aktif' setelah proses perpanjangan berhasil diselesaikan
          </div>
        </div>

        {/* Berfungsi untuk label input catatan (opsional) */}
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
          Catatan Perpanjangan (Opsional)
        </label>

        {/* Berfungsi untuk textarea input catatan yang terkontrol oleh state note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)} // Berfungsi untuk update state saat user ketik
          placeholder="Contoh: Perpanjangan sesuai hasil evaluasi tahun 2026"
          style={{
            width: "100%", // Berfungsi agar textarea full width
            minHeight: 110, // Berfungsi untuk tinggi minimal textarea
            padding: 12, // Berfungsi untuk spacing internal
            borderRadius: 12, // Berfungsi untuk sudut membulat
            border: `1px solid ${BORDER}`, // Berfungsi untuk border sesuai tema
            outline: "none", // Berfungsi untuk menghilangkan outline default
            fontSize: 14, // Berfungsi untuk ukuran font
            color: TEXT, // Berfungsi untuk warna teks
            resize: "vertical", // Berfungsi agar user bisa resize tinggi textarea saja
            marginBottom: 16, // Berfungsi untuk jarak ke elemen bawah
          }}
        />

        {/* Berfungsi untuk grid layout 2 kolom untuk tombol Batal dan Perpanjang */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Berfungsi untuk tombol Batal yang memanggil onClose */}
          <button
            onClick={onClose}
            style={{
              width: "100%", // Berfungsi agar tombol full width container
              padding: "12px 12px", // Berfungsi untuk spacing internal
              borderRadius: 12, // Berfungsi untuk sudut membulat
              border: `1px solid ${BORDER}`, // Berfungsi untuk border tipis
              background: "#fff", // Berfungsi untuk background putih
              color: NAVY, // Berfungsi untuk warna teks navy
              fontWeight: 600, // Berfungsi untuk font bold
              fontSize: 14, // Berfungsi untuk ukuran font
              cursor: "pointer", // Berfungsi agar cursor jadi tangan
            }}
          >
            Batal
          </button>

          {/* Berfungsi untuk tombol Perpanjang yang memanggil onSubmit dengan data form */}
          <button
            onClick={() => onSubmit?.({ doc, newEndDate, note })} // Berfungsi untuk trigger submit dengan data
            disabled={!newEndDate} // Berfungsi untuk disable tombol jika tanggal belum dipilih
            style={{
              width: "100%", // Berfungsi agar tombol full width
              padding: "12px 12px", // Berfungsi untuk spacing internal
              borderRadius: 12, // Berfungsi untuk sudut membulat
              border: "none", // Berfungsi untuk menghilangkan border
              // Berfungsi untuk conditional background: abu-abu jika disabled, teal jika aktif
              background: !newEndDate ? "rgba(2,6,23,0.12)" : "rgb(7, 184, 175)",
              color: "#fff", // Berfungsi untuk teks putih
              fontWeight: 600, // Berfungsi untuk font bold
              fontSize: 14, // Berfungsi untuk ukuran font
              // Berfungsi untuk conditional cursor: not-allowed jika disabled
              cursor: !newEndDate ? "not-allowed" : "pointer",
            }}
          >
            Perpanjang Sekarang
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* =========================
   DOCUMENT TABLE
   ========================= */
// ========================================
// KOMPONEN UTAMA: TABEL DOKUMEN DENGAN PAGINASI DAN FILTER
// ========================================
// Berfungsi untuk merender tabel daftar dokumen dengan fitur pagination, filter, dan aksi perpanjangan/history
const DocumentTable = ({ documents, loading, documentTypeFilter = "all", statusFilter = "all", onRefresh }) => {
  // Berfungsi untuk state halaman saat ini (default halaman 1)
  const [currentPage, setCurrentPage] = useState(1);
  // Berfungsi untuk konstanta jumlah item per halaman (5 dokumen)
  const itemsPerPage = 5;

  // Berfungsi untuk memoize filtered documents agar tidak recalculated setiap render kecuali dependencies berubah
  const filteredDocuments = useMemo(() => filterByDocumentType(documents || [], documentTypeFilter), [documents, documentTypeFilter]);

  // Berfungsi untuk effect: reset ke halaman 1 ketika filter berubah
  useEffect(() => setCurrentPage(1), [documentTypeFilter, statusFilter, filteredDocuments]);

  // Berfungsi untuk menghitung total halaman berdasarkan jumlah dokumen dan itemsPerPage
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  // Berfungsi untuk menghitung index item terakhir yang ditampilkan di halaman saat ini
  const indexOfLastItem = currentPage * itemsPerPage;
  // Berfungsi untuk menghitung index item pertama yang ditampilkan di halaman saat ini
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Berfungsi untuk slice array dokumen sesuai halaman saat ini (pagination logic)
  const currentDocuments = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);

  // Berfungsi untuk handler navigasi ke halaman sebelumnya (jika bukan halaman 1)
  const handlePreviousPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  // Berfungsi untuk handler navigasi ke halaman berikutnya (jika bukan halaman terakhir)
  const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  // Berfungsi untuk handler navigasi ke halaman tertentu dengan validasi range
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  // ========================================
  // KONSTANTA WARNA DAN STYLE - TEMA KOMPONEN
  // ========================================
  // Berfungsi untuk object konstanta warna yang digunakan di seluruh komponen tabel
  const C = {
    text: "#0f172a", // Berfungsi untuk warna teks utama
    muted: "#64748b", // Berfungsi untuk warna teks sekunder
    border: "rgba(2, 6, 23, 0.08)", // Berfungsi untuk warna border utama
    softBorder: "rgba(2, 6, 23, 0.06)", // Berfungsi untuk warna border halus
    bg: "#ffffff", // Berfungsi untuk warna background putih
    headBg: "#ffffff", // Berfungsi untuk warna background header tabel
    teal: "#07b8af", // Berfungsi untuk warna utama teal
    tealSoft: "rgba(7, 184, 175, 0.16)", // Berfungsi untuk warna teal transparan (badge)
    pksBg: "rgba(255, 107, 53, 0.14)", // Berfungsi untuk warna background badge PKS
    pksText: "#c2410c", // Berfungsi untuk warna teks badge PKS
    statusBg: "rgba(2, 6, 23, 0.04)", // Berfungsi untuk warna background badge status
    statusText: "#0b2e4b", // Berfungsi untuk warna teks badge status
  };

  // Berfungsi untuk object konstanta style yang digunakan untuk berbagai elemen UI
  const s = {
    // Berfungsi untuk style card container utama
    card: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, boxShadow: "0 10px 28px rgba(2, 6, 23, 0.06)" },
    // Berfungsi untuk style header card (judul + total)
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.softBorder}` },
    // Berfungsi untuk style judul card
    title: { fontSize: 18, fontWeight: 600, color: C.text, margin: 0 },
    // Berfungsi untuk style teks total dokumen
    total: { fontSize: 14, fontWeight: 500, color: C.muted },
    // Berfungsi untuk style wrapper tabel agar bisa scroll horizontal
    tableWrap: { overflowX: "auto" },
    // Berfungsi untuk style elemen table
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
    // Berfungsi untuk style header cell tabel (th)
    th: { padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#0b2e4b", background: C.headBg, textAlign: "left", borderBottom: `1px solid ${C.softBorder}`, whiteSpace: "nowrap" },
    // Berfungsi untuk style data cell tabel (td)
    td: { padding: "16px 16px", fontSize: 14, color: C.text, borderBottom: `1px solid rgba(2, 6, 23, 0.04)`, verticalAlign: "middle" },
    // Berfungsi untuk function yang return style badge jenis dokumen (MoU/PKS) berdasarkan tipe
    docPill: (type) => {
      const key = (type || "").toLowerCase();
      // Berfungsi untuk conditional: jika tipe mengandung 'pks', return style badge oranye
      if (key.includes("pks")) {
        return { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: C.pksBg, color: C.pksText, minWidth: 58 };
      }
      // Berfungsi untuk fallback: return style badge teal untuk MoU atau lainnya
      return { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: C.tealSoft, color: "#007a73", minWidth: 58 };
    },
    // Berfungsi untuk style badge status dokumen
    statusPill: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: C.statusBg, color: C.statusText, whiteSpace: "nowrap" },
    // Berfungsi untuk style container pagination
    pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 12, userSelect: "none" },
    // Berfungsi untuk function yang return style tombol navigasi pagination (disabled/aktif)
    navBtn: (disabled) => ({ border: "none", background: "transparent", fontSize: 13, color: disabled ? "rgba(100, 116, 139, 0.35)" : "#64748b", cursor: disabled ? "not-allowed" : "pointer", padding: "4px 8px", borderRadius: 10, fontWeight: 500 }),
    // Berfungsi untuk style container row tombol halaman
    pageRow: { display: "flex", alignItems: "center", gap: 12 },
    // Berfungsi untuk function yang return style tombol nomor halaman (aktif/tidak)
    pageBtn: (active) => ({ border: "none", background: active ? C.teal : "transparent", color: active ? "#fff" : "#94a3b8", fontWeight: 600, fontSize: 14, width: 28, height: 28, borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: active ? "0 8px 16px rgba(7, 184, 175, 0.22)" : "none" }),
  };

  // Berfungsi untuk state tracking index row yang sedang di-hover (untuk efek highlight)
  const [hoverIdx, setHoverIdx] = useState(null);
  // Berfungsi untuk state mengontrol modal yang aktif (type: null/'renew'/'history' dan doc yang dipilih)
  const [modal, setModal] = useState({ type: null, doc: null });

  // Berfungsi untuk state loading saat fetch history dari API
  const [historyLoading, setHistoryLoading] = useState(false);
  // Berfungsi untuk state menyimpan data history yang diambil dari API
  const [historyData, setHistoryData] = useState(null);

  // Berfungsi untuk handler membuka modal perpanjangan dengan dokumen yang dipilih
  const openRenewModal = (doc) => setModal({ type: "renew", doc });

  // Berfungsi untuk handler async membuka modal history dan fetch data dari API
  const openHistoryModal = async (doc) => {
    // Berfungsi untuk set modal type ke 'history' dan doc yang dipilih
    setModal({ type: "history", doc });
    // Berfungsi untuk reset state historyData dan set loading true
    setHistoryData(null);
    setHistoryLoading(true);

    try {
      // Berfungsi untuk ambil token auth dari localStorage
      const token = localStorage.getItem("token");

      // Berfungsi untuk fetch data history dari endpoint API dengan authorization header
      const res = await fetch(`/api/renewal/${doc?.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Berfungsi untuk parse response JSON dari server
      const data = await res.json();

      // Berfungsi untuk handle error response dari API
      if (!res.ok) {
        console.error("History API error:", data);
        setHistoryData(null);
        alert(data?.message || "Gagal mengambil riwayat perpanjangan");
      } else {
        // Berfungsi untuk set historyData jika response sukses
        setHistoryData(data);
      }
    } catch (e) {
      // Berfungsi untuk handle network error atau exception lainnya
      console.error("❌ Error fetch history:", e);
      setHistoryData(null);
      alert("Terjadi kesalahan saat mengambil riwayat perpanjangan");
    } finally {
      // Berfungsi untuk set loading false di finally block agar selalu dijalankan
      setHistoryLoading(false);
    }
  };

  // Berfungsi untuk handler menutup semua modal dan reset state terkait
  const closeModal = () => {
    setModal({ type: null, doc: null });
    setHistoryData(null);
    setHistoryLoading(false);
  };

  // ========================================
  // RENDER: LOADING STATE
  // ========================================
  // Berfungsi untuk menampilkan UI loading spinner saat data sedang diambil
  if (loading) {
    return <div style={{ textAlign: "center", padding: 30, color: C.muted }}>Memuat data...</div>;
  }

  // ========================================
  // RENDER: EMPTY STATE (TIDAK ADA DATA)
  // ========================================
  // Berfungsi untuk menampilkan pesan "Tidak ada data" jika filteredDocuments kosong
  if (!filteredDocuments || filteredDocuments.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 34, color: C.muted }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>📋</div>
        <div style={{ fontWeight: 600, color: C.text }}>Tidak ada data dokumen</div>
      </div>
    );
  }

  // ========================================
  // RENDER: TABEL DOKUMEN (SUCCESS STATE)
  // ========================================
  return (
    <>
      {/* Berfungsi untuk container card utama tabel */}
      <div style={s.card}>
        {/* Berfungsi untuk header card dengan judul dan total dokumen */}
        <div style={s.header}>
          <h3 style={s.title}>Daftar Dokumen Terbaru</h3>
          <span style={s.total}>Total : {filteredDocuments.length}</span>
        </div>

        {/* Berfungsi untuk wrapper tabel agar bisa scroll horizontal di layar kecil */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            {/* Berfungsi untuk header tabel dengan kolom-kolom yang sesuai */}
            <thead>
              <tr>
                <th style={{ ...s.th, width: 70 }}>No</th>
                <th style={{ ...s.th, width: 120 }}>Jenis</th>
                <th style={s.th}>Nomor Dokumen</th>
                <th style={s.th}>Mitra</th>
                <th style={{ ...s.th, width: 180 }}>Tanggal Mulai</th>
                <th style={{ ...s.th, width: 180 }}>Tanggal Berakhir</th>
                <th style={{ ...s.th, width: 220 }}>Status</th>
                {/* Berfungsi untuk conditional: tampilkan kolom Aksi hanya jika filter status = Kadaluarsa */}
                {statusFilter === "Kadaluarsa" && <th style={{ ...s.th, width: 220 }}>Aksi</th>}
              </tr>
            </thead>

            {/* Berfungsi untuk body tabel yang memetakan currentDocuments menjadi rows */}
            <tbody>
              {currentDocuments.map((doc, idx) => {
                // Berfungsi untuk mendapatkan status proses dokumen menggunakan helper function
                const processStatus = getProcessStatus(doc);
                // Berfungsi untuk mendapatkan konfigurasi badge berdasarkan status
                const badge = getStatusBadge(processStatus);
                // Berfungsi untuk mendapatkan jenis dokumen (MoU/PKS)
                const docType = getDocumentType(doc);

                return (
                  <tr
                    key={doc.id || idx} // Berfungsi untuk React key unik per row
                    // Berfungsi untuk set hoverIdx saat mouse enter row ini
                    onMouseEnter={() => setHoverIdx(idx)}
                    // Berfungsi untuk reset hoverIdx saat mouse leave row ini
                    onMouseLeave={() => setHoverIdx(null)}
                    // Berfungsi untuk conditional background: highlight teal muda saat di-hover
                    style={{ background: hoverIdx === idx ? "#ebfaf9" : "transparent" }}
                  >
                    {/* Berfungsi untuk cell nomor urut (dengan offset pagination) */}
                    <td style={s.td}>{indexOfFirstItem + idx + 1}</td>

                    {/* Berfungsi untuk cell jenis dokumen dengan badge style */}
                    <td style={s.td}>
                      <span style={s.docPill(docType)}>{docType}</span>
                    </td>

                    {/* Berfungsi untuk cell nomor dokumen dengan fallback ke officeDocNumber */}
                    <td style={s.td}>{doc.documentNumber || doc.officeDocNumber || "-"}</td>

                    {/* Berfungsi untuk cell nama mitra dengan multi-level fallback */}
                    <td style={s.td}>
                      {doc.partnerName ||
                        doc.institutionalLevel ||
                        doc.institution ||
                        (doc.payload && typeof doc.payload === "string"
                          ? (() => {
                              try {
                                // Berfungsi untuk parse payload dan ambil institutionalLevel jika ada
                                return JSON.parse(doc.payload).institutionalLevel || "-";
                              } catch {
                                return "-";
                              }
                            })()
                          : "-")}
                    </td>

                    {/* Berfungsi untuk cell tanggal mulai dengan format Indonesia */}
                    <td style={s.td}>{formatDate(doc.startDate || doc.cooperationStartDate)}</td>
                    {/* Berfungsi untuk cell tanggal berakhir dengan format Indonesia */}
                    <td style={s.td}>{formatDate(doc.endDate || doc.cooperationEndDate)}</td>

                    {/* Berfungsi untuk cell status dengan badge styling */}
                    <td style={s.td}>
                      <span style={s.statusPill}>{badge.text}</span>
                    </td>

                    {/* Berfungsi untuk conditional: tampilkan cell Aksi hanya jika filter = Kadaluarsa */}
                    {statusFilter === "Kadaluarsa" && (
                      <td style={{ ...s.td, textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap" }}>
                          {/* Berfungsi untuk tombol Perpanjang yang membuka RenewModal */}
                          <button
                            onClick={() => openRenewModal(doc)}
                            title="Perpanjang dokumen"
                            style={{
                              border: "none",
                              borderRadius: 10,
                              padding: "8px 12px",
                              background: "#10b981",
                              color: "#fff",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <i className="fas fa-sync-alt" />
                            Perpanjang
                          </button>

                          {/* Berfungsi untuk tombol Riwayat yang membuka HistoryModal */}
                          <button
                            onClick={() => openHistoryModal(doc)}
                            title="Lihat history perpanjangan"
                            style={{
                              border: "none",
                              borderRadius: 10,
                              padding: "8px 12px",
                              background: C.teal,
                              color: "#fff",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <i className="fas fa-history" />
                            Riwayat
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Berfungsi untuk conditional: tampilkan pagination hanya jika totalPages > 1 */}
        {totalPages > 1 && (
          <div style={s.pagination}>
            {/* Berfungsi untuk tombol navigasi sebelumnya (disabled jika halaman 1) */}
            <button onClick={handlePreviousPage} disabled={currentPage === 1} style={s.navBtn(currentPage === 1)}>
              ‹ Sebelumnya
            </button>

            {/* Berfungsi untuk container row tombol nomor halaman */}
            <div style={s.pageRow}>
              {/* Berfungsi untuk memetakan array halaman menjadi tombol-tombol */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const active = page === currentPage;
                return (
                  <button key={page} onClick={() => handlePageChange(page)} style={s.pageBtn(active)}>
                    {/* Berfungsi untuk menampilkan nomor halaman dengan padding 0 di depan jika < 10 */}
                    {String(page).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            {/* Berfungsi untuk tombol navigasi berikutnya (disabled jika halaman terakhir) */}
            <button onClick={handleNextPage} disabled={currentPage === totalPages} style={s.navBtn(currentPage === totalPages)}>
              Berikutnya ›
            </button>
          </div>
        )}
      </div>

      {/* Berfungsi untuk merender HistoryModal dengan props yang sesuai */}
      <HistoryModal
        open={modal.type === "history"}
        onClose={closeModal}
        doc={modal.doc}
        historyCount={historyData?.renewalCount || 0}
        loading={historyLoading}
        historyData={historyData}
      />

      {/* Berfungsi untuk merender RenewModal dengan handler onSubmit yang memanggil API */}
      <RenewModal
        open={modal.type === "renew"}
        onClose={closeModal}
        doc={modal.doc}
        onSubmit={async ({ doc, newEndDate, note }) => {
          try {
            // Berfungsi untuk ambil token auth dari localStorage
            const token = localStorage.getItem("token");

            // Berfungsi untuk fetch API PUT untuk memperpanjang dokumen
            const res = await fetch(`/api/renewal/${doc?.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ newEndDate, notes: note }),
            });

            // Berfungsi untuk parse response JSON
            const data = await res.json();

            // Berfungsi untuk handle error response dari API
            if (!res.ok) {
              alert(data?.message || "Gagal memperpanjang dokumen");
              return;
            }

            // Berfungsi untuk tampilkan alert sukses, tutup modal, dan refresh data jika ada callback
            alert("✅ Berhasil memperpanjang dokumen");
            closeModal();

            if (typeof onRefresh === "function") onRefresh();
          } catch (e) {
            // Berfungsi untuk handle network error atau exception
            console.error("❌ Error renew:", e);
            alert("Terjadi kesalahan saat memperpanjang dokumen");
          }
        }}
      />
    </>
  );
};

// Berfungsi untuk export komponen DocumentTable sebagai default export agar bisa diimpor di file lain
export default DocumentTable;