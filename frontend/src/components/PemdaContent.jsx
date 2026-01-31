import { useState, useEffect } from 'react';
import { provinces, regencies } from '../utils/regions';
import FileIcon from "../assets/fileicon.svg";
import FileBlack from "../assets/fileiconblack.svg";
import EditIcon from "../assets/editicon.svg";
import DeleteIcon from "../assets/deleteicon.svg";
import FinalDocIcon from "../assets/finaldocicon.svg";

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.message || text || `Request gagal (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// dataURL(base64) -> Blob (untuk preview data lama)
function dataURLtoBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/(.*?);base64/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export default function PemdaContent() {
  const [mous, setMous] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMou, setEditingMou] = useState(null);
  const [filter, setFilter] = useState('all');
  const [previewModal, setPreviewModal] = useState({ isOpen: false, content: null, fileName: '' });
  const [loading, setLoading] = useState(true);

  // ✅ PERBAIKAN: Function untuk fetch data dari database
  const fetchMouData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/dashboard?t=${Date.now()}`);
      
      // Filter hanya dokumen kategori pemda
      const mousData = Array.isArray(data?.documents) 
        ? data.documents.filter(doc => doc.category === 'pemda')
        : [];
      
      setMous(mousData);
      console.log("✅ MoU data loaded:", mousData.length, "items");
    } catch (e) {
      console.error("❌ Error loading MoU data:", e);
      alert(`Gagal load data dari database: ${e.message}`);
      setMous([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data dari DATABASE saat pertama kali
  useEffect(() => {
    fetchMouData();
  }, []);

  const handleSave = async (data) => {
    try {
      const {
        finalDocumentFile,
        finalDocumentName,
        finalDocumentUrl,
        ...payloadObj
      } = data;

      const fd = new FormData();
      fd.append("category", "pemda");
      
      // ✅ PERBAIKAN: Pastikan documentType masuk ke payload
      const payloadToSend = {
        ...payloadObj,
        documentType: payloadObj.documentType || 'MoU', // Default ke MoU jika kosong
        finalDocumentName: finalDocumentName || "",
        finalDocumentUrl: finalDocumentUrl || "",
      };
      
      console.log("📤 Sending payload:", payloadToSend);
      fd.append("payload", JSON.stringify(payloadToSend));

      // Jika user pilih file baru, kirim file
      if (finalDocumentFile) {
        fd.append("file", finalDocumentFile);
      }

      if (editingMou) {
        // UPDATE
        const updated = await apiFetch(`/mous/${editingMou.id}`, {
          method: "PUT",
          body: fd,
        });

        console.log("✅ Update berhasil:", updated);
        
        // ✅ PERBAIKAN: Refresh data dari database setelah update
        await fetchMouData();
        setEditingMou(null);
      } else {
        // CREATE
        const created = await apiFetch(`/mous`, {
          method: "POST",
          body: fd,
        });

        console.log("✅ Create berhasil:", created);
        
        // ✅ PERBAIKAN: Refresh data dari database setelah create
        await fetchMouData();
      }

      setShowForm(false);
      alert("✅ Dokumen berhasil disimpan!");
    } catch (e) {
      console.error("❌ Error saving:", e);
      alert(`Gagal simpan ke database: ${e.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus dokumen ini?')) return;

    try {
      await apiFetch(`/mous/${id}`, { method: "DELETE" });
      
      // ✅ PERBAIKAN: Refresh data dari database setelah delete
      await fetchMouData();
      alert("✅ Dokumen berhasil dihapus!");
    } catch (e) {
      console.error("❌ Error deleting:", e);
      alert(`Gagal hapus dari database: ${e.message}`);
    }
  };

  // ✅ Validasi mous selalu array sebelum filter
  const filteredMoUs = Array.isArray(mous) 
    ? mous.filter(mou => {
        if (filter === 'all') return true;
        return mou.status === filter;
      })
    : [];

  const statusOptions = [
    "Baru",
    "Dalam Proses",
    "Review PEMDA 1",
    "Review BPSDMP Kominfo",
    "Review BPSDMP 1",
    "Review PEMDA 2",
    "Review BPSDMP 2",
    "Persiapan TTD Para Pihak",
    "Selesai"
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Baru":
        return "bg-blue-100 text-blue-800";
      case "Dalam Proses":
        return "bg-yellow-100 text-yellow-800";
      case "Review PEMDA 1":
      case "Review PEMDA 2":
        return "bg-purple-100 text-purple-800";
      case "Review BPSDMP Kominfo":
      case "Review BPSDMP 1":
      case "Review BPSDMP 2":
        return "bg-orange-100 text-orange-800";
      case "Persiapan TTD Para Pihak":
        return "bg-indigo-100 text-indigo-800";
      case "Selesai":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDocumentTypeColor = (type) => {
    return type === 'MoU' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  // Preview dokumen support URL /uploads + base64 lama
  const handlePreview = (fileContent, fileName) => {
    if (!fileContent) {
      alert("File tidak tersedia.");
      return;
    }

    const fileType = (fileName || "").split('.').pop().toLowerCase();

    // 1) Kalau dari backend => URL /uploads/...
    if (typeof fileContent === "string" && (fileContent.startsWith("/uploads/") || fileContent.startsWith("http"))) {
      if (fileType === "pdf") {
        setPreviewModal({
          isOpen: true,
          content: (
            <iframe
              src={fileContent}
              className="w-full h-[60vh] border-none"
              title="Preview PDF"
            />
          ),
          fileName
        });
      } else {
        // doc/docx biasanya akan download / open handler OS
        window.open(fileContent, "_blank");
      }
      return;
    }

    // 2) data lama: base64 (data:)
    if (fileType === 'pdf') {
      let blob;
      if (typeof fileContent === "string" && fileContent.startsWith("data:")) {
        blob = dataURLtoBlob(fileContent);
      } else {
        blob = new Blob([fileContent], { type: 'application/pdf' });
      }

      const url = URL.createObjectURL(blob);
      setPreviewModal({
        isOpen: true,
        content: (
          <iframe
            src={url}
            className="w-full h-[60vh] border-none"
            title="Preview PDF"
          />
        ),
        fileName
      });
    } else if (fileType === 'docx') {
      let blob;
      if (typeof fileContent === "string" && fileContent.startsWith("data:")) {
        blob = dataURLtoBlob(fileContent);
      } else {
        blob = new Blob([fileContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }

      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setPreviewModal({ isOpen: false, content: null, fileName: '' });
    } else {
      let content = "";
      if (typeof fileContent === 'string') {
        content = fileContent;
      } else if (fileContent instanceof ArrayBuffer) {
        content = new TextDecoder().decode(fileContent);
      }

      setPreviewModal({
        isOpen: true,
        content: (
          <pre className="p-4 bg-gray-50 rounded-md max-h-[60vh] overflow-y-auto">
            {content}
          </pre>
        ),
        fileName
      });
    }
  };

  const closePreview = () => {
    setPreviewModal({ isOpen: false, content: null, fileName: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Instansi Pemerintah Daerah</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pengelolaan dokumen kerja sama dengan Pemerintah Daerah beserta perangkat daerah.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Dokumen
        </button>
      </div>

      {/* Content Box */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <img src={FileBlack} className="h-5 w-5" alt="File Icon" />
            <span className="font-medium">Riwayat Dokumen ({filteredMoUs.length})</span>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Semua Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-500 mt-4">Memuat data...</p>
          </div>
        ) : (
          // Tabel atau Kosong
          filteredMoUs.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <img src={FileIcon} className="h-12 w-12 mx-auto text-gray-300 mb-4" alt="File Icon" />
              <p className="text-gray-500">Belum ada catatan dokumen. Klik "Tambah Dokumen" untuk memulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Perjanjian</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat <br /> Kerja Sama</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis <br /> Dokumen</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PIC BPSDMP</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PIC <br /> PEMDA</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal <br /> Mulai</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal <br /> Berakhir</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dokumen <br /> Final</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 whitespace-normal">
                  {filteredMoUs.map(mou => (
                    <tr key={mou.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-center break-words max-w-[120px]">
                        <span className={`inline-block px-2 py-1 text-xs rounded-md font-medium ${getDocumentTypeColor(mou.documentType || 'MoU')}`}>
                          {mou.documentType || 'MoU'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center break-words max-w-[150px]">
                        {mou.institutionalLevel || '-'}
                      </td>
                      <td className="px-4 py-2 text-center break-words max-w-[150px]">
                        {mou.type || '-'}
                      </td>
                      <td className="px-4 py-2 text-center break-words max-w-[120px]">
                        {mou.bpsdmpPIC || '-'}
                      </td>
                      <td className="px-4 py-2 text-center break-words max-w-[120px]">
                        {mou.partnerPIC || '-'}
                        {mou.partnerPICPhone && (
                          <div className="text-xs text-gray-500">{mou.partnerPICPhone}</div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center whitespace-nowrap min-w-[120px]">
                        {mou.cooperationStartDate || '-'}
                      </td>
                      <td className="px-4 py-2 text-center whitespace-nowrap min-w-[120px]">
                        {mou.cooperationEndDate || '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-md ${getStatusColor(mou.status)} max-w-[150px] break-words`}
                          title={mou.status}
                        >
                          {mou.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center break-words max-w-[150px]">
                        {mou.notes || '-'}
                      </td>

                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        {mou.finalDocumentUrl ? (
                          <button
                            onClick={() => handlePreview(mou.finalDocumentUrl, mou.finalDocumentName || "document.pdf")}
                            title="Lihat dokumen"
                          >
                            <img src={FinalDocIcon} className="h-4 w-4" alt="Final Doc Icon" />
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => {
                              setEditingMou(mou);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <img src={EditIcon} className="h-5 w-5" alt="Edit Icon" />
                          </button>
                          <button
                            onClick={() => handleDelete(mou.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <img src={DeleteIcon} className="h-5 w-5" alt="Delete Icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <PemdaFormModal
          initialData={editingMou}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingMou(null);
          }}
        />
      )}

      {/* Modal Preview Dokumen */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Preview: {previewModal.fileName}</h3>
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {previewModal.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-komponen Form
function PemdaFormModal({ initialData, onSubmit, onCancel }) {
  const knownTypes = [
    "Nota Kesepahaman",
    "Perjanjian Kerjasama",
    "Surat Pernyataan",
    "Nota Kesepakatan"
  ];

  const [formData, setFormData] = useState({
    documentType: 'MoU', // ✅ PERBAIKAN: Default ke 'MoU'
    level: '',
    institutionalLevel: '',
    type: '',
    customType: '',
    bpsdmpPIC: '',
    officeDocNumber: '',
    partnerDocNumber: '',
    partnerPIC: '',
    partnerPICPhone: '',
    owner: '',
    notes: '',
    cooperationStartDate: '',
    cooperationEndDate: '',
    status: 'Baru',
    finalDocumentFile: null,
    finalDocumentName: '',
    finalDocumentUrl: '',
    provinceId: '',
    regencyId: ''
  });

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');

  useEffect(() => {
    if (initialData) {
      const initialType = initialData.type || '';
      const isCustom = initialType && !knownTypes.includes(initialType);

      setFormData({
        documentType: initialData.documentType || 'MoU', // ✅ PERBAIKAN: Default 'MoU'
        level: initialData.level || '',
        institutionalLevel: initialData.institutionalLevel || '',
        type: isCustom ? 'Lainnya' : initialType,
        customType: isCustom ? initialType : '',
        bpsdmpPIC: initialData.bpsdmpPIC || '',
        officeDocNumber: initialData.officeDocNumber || '',
        partnerDocNumber: initialData.partnerDocNumber || '',
        partnerPIC: initialData.partnerPIC || '',
        partnerPICPhone: initialData.partnerPICPhone || '',
        owner: initialData.owner || '',
        notes: initialData.notes || '',
        cooperationStartDate: initialData.cooperationStartDate || '',
        cooperationEndDate: initialData.cooperationEndDate || '',
        status: initialData.status || 'Baru',
        finalDocumentFile: null,
        finalDocumentName: initialData.finalDocumentName || '',
        finalDocumentUrl: initialData.finalDocumentUrl || '',
        provinceId: initialData.provinceId || '',
        regencyId: initialData.regencyId || ''
      });

      setSelectedProvince(initialData.provinceId || '');
      setSelectedRegency(initialData.regencyId || '');
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type' && value !== 'Lainnya') {
      setFormData(prev => ({ ...prev, type: value, customType: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLevelChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, level: val, provinceId: '', regencyId: '', institutionalLevel: '' }));
    setSelectedProvince('');
    setSelectedRegency('');
  };

  const handleProvinceChange = (e) => {
    const val = e.target.value;
    setSelectedProvince(val);
    setSelectedRegency('');

    const provinceName = provinces.find(p => p.id === val)?.name || '';
    const instLevel = formData.level === 'Provinsi' ? `Pemerintah Provinsi ${provinceName}` : '';

    setFormData(prev => ({
      ...prev,
      provinceId: val,
      regencyId: '',
      institutionalLevel: instLevel
    }));
  };

const handleRegencyChange = (e) => {
  const val = e.target.value;
  setSelectedRegency(val);

  const regencyName = regencies[selectedProvince]?.find(r => r.id === val)?.name || '';
  
  // ✅ SESUDAH: Hanya tampilkan "Pemerintah Kabupaten [nama]" atau "Pemerintah Kota [nama]"
  let processedRegencyName = regencyName;
  if (processedRegencyName.startsWith('Kab. ')) {
    processedRegencyName = 'Kabupaten ' + processedRegencyName.substring(5);
  } else if (processedRegencyName.startsWith('Kota ')) {
    processedRegencyName = 'Kota ' + processedRegencyName.substring(5);
  }
  const instLevel = `Pemerintah ${processedRegencyName}`;

  setFormData(prev => ({
    ...prev,
    regencyId: val,
    institutionalLevel: instLevel
  }));
};

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData(prev => ({
      ...prev,
      finalDocumentFile: file,
      finalDocumentName: file.name,
      finalDocumentUrl: '' // kalau pilih baru, url lama diganti
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ PERBAIKAN: Validasi documentType tidak boleh kosong
    if (!formData.documentType) {
      alert("Jenis Dokumen wajib dipilih!");
      return;
    }

    const finalType =
      formData.type === 'Lainnya'
        ? (formData.customType || '').trim()
        : formData.type;

    const { customType, ...rest } = formData;

    console.log("📤 Form submit data:", { ...rest, type: finalType });

    onSubmit({
      ...rest,
      type: finalType
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {initialData ? 'Edit Dokumen' : 'Tambah Dokumen Pemerintah Daerah'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✅ DROPDOWN JENIS DOKUMEN - WAJIB */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jenis Perjanjian <span className="text-red-500">*</span>
              </label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih jenis perjanjian</option>
                <option value="MoU">MoU (Memorandum of Understanding)</option>
                <option value="PKS">PKS (Perjanjian Kerja Sama)</option>
              </select>
            </div>

            {/* Tingkat MoU & Jenis MoU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tingkat Kerja Sama</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleLevelChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Pilih tingkat</option>
                  <option value="Provinsi">Pemerintah Provinsi</option>
                  <option value="Kabupaten/Kota">Pemerintah Kabupaten/Kota</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Jenis Dokumen</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Pilih jenis dokumen</option>
                  {knownTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="Lainnya">Lainnya...</option>
                </select>

                {formData.type === 'Lainnya' && (
                  <input
                    type="text"
                    name="customType"
                    value={formData.customType}
                    onChange={handleChange}
                    placeholder="Masukkan jenis MoU lainnya"
                    className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
            </div>

            {/* Provinsi & Kabupaten/Kota - DINAMIS */}
            {formData.level && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provinsi</label>
                  <select
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                {formData.level === 'Kabupaten/Kota' && selectedProvince && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kabupaten/Kota</label>
                    <select
                      value={selectedRegency}
                      onChange={handleRegencyChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Pilih Kabupaten/Kota</option>
                      {regencies[selectedProvince]?.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* PIC BPSDMP */}
            <div>
              <label className="block text-sm font-medium text-gray-700">PIC BPSDMP Kominfo Manado</label>
              <input
                type="text"
                name="bpsdmpPIC"
                value={formData.bpsdmpPIC}
                onChange={handleChange}
                placeholder="Masukkan nama PIC"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Nomor Dokumen Balai & Pemda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Dokumen Balai</label>
                <input
                  type="text"
                  name="officeDocNumber"
                  value={formData.officeDocNumber}
                  onChange={handleChange}
                  placeholder="Masukkan nomor dokumen"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Dokumen Pemerintah Daerah</label>
                <input
                  type="text"
                  name="partnerDocNumber"
                  value={formData.partnerDocNumber}
                  onChange={handleChange}
                  placeholder="Masukkan nomor dokumen"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* PIC Pemda & Kontak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">PIC Pemerintah Daerah</label>
                <input
                  type="text"
                  name="partnerPIC"
                  value={formData.partnerPIC}
                  onChange={handleChange}
                  placeholder="Masukkan nama PIC"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kontak PIC Pemerintah Daerah</label>
                <input
                  type="text"
                  name="partnerPICPhone"
                  value={formData.partnerPICPhone}
                  onChange={handleChange}
                  placeholder="Masukkan email atau nomor telepon"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Pemilik */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Pemilik</label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                placeholder="Masukkan nama pemilik"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Baru">Baru</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Review PEMDA 1">Review PEMDA 1</option>
                <option value="Review BPSDMP Kominfo">Review BPSDMP Kominfo</option>
                <option value="Review BPSDMP 1">Review BPSDMP 1</option>
                <option value="Review PEMDA 2">Review PEMDA 2</option>
                <option value="Review BPSDMP 2">Review BPSDMP 2</option>
                <option value="Persiapan TTD Para Pihak">Persiapan TTD Para Pihak</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            {/* Tanggal Mulai & Berakhir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Mulai Kerja Sama</label>
                <input
                  type="date"
                  name="cooperationStartDate"
                  value={formData.cooperationStartDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Berakhir Kerja Sama</label>
                <input
                  type="date"
                  name="cooperationEndDate"
                  value={formData.cooperationEndDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Upload Dokumen Final */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Dokumen Final (Upload)</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="mt-1 block w-full text-sm text-gray-700
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0
                           file:text-sm file:font-semibold
                           file:bg-gray-100 file:text-gray-700
                           hover:file:bg-gray-200"
              />
              {(formData.finalDocumentFile || formData.finalDocumentUrl) && (
                <p className="text-xs text-gray-500 mt-1">
                  File: <span className="font-medium">{formData.finalDocumentName || "Dokumen tersimpan"}</span>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Format file yang diizinkan : PDF dan Word (.doc/.docx)<br />
                Maksimal ukuran file : 10 MB
              </p>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Catatan</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Tulis catatan tambahan (opsional)"
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
              >
                {initialData ? "Simpan Perubahan" : "Simpan Dokumen"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}