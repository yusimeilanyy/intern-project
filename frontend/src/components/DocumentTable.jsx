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

const DocumentTable = ({ documents, loading }) => {
  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  if (!documents || documents.length === 0) {
    return <div className="empty-state">Tidak ada data dokumen</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Daftar Dokumen Terbaru</h3>
        <span className="total-count">Total: {documents.length}</span>
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
            {documents.map((doc, index) => {
              const badge = getStatusBadge(doc.status);
              return (
                <tr key={doc.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <span className={`doc-type doc-type-${doc.documentType?.toLowerCase()}`}>
                      {doc.type || 'MoU/PKS'}
                    </span>
                  </td>
                  <td>{doc.documentNumber || '-'}</td>
                  <td>{doc.partnerName || '-'}</td>
                  <td>{formatDate(doc.startDate)}</td>
                  <td>{formatDate(doc.endDate)}</td>
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
    </div>
  );
};

export default DocumentTable;