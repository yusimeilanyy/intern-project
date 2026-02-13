import React, { useState, useEffect } from 'react';
import './DocumentTable.css';

const getStatusBadge = (status) => {
  const badges = {
    active: { text: 'Aktif', class: 'badge-success' },
    expired: { text: 'Kadaluarsa', class: 'badge-danger' },
    expiring: { text: 'Akan Kadaluarsa', class: 'badge-warning' },
  };
  return badges[status] || { text: status, class: 'badge-secondary' };
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ✅ PERBAIKAN: Fungsi untuk mendapatkan jenis dokumen dengan konsistensi maksimal
const getDocumentType = (doc) => {
  // 1. Coba dari payload (jika ada)
  if (doc.payload) {
    try {
      const payload = typeof doc.payload === 'string' ? JSON.parse(doc.payload) : doc.payload;
      if (payload.documentType) return payload.documentType;
      if (payload.type) return payload.type;
      if (payload.jenisDokumen) return payload.jenisDokumen;
    } catch (e) {
      console.error("Error parsing payload:", e);
    }
  }
  
  // 2. Coba dari field langsung
  if (doc.documentType) return doc.documentType;
  if (doc.type) return doc.type;
  if (doc.jenisDokumen) return doc.jenisDokumen;
  
  // 3. Fallback
  return 'MoU/PKS';
};

// ✅ PERBAIKAN: Filter yang sangat fleksibel untuk Non-Pemda
const filterByDocumentType = (documents, documentTypeFilter) => {
  if (!documentTypeFilter || documentTypeFilter === 'all') return documents;
  
  // Normalisasi filter: lowercase + hapus spasi
  const normalizedFilter = documentTypeFilter.toLowerCase().replace(/\s+/g, '');
  
  return documents.filter(doc => {
    const docType = getDocumentType(doc).toLowerCase().replace(/\s+/g, '');
    
    // Handle semua variasi penulisan
    if (normalizedFilter === 'mou' || normalizedFilter === 'memorandum') {
      return docType.includes('mou') || docType.includes('memorandum');
    }
    if (normalizedFilter === 'pks' || normalizedFilter === 'kerja') {
      return docType.includes('pks') || docType.includes('kerja');
    }
    if (normalizedFilter.includes('perjanjian') && normalizedFilter.includes('kerja')) {
      return docType.includes('perjanjian') && docType.includes('kerja');
    }
    
    return docType.includes(normalizedFilter);
  });
};

// ✅ TAMBAHKAN FUNGSI UNTUK CEK STATUS KADALUARSA
const isDocumentExpired = (doc) => {
  if (!doc.cooperationEndDate || doc.cooperationEndDate === '-') return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(doc.cooperationEndDate);
  if (isNaN(endDate.getTime())) return false;
  
  endDate.setHours(0, 0, 0, 0);
  return endDate < today;
};

const DocumentTable = ({ 
  documents, 
  loading, 
  documentTypeFilter = 'all',
  statusFilter = 'all',
  handleRenewClick,
  handleViewHistory
}) => {
  // ✅ State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // 6 dokumen per halaman

  // ✅ Perbaikan: Filter dengan konsistensi maksimal
  const filteredDocuments = filterByDocumentType(documents, documentTypeFilter);

  // ✅ Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [documentTypeFilter, statusFilter, filteredDocuments]);

  // ✅ Hitung total halaman
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  // ✅ Ambil dokumen untuk halaman saat ini
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocuments = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem);

  // ✅ Fungsi untuk pindah ke halaman sebelumnya
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ✅ Fungsi untuk pindah ke halaman berikutnya
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ✅ Fungsi untuk pindah ke halaman tertentu
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  if (!filteredDocuments || filteredDocuments.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p className="empty-text">
          {documentTypeFilter && documentTypeFilter !== 'all' 
            ? `Tidak ada dokumen jenis "${documentTypeFilter}"` 
            : 'Tidak ada data dokumen'}
        </p>
        <p className="empty-hint">
          {documentTypeFilter && documentTypeFilter !== 'all' 
            ? 'Coba pilih jenis dokumen lain atau tambahkan dokumen baru' 
            : 'Silakan tambahkan dokumen kerja sama terlebih dahulu'}
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Daftar Dokumen Terbaru</h3>
        <span className="total-count">Total : {filteredDocuments.length}</span>
      </div>
      
      <div className="table-responsive">
        <table className="document-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Jenis</th>
              <th>Nomor Dokumen</th>
              <th>Mitra</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Berakhir</th>
              <th>Status</th>
              {/* ✅ TAMBAHKAN KOLOM AKSI JIKA FILTER KADALUARSA */}
              {statusFilter === 'Kadaluarsa' && <th>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {currentDocuments.map((doc, index) => {
              const badge = getStatusBadge(doc.status || (isDocumentExpired(doc) ? 'expired' : 'active'));
              const docType = getDocumentType(doc); // ✅ Gunakan fungsi konsisten
              
              return (
                <tr key={doc.id || index}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>
                    <span className={`doc-type doc-type-${docType.toLowerCase().replace(/\s+/g, '-')}`}>
                      {docType}
                    </span>
                  </td>
                  <td>{doc.documentNumber || doc.officeDocNumber || '-'}</td>
                  <td>
                    {doc.partnerName || 
                     doc.institutionalLevel || 
                     doc.institution || 
                     (doc.payload && typeof doc.payload === 'string' 
                        ? JSON.parse(doc.payload).institutionalLevel 
                        : '-')}
                  </td>
                  <td>{formatDate(doc.startDate || doc.cooperationStartDate)}</td>
                  <td>{formatDate(doc.endDate || doc.cooperationEndDate)}</td>
                  <td>
                    <span className={`badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </td>
                  {/* ✅ TAMBAHKAN KOLOM AKSI JIKA FILTER KADALUARSA */}
                  {statusFilter === 'Kadaluarsa' && (
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleRenewClick(doc)}
                          className="btn-renew"
                          title="Perpanjang dokumen"
                        >
                          <i className="fas fa-sync-alt"></i> Perpanjang
                        </button>
                        <button
                          onClick={() => handleViewHistory(doc.id)}
                          className="btn-history"
                          title="Lihat history perpanjangan"
                        >
                          <i className="fas fa-history"></i> History
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

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredDocuments.length)} dari {filteredDocuments.length} dokumen
          </div>
          
          <div className="pagination-controls">
            <button 
              onClick={handlePreviousPage} 
              disabled={currentPage === 1}
              className="pagination-btn pagination-btn-prev"
            >
              <i className="fas fa-chevron-left"></i> Sebelumnya
            </button>

            <div className="pagination-pages">
              {/* Tombol halaman 1 */}
              {currentPage > 3 && (
                <>
                  <button 
                    onClick={() => handlePageChange(1)} 
                    className={`pagination-page ${currentPage === 1 ? 'active' : ''}`}
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
                </>
              )}

              {/* Tombol halaman di sekitar halaman aktif */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Tampilkan halaman aktif dan 2 halaman sebelum/sesudahnya
                  return page >= Math.max(2, currentPage - 2) && 
                         page <= Math.min(totalPages - 1, currentPage + 2);
                })
                .map(page => (
                  <button 
                    key={page} 
                    onClick={() => handlePageChange(page)} 
                    className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                ))}

              {/* Tombol halaman terakhir */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                  <button 
                    onClick={() => handlePageChange(totalPages)} 
                    className={`pagination-page ${currentPage === totalPages ? 'active' : ''}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
              className="pagination-btn pagination-btn-next"
            >
              Selanjutnya <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;