// src/components/MoUForm.jsx
import { useState, useEffect } from 'react';
import { provinces, regencies } from '../utils/regions';

export default function MoUForm({ initialData = null, onSubmit, onCancel, type }) {
  const [formData, setFormData] = useState({
    title: '',
    governmentLevel: '',
    typeMoU: '',
    picBpsdmp: '',
    docNumberBalai: '',
    docNumber: '',
    picPemda: '',
    contactPicPemda: '',
    owner: '',
    startDate: '',
    endDate: '',
    finalDoc: null,
    finalDocName: '', // ✅ simpan nama file saja
    notes: '',
    status: 'Baru',
    provinceId: '',
    regencyId: '',
  });

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');

  useEffect(() => {
    if (initialData) {
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
        finalDoc: null,
        finalDocName: initialData.finalDocName || '',
        notes: initialData.notes || '',
        status: initialData.status || 'Baru',
        provinceId: initialData.provinceId || '',
        regencyId: initialData.regencyId || '',
      });
      setSelectedProvince(initialData.provinceId || '');
      setSelectedRegency(initialData.regencyId || '');
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        finalDoc: null,
        finalDocName: file.name
      }));
    }
  };

  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setSelectedRegency('');
    setFormData(prev => ({
      ...prev,
      provinceId,
      regencyId: ''
    }));
  };

  const handleRegencyChange = (e) => {
    const regencyId = e.target.value;
    setSelectedRegency(regencyId);
    setFormData(prev => ({ ...prev, regencyId }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ❌ Hapus finalDoc, ✅ pertahankan finalDocName
    const { finalDoc, ...rest } = formData;

    // ✅ Hanya kirim field yang ada di form — jangan tambahkan provinceName/regencyName/type
    const dataToSubmit = {
      ...rest,
      // Jika backend butuh category, tambahkan:
      // category: type === 'pemda' ? 'pemda' : 'non_pemda'
    };

    console.log('🚀 Data dikirim ke backend:', dataToSubmit); // 👈 Debug

    onSubmit(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {initialData ? 'Edit MoU' : 'Tambah MoU Baru'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold text-lg">
                Tambah MoU {type === 'pemda' ? 'Pemerintah Daerah' : 'Non-Pemerintah Daerah'}
              </h3>
            </div>

            {/* Row 1: Jenis MoU & Tingkat Pemerintahan Daerah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jenis MoU</label>
                <select
                  name="typeMoU"
                  value={formData.typeMoU}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Pilih jenis MoU</option>
                  <option value="Kerjasama Teknis">Kerjasama Teknis</option>
                  <option value="Penelitian">Penelitian</option>
                  <option value="Pelatihan">Pelatihan</option>
                  <option value="Pengembangan SDM">Pengembangan SDM</option>
                </select>
              </div>
              {type === 'pemda' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tingkat Pemerintahan Daerah</label>
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

            {/* Row 2: Provinsi & Kabupaten/Kota */}
            {type === 'pemda' && formData.governmentLevel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provinsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provinsi</label>
                  <select
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.name}</option>
                    ))}
                  </select>
                </div>

                {/* Kabupaten/Kota */}
                {selectedProvince && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {formData.governmentLevel === 'Pemerintahan Kabupaten' ? 'Kabupaten' : 'Kota'}
                    </label>
                    <select
                      value={selectedRegency}
                      onChange={handleRegencyChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">
                        Pilih {formData.governmentLevel === 'Pemerintahan Kabupaten' ? 'Kabupaten' : 'Kota'}
                      </option>
                      {regencies[selectedProvince]
                        ?.filter(item =>
                          formData.governmentLevel === 'Pemerintahan Kabupaten'
                            ? item.type === 'kabupaten'
                            : item.type === 'kota'
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
              <div>
                <label className="block text-sm font-medium text-gray-700">PIC BPSDMP Kominf Manado</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Dokumen Balai</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">PIC Pemerintah Daerah</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Kontak PIC Pemerintah Daerah</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Efektif Kerja Sama</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Berakhir Kerja Sama</label>
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

            {/* Row 7: Dokumen Final */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Dokumen Final</label>
              <input
                type="file"
                name="finalDoc"
                onChange={handleFileChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {formData.finalDocName && (
                <p className="mt-1 text-sm text-gray-500">File terpilih: {formData.finalDocName}</p>
              )}
            </div>

            {/* Row 8: Catatan */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Catatan</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Masukkan catatan tambahan"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              ></textarea>
            </div>

            {/* Row 9: Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
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
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </button>
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