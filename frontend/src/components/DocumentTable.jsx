import React from 'react';
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

const DocumentTable = ({ documents, loading, documentTypeFilter = 'all' }) => {
  // ✅ Perbaikan: Filter dengan konsistensi maksimal
  const filteredDocuments = filterByDocumentType(documents, documentTypeFilter);

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
        <span className="total-count">Total: {filteredDocuments.length}</span>
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
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc, index) => {
              const badge = getStatusBadge(doc.status);
              const docType = getDocumentType(doc); // ✅ Gunakan fungsi konsisten
              
              return (
                <tr key={doc.id || index}>
                  <td>{index + 1}</td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* ✅ TAMBAHAN: Info filter yang aktif */}
      {documentTypeFilter && documentTypeFilter !== 'all' && (
        <div className="filter-info">
          <span className="filter-badge">
            <span className="filter-icon">FilterWhere</span>
            Menampilkan: <strong>{documentTypeFilter}</strong>
          </span>
          <span className="filter-count">
            ({filteredDocuments.length} dokumen)
          </span>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;