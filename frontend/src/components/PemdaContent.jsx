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

// Helper function untuk format tanggal dd-mm-yyyy
const formatDate = (dateString) => {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

export default function PemdaContent() {
  const [mous, setMous] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMou, setEditingMou] = useState(null);
  const [filter, setFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all'); // ✅ TAMBAHAN: Filter Jenis Perjanjian
  const [previewModal, setPreviewModal] = useState({ isOpen: false, content: null, fileName: '' });
  const [loading, setLoading] = useState(true);

  // ✅ STYLE ONLY
  const filterSelectClass =
    "border border-gray-300 rounded-md h-11 px-4 py-2.5 text-sm bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

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

  // ✅ PERBAIKAN: Filter dengan dua kriteria (Status + Jenis Perjanjian)
  const filteredMoUs = Array.isArray(mous)
    ? mous.filter(mou => {
        const statusMatch = filter === 'all' || mou.status === filter;
        const typeMatch = documentTypeFilter === 'all' ||
          mou.documentType === documentTypeFilter;
        return statusMatch && typeMatch;
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
    <div className="space-y-3 pt-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-gray-800 mt-2">Instansi Pemerintah Daerah</h4>
          <p className="text-sm text-gray-500 mb-1">
            Pengelolaan dokumen kerja sama dengan Pemerintah Daerah beserta perangkat daerah
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#00b5a9] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#008a99]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-1 0H6" />
          </svg>
          Tambah Dokumen
        </button>
      </div>

      {/* Content Box */}
      <div className="bg-white rounded-lg border p-6 mt-3">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <img src={FileBlack} className="h-5 w-5" alt="File Icon" />
            <span className="font-medium">Riwayat Dokumen ({filteredMoUs.length})</span>
          </div>

          {/* ✅ TAMBAHKAN FILTER JENIS PERJANJIAN DI SINI */}
          <div className="flex items-center gap-3">
            {/* Filter Jenis Perjanjian */}
            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="all">Semua Jenis Perjanjian</option>
              <option value="MoU">MoU (Memorandum of Understanding)</option>
              <option value="PKS">PKS (Perjanjian Kerja Sama)</option>
            </select>

            {/* Filter Status */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="all">Semua Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-500 mt-4">Memuat data...</p>
          </div>
        ) : filteredMoUs.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <img src={FileIcon} className="h-12 w-12 mx-auto text-gray-300 mb-4" alt="File Icon" />
            <p className="text-gray-500">
              {documentTypeFilter !== 'all' || filter !== 'all'
                ? 'Tidak ada dokumen sesuai filter yang dipilih'
                : 'Belum ada catatan dokumen. Klik "Tambah Dokumen" untuk memulai.'}
            </p>
            {(documentTypeFilter !== 'all' || filter !== 'all') && (
              <button
                onClick={() => {
                  setDocumentTypeFilter('all');
                  setFilter('all');
                }}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-4">
              <thead className="border-b border-gray-300">
                <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-center font-semibold">Jenis <br /> Perjanjian</th>
                  <th className="px-4 py-3 text-center font-semibold">Tingkat <br /> Kerja Sama</th>
                  <th className="px-4 py-3 text-center font-semibold">Jenis <br /> Dokumen</th>
                  <th className="px-4 py-3 text-center font-semibold">PIC BPSDMP</th>
                  <th className="px-4 py-3 text-center font-semibold">PIC <br /> PEMDA</th>
                  <th className="px-4 py-3 text-center font-semibold">Tanggal <br /> Mulai</th>
                  <th className="px-4 py-3 text-center font-semibold">Tanggal <br /> Berakhir</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Catatan</th>
                  <th className="px-6 py-3 text-center font-semibold">Dokumen <br /> Final</th>
                  <th className="px-6 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody className="text-[13px] text-gray-700">
                {filteredMoUs.map((mou) => (
                  <tr key={mou.id} className="hover:bg-gray-100 transition">

                    <td className="px-2 py-4 text-center align-middle">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-md font-medium ${getDocumentTypeColor(
                          mou.documentType || "MoU"
                        )}`}
                      >
                        {mou.documentType || "MoU"}
                      </span>
                    </td>

                    <td className="px-2 py-4 text-center align-middle max-w-[180px] break-words">
                      {mou.institutionalLevel || "-"}
                    </td>

                    <td className="px-4 py-4 text-center align-middle max-w-[160px] break-words">
                      {mou.type || "-"}
                    </td>

                    <td className="px-4 py-4 text-center align-middle">
                      {mou.bpsdmpPIC || "-"}
                    </td>

                    <td className="px-4 py-4 text-center align-middle">
                      {mou.partnerPIC || "-"}
                      {mou.partnerPICPhone && (
                        <div className="text-xs text-gray-500 mt-1">
                          {mou.partnerPICPhone}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                      {formatDate(mou.cooperationStartDate)}
                    </td>

                    <td className="px-4 py-4 text-center align-middle whitespace-nowrap">
                      {formatDate(mou.cooperationEndDate)}
                    </td>

                    <td className="px-4 py-4 text-center align-middle">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-md ${getStatusColor(
                          mou.status
                        )}`}
                      >
                        {mou.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center align-middle max-w-[180px] break-words">
                      {mou.notes || "-"}
                    </td>

                    <td className="px-6 py-4 text-center align-middle min-w-[90px]">
                      <div className="flex items-center justify-center h-full min-h-[40px]">
                        {mou.finalDocumentUrl ? (
                          <button
                            onClick={() =>
                              handlePreview(
                                mou.finalDocumentUrl,
                                mou.finalDocumentName || "document.pdf"
                              )
                            }
                            className="flex items-center justify-center"
                          >
                            <img
                              src={FinalDocIcon}
                              className="h-4 w-4"
                              alt="Final Doc"
                            />
                          </button>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center align-middle min-w-[100px]">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => {
                            setEditingMou(mou);
                            setShowForm(true);
                          }}
                          className="hover:opacity-70 transition"
                        >
                          <img src={EditIcon} className="h-4 w-4" alt="Edit" />
                        </button>

                        <button
                          onClick={() => handleDelete(mou.id)}
                          className="hover:opacity-70 transition"
                        >
                          <img src={DeleteIcon} className="h-4 w-4" alt="Delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

  // ✅ STYLE ONLY
  const inputClass =
    "mt-1 block w-full h-11 px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "placeholder:text-gray-400 placeholder:font-normal " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const selectClass =
    "mt-1 block w-full h-11 px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const textareaClass =
    "mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "placeholder:text-gray-400 placeholder:font-normal " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const fileClass =
    "mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const fileButtonClass =
    "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold " +
    "file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">
            {initialData ? 'Edit Dokumen' : 'Tambah Dokumen Pemerintah Daerah'}
          </h3>
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
                className={selectClass}
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
                  className={selectClass}
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
                  className={selectClass}
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
                    className={inputClass}
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
                    className={selectClass}
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
                      className={selectClass}
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
                className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
                className={inputClass}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={selectClass}
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
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Berakhir Kerja Sama</label>
                <input
                  type="date"
                  name="cooperationEndDate"
                  value={formData.cooperationEndDate}
                  onChange={handleChange}
                  className={inputClass}
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
                className={textareaClass}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#00b5a9] text-white hover:bg-[#008a99]"
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