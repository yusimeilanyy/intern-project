// src/components/MoUList.jsx
import MoUCard from './MouCard';
import MoUListEmpty from './MoUListEmpty';

export default function MoUList({ mous, onEdit, onDelete }) {
  // Jika mous tidak ada atau bukan array, tampilkan empty state
  if (!mous || !Array.isArray(mous)) {
    return <MoUListEmpty />;
  }

  // Jika kosong, tampilkan pesan kosong
  if (mous.length === 0) {
    return <MoUListEmpty />;
  }

  return (
    <div className="border rounded-lg shadow overflow-x-auto">
      {/* Header Tabel */}
      <div className="grid grid-cols-12 gap-2 p-3 border-b bg-gray-50 font-medium text-sm text-gray-700">
        <div className="col-span-1">Tingkat</div>
        <div className="col-span-1">Jenis</div>
        <div className="col-span-2">PIC BPSDMP</div>
        <div className="col-span-2">PIC Pemerintah</div>
        <div className="col-span-2">Tanggal Dimulai</div>
        <div className="col-span-2">Tanggal Berakhir</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Pemilik</div>
        <div className="col-span-1">Aksi</div>
      </div>

      {/* Daftar MoU */}
      <div>
        {mous.map(mou => (
          <MoUCard
            key={mou.id}
            mou={mou}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}