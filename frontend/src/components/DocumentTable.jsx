import { AlignCenter } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const getStatusBadge = (status) => {
  const badges = {
    active: { text: "Aktif", tone: "success" },
    expired: { text: "Kadaluarsa", tone: "danger" },
    expiring: { text: "Akan Kadaluarsa", tone: "warning" },
  };
  return badges[status] || { text: status, tone: "neutral" };
};

// ✅ persis seperti screenshot (11 Februari 2026)
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDocumentType = (doc) => {
  if (doc?.payload) {
    try {
      const payload = typeof doc.payload === "string" ? JSON.parse(doc.payload) : doc.payload;
      if (payload.documentType) return payload.documentType;
      if (payload.type) return payload.type;
      if (payload.jenisDokumen) return payload.jenisDokumen;
    } catch (e) {
      console.error("Error parsing payload:", e);
    }
  }
  if (doc?.documentType) return doc.documentType;
  if (doc?.type) return doc.type;
  if (doc?.jenisDokumen) return doc.jenisDokumen;
  return "MoU/PKS";
};

const filterByDocumentType = (documents, documentTypeFilter) => {
  if (!documentTypeFilter || documentTypeFilter === "all") return documents;

  const normalizedFilter = documentTypeFilter.toLowerCase().replace(/\s+/g, "");
  return documents.filter((doc) => {
    const docType = getDocumentType(doc).toLowerCase().replace(/\s+/g, "");
    if (normalizedFilter === "mou" || normalizedFilter === "memorandum") {
      return docType.includes("mou") || docType.includes("memorandum");
    }
    if (normalizedFilter === "pks" || normalizedFilter === "kerja") {
      return docType.includes("pks") || docType.includes("kerja");
    }
    if (normalizedFilter.includes("perjanjian") && normalizedFilter.includes("kerja")) {
      return docType.includes("perjanjian") && docType.includes("kerja");
    }
    return docType.includes(normalizedFilter);
  });
};

const isDocumentExpired = (doc) => {
  if (!doc?.cooperationEndDate || doc.cooperationEndDate === "-") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(doc.cooperationEndDate);
  if (isNaN(endDate.getTime())) return false;

  endDate.setHours(0, 0, 0, 0);
  return endDate < today;
};

/* =========================
   ✅ UPDATE KECIL: AMBIL STATUS PROSES DARI ROOT DULU (subStatus/statusAkhir)
   ========================= */
const getProcessStatus = (doc) => {
  const rootStatus = doc?.status;

  const s = (rootStatus || "").toString().trim().toLowerCase();
  const isLifecycle = s === "aktif" || s === "kadaluarsa" || s === "active" || s === "expired" || s === "expiring";

  if (rootStatus && !isLifecycle) return rootStatus;

  const rootLastProcess = doc?.subStatus || doc?.statusAkhir;
  if (rootLastProcess) return rootLastProcess;

  if (doc?.payload) {
    try {
      const payload = typeof doc.payload === "string" ? JSON.parse(doc.payload) : doc.payload;
      const payloadStatus = payload?.status;
      const payloadLast = payload?.subStatus || payload?.statusAkhir;

      if (payloadStatus) return payloadStatus;
      if (payloadLast) return payloadLast;
    } catch (e) {}
  }

  return isDocumentExpired(doc) ? "expired" : "active";
};

/* =========================
   MODAL UI (INLINE)
   ========================= */
const TEAL = "#07b8af";
const TEAL_DARK = "#008a9a";
const NAVY = "#0b2e4b";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "rgba(2, 6, 23, 0.10)";

function ModalShell({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 18px 40px rgba(2,6,23,0.25)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ iconNode, title, onClose }) {
  return (
    <div
      style={{
        padding: "14px 18px 12px",
        borderBottom: "1px solid rgba(2,6,23,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: TEAL,
          lineHeight: 1,
        }}
      >
        {iconNode}
      </div>

      <div style={{ flex: 1, fontSize: 18, fontWeight: 600, color: NAVY }}>{title}</div>

      <button
        onClick={onClose}
        aria-label="Tutup"
        style={{
          border: "none",
          background: "transparent",
          fontSize: 18,
          cursor: "pointer",
          color: MUTED,
          padding: 6,
          borderRadius: 10,
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ✅ HistoryModal: rapih + scroll nempel sisi modal */
function HistoryModal({ open, onClose, doc, historyCount = 0, loading, historyData }) {
  const titleLine = useMemo(() => {
    const type = getDocumentType(doc || {});
    const partner = doc?.partnerName || doc?.institutionalLevel || doc?.institution || "N/A";
    return `${type} - ${partner}`;
  }, [doc]);

  const historyList = historyData?.history || [];
  const hasHistory = !loading && historyList.length > 0;

  return (
    <ModalShell open={open} onClose={onClose}>
      <ModalHeader iconNode={<i className="fas fa-history" style={{ color: TEAL }} />} title="Riwayat Perpanjangan" onClose={onClose} />

      {/* ✅ BODY WRAPPER: bikin modal tinggi hanya kalau ada riwayat */}
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          ...(hasHistory ? { height: "72vh", minHeight: 0 } : {}),
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{titleLine}</div>

          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Jumlah Perpanjangan :</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: NAVY }}>{loading ? "…" : `${historyCount}x`}</div>
        </div>

        {/* ✅ EMPTY STATE: compact & bersih */}
        {!hasHistory ? (
          <div
            style={{
              border: "1px solid rgba(2,6,23,0.08)",
              borderRadius: 12,
              background: "#fff",
              padding: 16,
              textAlign: "center",
              color: NAVY,
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            {loading ? "Memuat riwayat..." : "Belum ada riwayat perpanjangan"}
          </div>
        ) : (
          /* ✅ LIST WRAP: scrollnya di container ini, full lebar modal */
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              paddingRight: 6, // ✅ kasih ruang supaya scrollbar gak nutup teks
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {historyList.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid rgba(2,6,23,0.08)",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 10 }}>{formatDate(h?.date)}</div>

                  <div style={{ fontSize: 13, color: "#334155", display: "grid", gap: 6 }}>
                    <div>
                      <strong>Tanggal Berakhir Lama:</strong> {h?.oldEndDate || "-"}
                    </div>
                    <div>
                      <strong>Tanggal Berakhir Baru:</strong> {h?.newEndDate || "-"}
                    </div>
                    <div>
                      <strong>Status Sebelum:</strong> {h?.subStatusBefore || "-"}
                    </div>
                    <div>
                      <strong>Status Sesudah:</strong> {h?.subStatusAfter || "-"}
                    </div>
                    <div>
                      <strong>Catatan:</strong> {h?.notes || "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            border: "none",
            background: TEAL,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            padding: "12px 14px",
            borderRadius: 12,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = TEAL_DARK)}
          onMouseLeave={(e) => (e.currentTarget.style.background = TEAL)}
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  );
}

function RenewModal({ open, onClose, doc, onSubmit }) {
  const [newEndDate, setNewEndDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setNewEndDate("");
      setNote("");
    }
  }, [open]);

  const type = getDocumentType(doc || {});
  const partner = doc?.partnerName || doc?.institutionalLevel || doc?.institution || "N/A";

  return (
    <ModalShell open={open} onClose={onClose}>
      <ModalHeader iconNode={<i className="fas fa-sync-alt" style={{ color: "#11ba82" }} />} title="Perpanjang Dokumen" onClose={onClose} />

      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 14 }}>
          <span style={{ fontWeight: 700 }}>{type}</span> dengan <span style={{ fontWeight: 700 }}>{partner}</span>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
          Tanggal Berakhir Baru <span style={{ color: "#ef4444" }}>*</span>
        </label>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <input
            type="date"
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 44px 12px 12px",
              borderRadius: 12,
              border: `1px solid ${BORDER}`,
              outline: "none",
              fontSize: 14,
              color: TEXT,
              background: "#fff",
            }}
          />
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none", fontSize: 16 }} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: "rgba(245, 158, 11, 0.12)",
            color: "#7c2d12",
            padding: 12,
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 16, lineHeight: 1 }}>⚠️</div>
          <div style={{ lineHeight: 1.35, fontWeight: 600, fontSize: 13 }}>
            Status dokumen Anda akan diperbarui secara otomatis menjadi 'Aktif' setelah proses perpanjangan berhasil diselesaikan
          </div>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
          Catatan Perpanjangan (Opsional)
        </label>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contoh: Perpanjangan sesuai hasil evaluasi tahun 2026"
          style={{
            width: "100%",
            minHeight: 110,
            padding: 12,
            borderRadius: 12,
            border: `1px solid ${BORDER}`,
            outline: "none",
            fontSize: 14,
            color: TEXT,
            resize: "vertical",
            marginBottom: 16,
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: `1px solid ${BORDER}`,
              background: "#fff",
              color: NAVY,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Batal
          </button>

          <button
            onClick={() => onSubmit?.({ doc, newEndDate, note })}
            disabled={!newEndDate}
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "none",
              background: !newEndDate ? "rgba(2,6,23,0.12)" : "rgb(7, 184, 175)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
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
const DocumentTable = ({ documents, loading, documentTypeFilter = "all", statusFilter = "all", onRefresh }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredDocuments = useMemo(() => filterByDocumentType(documents || [], documentTypeFilter), [documents, documentTypeFilter]);

  useEffect(() => setCurrentPage(1), [documentTypeFilter, statusFilter, filteredDocuments]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocuments = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);

  const handlePreviousPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const C = {
    text: "#0f172a",
    muted: "#64748b",
    border: "rgba(2, 6, 23, 0.08)",
    softBorder: "rgba(2, 6, 23, 0.06)",
    bg: "#ffffff",
    headBg: "#ffffff",
    teal: "#07b8af",
    tealSoft: "rgba(7, 184, 175, 0.16)",
    pksBg: "rgba(255, 107, 53, 0.14)",
    pksText: "#c2410c",
    statusBg: "rgba(2, 6, 23, 0.04)",
    statusText: "#0b2e4b",
  };

  const s = {
    card: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, boxShadow: "0 10px 28px rgba(2, 6, 23, 0.06)" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.softBorder}` },
    title: { fontSize: 18, fontWeight: 600, color: C.text, margin: 0 },
    total: { fontSize: 14, fontWeight: 500, color: C.muted },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
    th: { padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#0b2e4b", background: C.headBg, textAlign: "left", borderBottom: `1px solid ${C.softBorder}`, whiteSpace: "nowrap" },
    td: { padding: "16px 16px", fontSize: 14, color: C.text, borderBottom: `1px solid rgba(2, 6, 23, 0.04)`, verticalAlign: "middle" },
    docPill: (type) => {
      const key = (type || "").toLowerCase();
      if (key.includes("pks")) {
        return { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: C.pksBg, color: C.pksText, minWidth: 58 };
      }
      return { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: C.tealSoft, color: "#007a73", minWidth: 58 };
    },
    statusPill: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13, background: C.statusBg, color: C.statusText, whiteSpace: "nowrap" },
    pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 12, userSelect: "none" },
    navBtn: (disabled) => ({ border: "none", background: "transparent", fontSize: 13, color: disabled ? "rgba(100, 116, 139, 0.35)" : "#64748b", cursor: disabled ? "not-allowed" : "pointer", padding: "4px 8px", borderRadius: 10, fontWeight: 500 }),
    pageRow: { display: "flex", alignItems: "center", gap: 12 },
    pageBtn: (active) => ({ border: "none", background: active ? C.teal : "transparent", color: active ? "#fff" : "#94a3b8", fontWeight: 600, fontSize: 14, width: 28, height: 28, borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: active ? "0 8px 16px rgba(7, 184, 175, 0.22)" : "none" }),
  };

  const [hoverIdx, setHoverIdx] = useState(null);
  const [modal, setModal] = useState({ type: null, doc: null });

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const openRenewModal = (doc) => setModal({ type: "renew", doc });

  const openHistoryModal = async (doc) => {
    setModal({ type: "history", doc });
    setHistoryData(null);
    setHistoryLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/renewal/${doc?.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("History API error:", data);
        setHistoryData(null);
        alert(data?.message || "Gagal mengambil riwayat perpanjangan");
      } else {
        setHistoryData(data);
      }
    } catch (e) {
      console.error("❌ Error fetch history:", e);
      setHistoryData(null);
      alert("Terjadi kesalahan saat mengambil riwayat perpanjangan");
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ type: null, doc: null });
    setHistoryData(null);
    setHistoryLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 30, color: C.muted }}>Memuat data...</div>;
  }

  if (!filteredDocuments || filteredDocuments.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 34, color: C.muted }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>📋</div>
        <div style={{ fontWeight: 600, color: C.text }}>Tidak ada data dokumen</div>
      </div>
    );
  }

  return (
    <>
      <div style={s.card}>
        <div style={s.header}>
          <h3 style={s.title}>Daftar Dokumen Terbaru</h3>
          <span style={s.total}>Total : {filteredDocuments.length}</span>
        </div>

        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 70 }}>No</th>
                <th style={{ ...s.th, width: 120 }}>Jenis</th>
                <th style={s.th}>Nomor Dokumen</th>
                <th style={s.th}>Mitra</th>
                <th style={{ ...s.th, width: 180 }}>Tanggal Mulai</th>
                <th style={{ ...s.th, width: 180 }}>Tanggal Berakhir</th>
                <th style={{ ...s.th, width: 220 }}>Status</th>
                {statusFilter === "Kadaluarsa" && <th style={{ ...s.th, width: 220 }}>Aksi</th>}
              </tr>
            </thead>

            <tbody>
              {currentDocuments.map((doc, idx) => {
                const processStatus = getProcessStatus(doc);
                const badge = getStatusBadge(processStatus);
                const docType = getDocumentType(doc);

                return (
                  <tr
                    key={doc.id || idx}
                    onMouseEnter={() => setHoverIdx(idx)}
                    onMouseLeave={() => setHoverIdx(null)}
                    style={{ background: hoverIdx === idx ? "#ebfaf9" : "transparent" }}
                  >
                    <td style={s.td}>{indexOfFirstItem + idx + 1}</td>

                    <td style={s.td}>
                      <span style={s.docPill(docType)}>{docType}</span>
                    </td>

                    <td style={s.td}>{doc.documentNumber || doc.officeDocNumber || "-"}</td>

                    <td style={s.td}>
                      {doc.partnerName ||
                        doc.institutionalLevel ||
                        doc.institution ||
                        (doc.payload && typeof doc.payload === "string"
                          ? (() => {
                              try {
                                return JSON.parse(doc.payload).institutionalLevel || "-";
                              } catch {
                                return "-";
                              }
                            })()
                          : "-")}
                    </td>

                    <td style={s.td}>{formatDate(doc.startDate || doc.cooperationStartDate)}</td>
                    <td style={s.td}>{formatDate(doc.endDate || doc.cooperationEndDate)}</td>

                    <td style={s.td}>
                      <span style={s.statusPill}>{badge.text}</span>
                    </td>

                    {statusFilter === "Kadaluarsa" && (
                      <td style={{ ...s.td, textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap" }}>
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

        {totalPages > 1 && (
          <div style={s.pagination}>
            <button onClick={handlePreviousPage} disabled={currentPage === 1} style={s.navBtn(currentPage === 1)}>
              ‹ Sebelumnya
            </button>

            <div style={s.pageRow}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const active = page === currentPage;
                return (
                  <button key={page} onClick={() => handlePageChange(page)} style={s.pageBtn(active)}>
                    {String(page).padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            <button onClick={handleNextPage} disabled={currentPage === totalPages} style={s.navBtn(currentPage === totalPages)}>
              Berikutnya ›
            </button>
          </div>
        )}
      </div>

      <HistoryModal
        open={modal.type === "history"}
        onClose={closeModal}
        doc={modal.doc}
        historyCount={historyData?.renewalCount || 0}
        loading={historyLoading}
        historyData={historyData}
      />

      <RenewModal
        open={modal.type === "renew"}
        onClose={closeModal}
        doc={modal.doc}
        onSubmit={async ({ doc, newEndDate, note }) => {
          try {
            const token = localStorage.getItem("token");

            const res = await fetch(`/api/renewal/${doc?.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ newEndDate, notes: note }),
            });

            const data = await res.json();

            if (!res.ok) {
              alert(data?.message || "Gagal memperpanjang dokumen");
              return;
            }

            alert("✅ Berhasil memperpanjang dokumen");
            closeModal();

            if (typeof onRefresh === "function") onRefresh();
          } catch (e) {
            console.error("❌ Error renew:", e);
            alert("Terjadi kesalahan saat memperpanjang dokumen");
          }
        }}
      />
    </>
  );
};

export default DocumentTable;