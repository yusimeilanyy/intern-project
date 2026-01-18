export default function FilterStatus({ onFilterChange }) {
  return (
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.586.894l-6 6a1 1 0 01-1.414 0l-6-6A1 1 0 013 6.586V4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-6-6" />
      </svg>
      <select
        onChange={(e) => onFilterChange(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
      >
        <option value="semua">Semua Status</option>
        <option value="Dalam Proses">Dalam Proses</option>
        <option value="Review PEMDA 1">Review PEMDA 1</option>
        <option value="Review BPSDMP Kominfo">Review BPSDMP Kominfo</option>
        <option value="Review BPSDMP 1">Review BPSDMP 1</option>
        <option value="Review PEMDA 2">Review PEMDA 2</option>
        <option value="Review BPSDMP 2">Review BPSDMP 2</option>
        <option value="Persiapan TTD Para Pihak">Persiapan TTD Para Pihak</option>
        <option value="Dalam Proses">Selesai</option>
      </select>
    </div>
  );
}