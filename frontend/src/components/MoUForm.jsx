// Berfungsi untuk mengimpor hook useState dan useEffect dari React untuk manajemen state lokal dan side effect lifecycle component
import { useState, useEffect } from 'react';
// Berfungsi untuk mengimpor data provinsi dan kabupaten/kota dari file utils/regions untuk populate dropdown select
import { provinces, regencies } from '../utils/regions';

// ========================================
// KOMPONEN FORM MoU - FUNGSIONAL COMPONENT
// ========================================
// Berfungsi untuk mendefinisikan komponen functional MoUForm yang menerima props initialData, onSubmit, onCancel, dan type
export default function MoUForm({ initialData = null, onSubmit, onCancel, type }) {
  
  // ========================================
  // STATE MANAGEMENT - FORM DATA
  // ========================================
  // Berfungsi untuk menyimpan objek formData yang berisi semua field input form dengan nilai default kosong
  const [formData, setFormData] = useState({
    title: '', // Berfungsi untuk menyimpan nilai input judul dokumen (jika ada)
    governmentLevel: '', // Berfungsi untuk menyimpan nilai select tingkat pemerintahan (Provinsi/Kota/Kabupaten)
    typeMoU: '', // Berfungsi untuk menyimpan nilai select jenis MoU (Kerjasama Teknis/Penelitian/dll)
    picBpsdmp: '', // Berfungsi untuk menyimpan nilai input nama PIC dari BPSDMP Kominfo Manado
    docNumberBalai: '', // Berfungsi untuk menyimpan nilai input nomor dokumen dari pihak Balai
    docNumber: '', // Berfungsi untuk menyimpan nilai input nomor dokumen dari mitra (jika ada)
    picPemda: '', // Berfungsi untuk menyimpan nilai input nama PIC dari Pemerintah Daerah
    contactPicPemda: '', // Berfungsi untuk menyimpan nilai input kontak/nomor PIC Pemda
    owner: '', // Berfungsi untuk menyimpan nilai input nama pemilik/pemegang dokumen
    startDate: '', // Berfungsi untuk menyimpan nilai input date tanggal mulai kerjasama
    endDate: '', // Berfungsi untuk menyimpan nilai input date tanggal berakhir kerjasama
    finalDoc: null, // Berfungsi untuk menyimpan objek File hasil upload dari input file
    finalDocName: '', // Berfungsi untuk menyimpan string nama file untuk ditampilkan di UI
    notes: '', // Berfungsi untuk menyimpan nilai textarea catatan tambahan
    status: 'Baru', // Berfungsi untuk menyimpan nilai select status dokumen (default: 'Baru')
    provinceId: '', // Berfungsi untuk menyimpan ID provinsi yang dipilih untuk filter kabupaten
    regencyId: '', // Berfungsi untuk menyimpan ID kabupaten/kota yang dipilih
  });

  // ========================================
  // STATE MANAGEMENT - DROPDOWN SELECTION
  // ========================================
  // Berfungsi untuk menyimpan ID provinsi yang dipilih di dropdown (terpisah dari formData untuk kontrol render)
  const [selectedProvince, setSelectedProvince] = useState('');
  // Berfungsi untuk menyimpan ID kabupaten/kota yang dipilih di dropdown (terpisah dari formData untuk kontrol render)
  const [selectedRegency, setSelectedRegency] = useState('');

  // ========================================
  // EFFECT: POPULATE FORM SAAT EDIT MODE
  // ========================================
  // Berfungsi untuk menjalankan side effect: mengisi formData dengan initialData ketika komponen mount atau initialData berubah
  useEffect(() => {
    // Berfungsi untuk cek jika ada initialData (mode edit), maka populate form
    if (initialData) {
      // Berfungsi untuk update formData dengan nilai dari initialData, fallback ke empty string jika null/undefined
      setFormData({
        title: initialData.title || '',
        governmentLevel: initialData.governmentLevel || '',
        typeMoU: initialData.typeMoU || '',
        picBpsdmp: initialData.picBpsdmp || '',
        docNumberBalai: initialData.docNumberBalai || '',
        docNumber: initialData.docNumber || '',
        picPemda: initialData.picPemda || '',
        contactPicPemda: initialData.contactPicPemda || '',
        owner: initialData.owner || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        finalDoc: null, // Berfungsi untuk reset file input saat edit (file lama tidak diupload ulang)
        finalDocName: initialData.finalDocName || '', // Berfungsi untuk tampilkan nama file lama jika ada
        notes: initialData.notes || '',
        status: initialData.status || 'Baru',
        provinceId: initialData.provinceId || '',
        regencyId: initialData.regencyId || '',
      });
      // Berfungsi untuk update state dropdown province dan regency agar sesuai dengan data yang diedit
      setSelectedProvince(initialData.provinceId || '');
      setSelectedRegency(initialData.regencyId || '');
    }
  }, [initialData]); // Berfungsi untuk dependency array: effect hanya jalan ketika initialData berubah

  // ========================================
  // HANDLER: CHANGE INPUT TEXT/SELECT
  // ========================================
  // Berfungsi untuk handler generic yang menangani perubahan nilai pada input text, select, atau textarea
  const handleChange = (e) => {
    const { name, value } = e.target; // Berfungsi untuk ekstrak nama field dan nilai baru dari event target
    // Berfungsi untuk update formData dengan spread operator: copy semua field lama, lalu override field yang berubah
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ========================================
  // HANDLER: CHANGE INPUT FILE
  // ========================================
  // Berfungsi untuk handler khusus yang menangani perubahan pada input file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Berfungsi untuk mengambil file pertama dari FileList (input file bisa multi tapi kita ambil satu)
    // Berfungsi untuk cek jika file ada (user memilih file, bukan batal)
    if (file) {
      // Berfungsi untuk update formData: simpan objek File lengkap dan nama filenya secara terpisah
      setFormData(prev => ({
        ...prev,
        finalDoc: file, // Menyimpan file lengkap - Berfungsi agar bisa diupload ke backend via FormData
        finalDocName: file.name, // Menyimpan nama file - Berfungsi untuk ditampilkan di UI sebagai feedback ke user
      }));
    }
  };

  // ========================================
  // HANDLER: CHANGE DROPDOWN PROVINSI
  // ========================================
  // Berfungsi untuk handler ketika user memilih provinsi di dropdown, yang akan memfilter opsi kabupaten/kota
  const handleProvinceChange = (e) => {
    const provinceId = e.target.value; // Berfungsi untuk mengambil ID provinsi yang dipilih dari value option
    setSelectedProvince(provinceId); // Berfungsi untuk update state selectedProvince agar dropdown kab/kota re-render
    setSelectedRegency(''); // Berfungsi untuk reset pilihan kabupaten/kota karena provinsi berubah (hindari data tidak konsisten)
    // Berfungsi untuk update formData: set provinceId baru dan reset regencyId ke empty string
    setFormData(prev => ({
      ...prev,
      provinceId,
      regencyId: ''
    }));
  };

  // ========================================
  // HANDLER: CHANGE DROPDOWN KABUPATEN/KOTA
  // ========================================
  // Berfungsi untuk handler ketika user memilih kabupaten/kota di dropdown
  const handleRegencyChange = (e) => {
    const regencyId = e.target.value; // Berfungsi untuk mengambil ID kabupaten/kota yang dipilih dari value option
    setSelectedRegency(regencyId); // Berfungsi untuk update state selectedRegency (bisa digunakan untuk logic lain jika perlu)
    // Berfungsi untuk update formData: set regencyId dengan nilai yang dipilih user
    setFormData(prev => ({ ...prev, regencyId }));
  };

  // ========================================
  // HANDLER: SUBMIT FORM
  // ========================================
  // Berfungsi untuk handler ketika user klik tombol submit, yang akan memvalidasi dan mengirim data ke parent component
  const handleSubmit = (e) => {
    e.preventDefault(); // Berfungsi untuk mencegah default behavior browser (reload halaman) saat form disubmit

    // Berfungsi untuk destructuring formData: ambil semua field kecuali finalDoc (karena file ditangani terpisah)
    const { finalDoc, ...rest } = formData;

    // Berfungsi untuk menyiapkan objek data yang akan dikirim ke backend, dengan tambahan field category berdasarkan prop type
    const dataToSubmit = {
      ...rest, // Berfungsi untuk spread semua field formData kecuali finalDoc
      category: type === 'pemda' ? 'pemda' : 'non_pemda', // Tambahkan category jika diperlukan - Berfungsi untuk backend tahu jenis dokumen
    };

    // Berfungsi untuk membuat instance FormData (built-in browser API) untuk mengirim data multipart/form-data (termasuk file)
    const fd = new FormData();
    fd.append("category", dataToSubmit.category); // Berfungsi untuk append field category ke FormData
    fd.append("payload", JSON.stringify(dataToSubmit)); // Berfungsi untuk append field payload sebagai JSON string (data form lainnya)

    // Menambahkan file ke FormData jika ada - Berfungsi untuk mengirim file hanya jika user memilih file baru
    if (finalDoc) {
      fd.append("file", finalDoc); // Berfungsi untuk append file dengan key "file" agar backend bisa akses via req.file
    }

    // Berfungsi untuk log data yang akan dikirim ke console untuk debugging/development
    console.log("Data yang dikirimkan ke backend:", dataToSubmit);

    // Berfungsi untuk memanggil callback onSubmit dari parent component dengan FormData yang sudah disiapkan
    onSubmit(fd);
  };

  // ========================================
  // RENDER: MODAL CONTAINER
  // ========================================
  // Berfungsi untuk merender modal overlay dengan background semi-transparan yang menutupi seluruh viewport
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Berfungsi untuk container konten modal dengan background putih, rounded corner, scrollable, dan max-height 90vh */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          {/* Berfungsi untuk judul modal yang dinamis: "Edit MoU" jika ada initialData, atau "Tambah MoU Baru" jika mode create */}
          <h2 className="text-xl font-bold mb-4">
            {initialData ? 'Edit MoU' : 'Tambah MoU Baru'}
          </h2>
          
          {/* Berfungsi untuk form element dengan handler submit yang memanggil handleSubmit */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Section */}
            {/* Berfungsi untuk section header dengan border bottom sebagai pemisah visual */}
            <div className="border-b pb-4 mb-4">
              {/* Berfungsi untuk sub-judul yang menampilkan jenis form berdasarkan prop type (pemda/non-pemda) */}
              <h3 className="font-semibold text-lg">
                Tambah MoU {type === 'pemda' ? 'Pemerintah Daerah' : 'Non-Pemerintah Daerah'}
              </h3>
            </div>

            {/* Row 1: Jenis MoU & Tingkat Pemerintahan Daerah */}
            {/* Berfungsi untuk grid 2 kolom di layar medium+, 1 kolom di mobile, dengan gap 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom 1: Dropdown Jenis MoU */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Jenis MoU</label>
                {/* Berfungsi untuk select input dengan name, value, onChange, required, dan styling Tailwind */}
                <select
                  name="typeMoU"
                  value={formData.typeMoU}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Pilih jenis MoU</option>
                  {/* Berfungsi untuk memetakan array opsi jenis MoU menjadi option elements */}
                  <option value="Kerjasama Teknis">Kerjasama Teknis</option>
                  <option value="Penelitian">Penelitian</option>
                  <option value="Pelatihan">Pelatihan</option>
                  <option value="Pengembangan SDM">Pengembangan SDM</option>
                </select>
              </div>
              
              {/* Kolom 2: Dropdown Tingkat Pemerintahan (HANYA tampil jika type === 'pemda') */}
              {type === 'pemda' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tingkat Pemerintahan Daerah</label>
                  {/* Berfungsi untuk select input tingkat pemerintahan dengan required validation */}
                  <select
                    name="governmentLevel"
                    value={formData.governmentLevel}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Pilih tingkat</option>
                    <option value="Pemerintahan Provinsi">Pemerintahan Provinsi</option>
                    <option value="Pemerintahan Kota">Pemerintahan Kota</option>
                    <option value="Pemerintahan Kabupaten">Pemerintahan Kabupaten</option>
                  </select>
                </div>
              )}
            </div>

            {/* Row 2: Provinsi & Kabupaten/Kota (HANYA tampil jika type === 'pemda' DAN governmentLevel sudah dipilih) */}
            {type === 'pemda' && formData.governmentLevel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom Provinsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provinsi</label>
                  {/* Berfungsi untuk select provinsi dengan value dari state selectedProvince dan onChange handler khusus */}
                  <select
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Pilih Provinsi</option>
                    {/* Berfungsi untuk memetakan array provinces dari utils/regions menjadi option elements */}
                    {provinces.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.name}</option>
                    ))}
                  </select>
                </div>

                {/* Kolom Kabupaten/Kota (HANYA tampil jika selectedProvince sudah ada) */}
                {selectedProvince && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {/* Berfungsi untuk dynamic label: "Kabupaten" jika governmentLevel = Kabupaten, atau "Kota" jika = Kota */}
                      {formData.governmentLevel === 'Pemerintahan Kabupaten' ? 'Kabupaten' : 'Kota'}
                    </label>
                    {/* Berfungsi untuk select kabupaten/kota dengan filter berdasarkan type (kabupaten/kota) */}
                    <select
                      value={selectedRegency}
                      onChange={handleRegencyChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">
                        {/* Berfungsi untuk dynamic placeholder sesuai governmentLevel */}
                        Pilih {formData.governmentLevel === 'Pemerintahan Kabupaten' ? 'Kabupaten' : 'Kota'}
                      </option>
                      {/* Berfungsi untuk filter regencies berdasarkan provinceId yang dipilih DAN type (kabupaten/kota) */}
                      {regencies[selectedProvince]
                        ?.filter(item =>
                          formData.governmentLevel === 'Pemerintahan Kabupaten'
                            ? item.type === 'kabupaten' // Berfungsi untuk filter hanya kabupaten jika level = Kabupaten
                            : item.type === 'kota' // Berfungsi untuk filter hanya kota jika level = Kota
                        )
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Row 3: PIC BPSDMP & Nomor Dokumen Balai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom PIC BPSDMP */}
              <div>
                <label className="block text-sm font-medium text-gray-700">PIC BPSDMP Kominf Manado</label>
                {/* Berfungsi untuk input text dengan placeholder, required, dan binding ke formData.picBpsdmp */}
                <input
                  type="text"
                  name="picBpsdmp"
                  value={formData.picBpsdmp}
                  onChange={handleChange}
                  placeholder="Masukkan nama PIC"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {/* Kolom Nomor Dokumen Balai */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Dokumen Balai</label>
                {/* Berfungsi untuk input text nomor dokumen dengan placeholder dan required */}
                <input
                  type="text"
                  name="docNumberBalai"
                  value={formData.docNumberBalai}
                  onChange={handleChange}
                  placeholder="Masukkan nomor dokumen"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Row 4: PIC Pemda & Kontak PIC Pemda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom PIC Pemda */}
              <div>
                <label className="block text-sm font-medium text-gray-700">PIC Pemerintah Daerah</label>
                {/* Berfungsi untuk input text nama PIC Pemda dengan placeholder dan required */}
                <input
                  type="text"
                  name="picPemda"
                  value={formData.picPemda}
                  onChange={handleChange}
                  placeholder="Masukkan nama PIC"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {/* Kolom Kontak PIC Pemda */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Kontak PIC Pemerintah Daerah</label>
                {/* Berfungsi untuk input text kontak/nomor telepon PIC Pemda */}
                <input
                  type="text"
                  name="contactPicPemda"
                  value={formData.contactPicPemda}
                  onChange={handleChange}
                  placeholder="Masukkan nomor"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Row 5: Pemilik */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Pemilik</label>
              {/* Berfungsi untuk input text nama pemilik dokumen dengan placeholder dan required */}
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                placeholder="Masukkan nama pemilik"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Row 6: Tanggal Efektif & Berakhir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Tanggal Mulai */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Efektif Kerja Sama</label>
                {/* Berfungsi untuk input date picker dengan type="date" dan required */}
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {/* Kolom Tanggal Berakhir */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Berakhir Kerja Sama</label>
                {/* Berfungsi untuk input date picker tanggal berakhir dengan required */}
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Row 7: Dokumen Final (File Upload) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Dokumen Final</label>
              {/* Berfungsi untuk input file dengan accept default semua tipe file, onChange handler khusus */}
              <input
                type="file"
                name="finalDoc"
                onChange={handleFileChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {/* Berfungsi untuk conditional render: tampilkan nama file jika user sudah memilih file */}
              {formData.finalDocName && (
                <p className="mt-1 text-sm text-gray-500">File terpilih: {formData.finalDocName}</p>
              )}
            </div>

            {/* Row 8: Catatan (Textarea) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Catatan</label>
              {/* Berfungsi untuk textarea multi-line dengan rows=3 dan placeholder */}
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Masukkan catatan tambahan"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>

            {/* Row 9: Status Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              {/* Berfungsi untuk select status dokumen (tidak required karena sudah ada default value 'Baru') */}
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="Baru">Baru</option>
                <option value="Aktif">Aktif</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            {/* Footer Buttons */}
            {/* Berfungsi untuk container flex dengan justify-end untuk menaruh tombol di kanan, dengan gap dan border atas */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {/* Tombol Batal - type="button" agar tidak trigger form submit */}
              <button
                type="button"
                onClick={onCancel} // Berfungsi untuk memanggil callback onCancel dari parent saat diklik
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </button>
              {/* Tombol Submit - type="submit" agar trigger handleSubmit saat diklik */}
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tambah
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}