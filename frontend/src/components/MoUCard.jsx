import { format } from 'date-fns';

export default function MoUCard({ mou, onEdit, onDelete }) {
  // Jika mou tidak ada, jangan render
  if (!mou) return null;

  const startDate = new Date(mou.startDate || '');
  const endDate = new Date(mou.endDate || '');
  const isExpired = endDate < new Date();

  // Status Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Baru':
        return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Baru</span>;
      case 'Aktif':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">Aktif</span>;
      case 'Selesai':
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Selesai</span>;
      case 'Dibatalkan':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">Dibatalkan</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="border-b border-gray-200 hover:bg-gray-50 transition">
      <div className="grid grid-cols-12 gap-2 p-3 items-center text-sm">
        {/* Level */}
        <div className="col-span-1 truncate">{mou.level || '-'}</div>
        
        {/* Type */}
        <div className="col-span-1 truncate">{mou.typeMoU || '-'}</div>
        
        {/* BPSDMP PIC */}
        <div className="col-span-2 truncate">{mou.picBpsdmp || '-'}</div>
        
        {/* Local Gov PIC */}
        <div className="col-span-2 truncate">{mou.picPemda || '-'}</div>
        
        {/* Start Date */}
        <div className="col-span-2 truncate">{startDate instanceof Date && !isNaN(startDate) ? format(startDate, 'dd MMM yyyy') : '-'}</div>
        
        {/* End Date */}
        <div className="col-span-2 truncate">{endDate instanceof Date && !isNaN(endDate) ? format(endDate, 'dd MMM yyyy') : '-'}</div>
        
        {/* Status */}
        <div className="col-span-1">{getStatusBadge(mou.status)}</div>
        
        {/* Owner */}
        <div className="col-span-1 truncate">{mou.owner || '-'}</div>
        
        {/* Actions */}
        <div className="col-span-1 flex gap-2 justify-end">
          <button
            onClick={() => onEdit(mou)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 0V4l4 4L9 12V8h6V6h2V4z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(mou.id)}
            className="text-red-600 hover:text-red-800"
            title="Hapus"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A1 1 0 0117.133 21H6.867A1 1 0 015 19.133L3.867 7H19z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 7l1 12h16l1-12M3 7h18v6H3V7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}