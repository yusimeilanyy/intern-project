// Berfungsi untuk mengimpor React dan hook useState, useEffect untuk manajemen state dan side effect pada component
import React, { useState, useEffect } from 'react';
// Berfungsi untuk mengimpor asset icon delete dari folder assets untuk tombol aksi hapus user
import DeleteIcon from "../assets/deleteicon.svg";

// Berfungsi untuk mendefinisikan komponen functional UserManagement yang menerima prop isAdmin untuk kontrol akses
export default function UserManagement({ isAdmin }) {
  // ========================================
  // STATE MANAGEMENT - MENYIMPAN DATA DINAMIS
  // ========================================
  
  // Berfungsi untuk menyimpan array data user yang diambil dari API backend
  const [users, setUsers] = useState([]);
  
  // Berfungsi untuk menandai apakah data sedang dalam proses loading (true = loading, false = selesai)
  const [loading, setLoading] = useState(true);
  
  // Berfungsi untuk menyimpan pesan error jika terjadi kegagalan saat fetch atau operasi API
  const [error, setError] = useState(null);
  
  // Berfungsi untuk mengontrol tampilan modal form tambah user (true = modal terbuka, false = tertutup)
  const [showForm, setShowForm] = useState(false);
  
  // Berfungsi untuk menyimpan objek formData dengan nilai default untuk setiap field input form
  const [formData, setFormData] = useState({
    username: '', // Berfungsi untuk menyimpan nilai input username user baru
    email: '', // Berfungsi untuk menyimpan nilai input email user baru
    password: '', // Berfungsi untuk menyimpan nilai input password user baru
    full_name: '', // Berfungsi untuk menyimpan nilai input nama lengkap user baru
    role: 'user' // Berfungsi untuk menyimpan nilai select role user (default: 'user')
  });

  // ✅ FUNGSI UNTUK RESET FORM
  // Berfungsi untuk mengreset semua field formData ke nilai default kosong, digunakan saat batal atau setelah submit sukses
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'user'
    });
  };

  // ========================================
  // EFFECT: CEK AKSES & LOAD DATA SAAT MOUNT
  // ========================================
  // Berfungsi untuk menjalankan side effect: cek hak akses admin dan load data user saat component pertama kali dirender
  useEffect(() => {
    // Berfungsi untuk validasi: jika user bukan admin, set error dan hentikan proses loading
    if (!isAdmin) {
      setError("Akses ditolak. Hanya admin yang dapat mengakses halaman ini.");
      setLoading(false);
      return; // Berfungsi untuk return early agar tidak execute loadUsers
    }
    // Berfungsi untuk call fungsi loadUsers jika user adalah admin
    loadUsers();
  }, [isAdmin]); // Berfungsi untuk dependency array: effect akan re-run jika nilai isAdmin berubah

  // ========================================
  // FUNGSI: LOAD DATA USER DARI API
  // ========================================
  // Berfungsi untuk async function yang mengambil daftar user dari endpoint API backend
  const loadUsers = async () => {
    try {
      setError(null); // Berfungsi untuk reset state error sebelum fetch baru
      setLoading(true); // Berfungsi untuk set loading true agar tampilkan spinner UI

      // Berfungsi untuk mengambil token autentikasi dari localStorage untuk authorization API
      const token = localStorage.getItem("token");
      // Berfungsi untuk validasi: jika token tidak ada, lempar error untuk redirect login
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      // Berfungsi untuk melakukan HTTP GET request ke endpoint /api/users dengan header authorization
      const res = await fetch("/api/users", {
        headers: {
          "Authorization": `Bearer ${token}`, // Berfungsi untuk mengirim token Bearer agar request terautentikasi
          "Content-Type": "application/json" // Berfungsi untuk specify content type JSON
        }
      });

      // Berfungsi untuk handle error response dari server berdasarkan status code
      if (!res.ok) {
        if (res.status === 404) {
          // Berfungsi untuk error khusus jika endpoint tidak ditemukan (backend belum ready)
          throw new Error("Endpoint /api/users tidak ditemukan. Pastikan backend sudah dikonfigurasi.");
        }
        // Berfungsi untuk error umum dengan menyertakan status code dan status text
        throw new Error(`Gagal memuat data: ${res.status} ${res.statusText}`);
      }

      // Berfungsi untuk parse response JSON dari server menjadi object JavaScript
      const data = await res.json();

      // Berfungsi untuk validasi: pastikan response memiliki field users yang berupa array
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users); // Berfungsi untuk update state users dengan data yang diterima
      } else {
        // Berfungsi untuk lempar error jika format response tidak sesuai ekspektasi
        throw new Error("Format data tidak valid");
      }
    } catch (err) {
      // Berfungsi untuk handle exception/error: log ke console dan set state error untuk ditampilkan di UI
      console.error("Load users error:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data user");
    } finally {
      // Berfungsi untuk set loading false di finally block agar selalu dijalankan (sukses/gagal)
      setLoading(false);
    }
  };

  // ========================================
  // FUNGSI: HANDLE SUBMIT FORM REGISTER USER
  // ========================================
  // Berfungsi untuk async handler yang memproses submit form: validasi, call API register, dan refresh data
  const handleSubmit = async (e) => {
    e.preventDefault(); // Berfungsi untuk mencegah default behavior browser (reload halaman) saat form disubmit

    try {
      setError(null); // Berfungsi untuk reset state error sebelum request baru
      // Berfungsi untuk ambil token auth dari localStorage untuk authorization
      const token = localStorage.getItem("token");
      
      // Berfungsi untuk melakukan HTTP POST request ke endpoint register dengan payload formData
      const res = await fetch("/api/users/register", {
        method: "POST", // Berfungsi untuk specify HTTP method POST untuk create resource baru
        headers: {
          "Content-Type": "application/json", // Berfungsi untuk specify content type JSON
          "Authorization": `Bearer ${token}` // Berfungsi untuk authorization header
        },
        body: JSON.stringify(formData) // Berfungsi untuk stringify object formData menjadi JSON string untuk request body
      });

      // Berfungsi untuk handle error response dari API register
      if (!res.ok) {
        const error = await res.json(); // Berfungsi untuk parse error message dari response
        throw new Error(error.message || "Gagal membuat user"); // Berfungsi untuk lempar error dengan pesan dari server atau default
      }

      // Berfungsi untuk parse response success JSON (opsional, jika backend return data user baru)
      const result = await res.json();

      // Berfungsi untuk tampilkan alert sukses ke user
      alert("User berhasil dibuat!");
      setShowForm(false); // Berfungsi untuk tutup modal form setelah sukses
      resetForm(); // ✅ RESET FORM SETELAH SUKSES - Berfungsi untuk clear semua field input ke nilai default
      loadUsers(); // Berfungsi untuk refresh daftar user dari API agar UI terupdate dengan user baru
    } catch (err) {
      // Berfungsi untuk handle exception/error: log ke console dan set state error untuk ditampilkan
      console.error("Register user error:", err);
      setError(err.message || "Terjadi kesalahan saat membuat user");
    }
  };

  // ========================================
  // FUNGSI: HANDLE DELETE USER
  // ========================================
  // Berfungsi untuk async handler yang menghapus user berdasarkan ID setelah konfirmasi dari user
  const handleDelete = async (id, username) => {
    // Berfungsi untuk konfirmasi ke user sebelum aksi permanen, return jika user batal/klik cancel
    if (!window.confirm(`Yakin ingin menghapus user "${username}"?`)) return;

    try {
      setError(null); // Berfungsi untuk reset state error sebelum request delete
      // Berfungsi untuk ambil token auth dari localStorage
      const token = localStorage.getItem("token");
      
      // Berfungsi untuk melakukan HTTP DELETE request ke endpoint user dengan ID yang dipilih
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE", // Berfungsi untuk specify HTTP method DELETE untuk hapus resource
        headers: { "Authorization": `Bearer ${token}` } // Berfungsi untuk authorization header
      });

      // Berfungsi untuk handle error response dari API delete
      if (!res.ok) {
        throw new Error("Gagal menghapus user"); // Berfungsi untuk lempar error jika response tidak OK
      }

      // Berfungsi untuk tampilkan alert sukses ke user
      alert("User berhasil dihapus");
      loadUsers(); // Berfungsi untuk refresh daftar user dari API agar user yang dihapus hilang dari list
    } catch (err) {
      // Berfungsi untuk handle exception/error: log ke console dan set state error untuk ditampilkan
      console.error("Delete user error:", err);
      setError(err.message || "Terjadi kesalahan saat menghapus user");
    }
  };

  // ====== HANYA TAMPILAN (STYLE) ======
  // Berfungsi untuk konstanta class Tailwind reusable untuk styling input text dengan konsistensi visual
  const inputClass =
    "w-full h-11 px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "placeholder:text-gray-400 placeholder:font-normal " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  
  // Berfungsi untuk konstanta class Tailwind reusable untuk styling select dropdown dengan konsistensi visual
  const selectClass =
    "w-full h-11 px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  // ===================================

  // ========================================
  // RENDER: ERROR BOUNDARY STATE
  // ========================================
  // Berfungsi untuk conditional render: tampilkan UI error jika state error tidak null
  if (error) {
    return (
      // Berfungsi untuk container full screen dengan background gray dan centering content
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {/* Berfungsi untuk card error dengan styling shadow, rounded, dan padding */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          {/* Berfungsi untuk icon warning besar dengan warna merah */}
          <div className="text-red-500 text-5xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          {/* Berfungsi untuk judul error dengan font bold */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          {/* Berfungsi untuk menampilkan pesan error yang disimpan di state */}
          <p className="text-gray-600 mb-6">{error}</p>
          {/* Berfungsi untuk tombol retry yang memanggil loadUsers saat diklik */}
          <button
            onClick={loadUsers}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER: LOADING STATE
  // ========================================
  // Berfungsi untuk conditional render: tampilkan UI loading spinner jika state loading = true
  if (loading) {
    return (
      // Berfungsi untuk container full screen dengan background gray dan centering content
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {/* Berfungsi untuk container centering spinner dan text */}
        <div className="text-center">
          {/* Berfungsi untuk spinner animasi dengan border biru yang berputar */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          {/* Berfungsi untuk text loading yang informatif */}
          <p className="text-gray-600 mt-4">Memuat data user...</p>
        </div>
      </div>
    );
  }

  // ✅ HEADER DIPINDAH KE LUAR KONDISI - HANYA 1 KALI!
  // Berfungsi untuk render main UI setelah loading selesai dan tidak ada error
  return (
    // Berfungsi untuk container utama dengan spacing vertikal dan padding top
    <div className="space-y-6 pt-6">
      {/* Header - TAMPIL DI SEMUA KONDISI (setelah loading selesai) */}
      <div className="flex justify-between items-start">
        {/* Kolom kiri: Judul halaman dan deskripsi */}
        <div>
          <h3 className="text-2xl font-bold text-[#006db0] mb-2">Manajemen Pengguna</h3>
          <p className="text-gray-500 text-sm mb-6">Kelola akun pengguna sistem SIKERMA</p>
        </div>
        {/* Kolom kanan: Tombol Tambah User */}
        <button
          onClick={() => {
            resetForm(); // ✅ RESET FORM SEBELUM BUKA MODAL - Berfungsi untuk clear field form sebelum buka modal baru
            setShowForm(true); // Berfungsi untuk buka modal form tambah user
          }}
          className="bg-[#00b5a9] text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-[#008a99]"
        >
          {/* Icon plus SVG untuk visual indicator tombol tambah */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah User
        </button>
      </div>

      {/* ========================================
          CONDITIONAL RENDER: EMPTY STATE vs NORMAL STATE
          ======================================== */}
      {users.length === 0 ? (
        // Berfungsi untuk conditional: tampilkan empty state card jika array users kosong
        <div className="bg-white rounded-lg border p-12 text-center">
          {/* Icon users besar dengan warna gray untuk visual empty state */}
          <div className="text-gray-300 text-6xl mb-4">
            <i className="fas fa-users"></i>
          </div>
          {/* Judul empty state */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Pengguna</h2>
          {/* Deskripsi empty state yang mengajak user untuk tambah data pertama */}
          <p className="text-gray-500 mb-6">
            Database belum memiliki data pengguna. Tambahkan pengguna pertama Anda!
          </p>
        </div>
      ) : (
        // Berfungsi untuk conditional: tampilkan tabel data user jika array users tidak kosong
        // Normal State - Tampilkan tabel
        <div className="bg-white rounded-lg border p-6">
          {/* Tabel User */}
          {/* Berfungsi untuk wrapper tabel dengan scroll horizontal jika overflow di layar kecil */}
          <div className="overflow-x-auto">
            {/* Berfungsi untuk elemen table dengan styling border-separate untuk spacing antar row */}
            <table className="min-w-full text-sm border-separate border-spacing-y-4">
              {/* Table Header */}
              <thead className="border-b border-gray-300">
                <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                  {/* Berfungsi untuk render header columns dengan text uppercase, small font, dan alignment sesuai */}
                  <th className="px-4 py-3 text-left font-semibold">USERNAME</th>
                  <th className="px-4 py-3 text-left font-semibold">EMAIL</th>
                  <th className="px-4 py-3 text-left font-semibold">NAMA LENGKAP</th>
                  <th className="px-4 py-3 text-center font-semibold">ROLE</th>
                  <th className="px-4 py-3 text-center font-semibold">STATUS</th>
                  <th className="px-4 py-3 text-center font-semibold">DIBUAT</th>
                  <th className="px-4 py-3 text-center font-semibold">AKSI</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="text-[13px] text-gray-700">
                {/* Berfungsi untuk memetakan array users menjadi rows tabel */}
                {users.map(user => (
                  // Berfungsi untuk render setiap row dengan key unik dan hover effect background
                  <tr key={user.id} className="hover:bg-[#ebfaf9] transition">
                    {/* Kolom: Username (dengan font bold) */}
                    <td className="px-4 py-4 text-left align-middle">
                      <strong>{user.username}</strong>
                    </td>
                    
                    {/* Kolom: Email */}
                    <td className="px-4 py-4 text-left align-middle">
                      {user.email}
                    </td>
                    
                    {/* Kolom: Nama Lengkap (dengan fallback '-' jika kosong) */}
                    <td className="px-4 py-4 text-left align-middle">
                      {user.full_name || '-'}
                    </td>
                    
                    {/* Kolom: Role (dengan badge color dinamis: ungu untuk admin, biru untuk user) */}
                    <td className="px-4 py-4 text-center align-middle">
                      <span className={`inline-block px-2 py-1 text-xs rounded-md font-medium ${user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800' // Berfungsi untuk class badge ungu jika role = admin
                        : 'bg-blue-100 text-blue-800' // Berfungsi untuk class badge biru jika role = user
                        }`}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </td>
                    
                    {/* Kolom: Status (dengan badge color dinamis: hijau untuk aktif, gray untuk nonaktif) */}
                    <td className="px-4 py-4 text-center align-middle">
                      <span className={`inline-block px-2 py-1 text-xs rounded-md ${user.is_active
                        ? 'bg-green-100 text-green-800' // Berfungsi untuk class badge hijau jika is_active = true
                        : 'bg-gray-100 text-gray-800' // Berfungsi untuk class badge gray jika is_active = false
                        }`}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    
                    {/* Kolom: Tanggal Dibuat (dengan format dd-mm-yyyy via IIFE) */}
                    <td className="px-4 py-4 text-center align-middle">
                      {/* Berfungsi untuk Immediately Invoked Function Expression (IIFE) untuk format tanggal inline */}
                      {(() => {
                        const date = new Date(user.created_at); // Berfungsi untuk konversi string tanggal ke objek Date
                        const day = String(date.getDate()).padStart(2, '0'); // Berfungsi untuk format day 2 digit
                        const month = String(date.getMonth() + 1).padStart(2, '0'); // Berfungsi untuk format month 2 digit (+1 karena 0-indexed)
                        const year = date.getFullYear(); // Berfungsi untuk ambil tahun 4 digit
                        return `${day}-${month}-${year}`; // Berfungsi untuk return string format dd-mm-yyyy
                      })()}
                    </td>
                    
                    {/* Kolom: Aksi (Tombol Delete) */}
                    <td className="px-4 py-4 text-center align-middle">
                      {/* Berfungsi untuk tombol delete dengan icon dan handler onClick */}
                      <button
                        onClick={() => handleDelete(user.id, user.username)} // Berfungsi untuk call handler delete dengan ID dan username
                        className="rounded-md p-2 transition"
                        // Berfungsi untuk disable tombol delete jika user mencoba hapus diri sendiri (berdasarkan ID di localStorage)
                        disabled={user.id === JSON.parse(localStorage.getItem('user'))?.id}
                      >
                        <img src={DeleteIcon} className="h-4 w-4" alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================
          MODAL FORM TAMBAH USER
          ======================================== */}
      {/* Berfungsi untuk conditional render: tampilkan modal form hanya jika showForm = true */}
      {showForm && (
        // Berfungsi untuk overlay modal dengan background hitam semi-transparan menutupi viewport
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Berfungsi untuk container konten modal dengan background putih, rounded, shadow, scrollable, max-width 3xl */}
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <div className="p-6">
              {/* Judul Modal */}
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                Tambah User Baru
              </h3>
              
              {/* Form Element */}
              {/* Berfungsi untuk form dengan handler submit yang memanggil handleSubmit */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Grid Row 1: Username & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kolom Username */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Username <span className="text-red-500">*</span> 
                    </label>
                    <input
                      type="text"
                      className={inputClass} // Berfungsi untuk apply styling class reusable
                      placeholder="Masukkan username" // Berfungsi untuk hint text saat input kosong
                      value={formData.username} // Berfungsi untuk bind value input ke state formData.username
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })} // Berfungsi untuk update state saat user ketik
                      required // Berfungsi untuk validasi HTML5: field ini wajib diisi
                    />
                  </div>

                  {/* Kolom Email */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="Masukkan email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Grid Row 2: Password (dengan toggle show/hide) & Nama Lengkap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kolom Password dengan Toggle Visibility */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Password <span className="text-red-500">*</span>
                    </label>
                    {/* Berfungsi untuk container relative agar icon eye bisa diposisikan absolut di dalam input */}
                    <div className="relative">
                      <input
                        type="password" // Berfungsi untuk default type password agar karakter tersembunyi
                        className={inputClass}
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength="6" // Berfungsi untuk validasi HTML5: password minimal 6 karakter
                      />
                      {/* Berfungsi untuk tombol toggle show/hide password yang diposisikan absolut di kanan input */}
                      <button
                        type="button"
                        onClick={() => {
                          // Berfungsi untuk query selector input password dan toggle type antara 'password' dan 'text'
                          const input = document.querySelector('input[type="password"]');
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <i className="fas fa-eye"></i> 
                      </button>
                    </div>
                  </div>

                  {/* Kolom Nama Lengkap */}
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Masukkan nama lengkap"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Field: Role Dropdown */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass} // Berfungsi untuk apply styling class reusable untuk select
                    value={formData.role} // Berfungsi untuk bind value select ke state formData.role
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })} // Berfungsi untuk update state saat user pilih opsi
                    required // Berfungsi untuk validasi HTML5: field ini wajib dipilih
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {/* Footer Buttons: Batal & Simpan */}
                <div className="flex justify-end gap-2 pt-4">
                  {/* Tombol Batal - type="button" agar tidak trigger form submit */}
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setShowForm(false); // Berfungsi untuk tutup modal form
                      resetForm(); // ✅ RESET FORM SAAT KLIK BATAL - Berfungsi untuk clear field input ke nilai default
                    }}
                  >
                    Batal
                  </button>
                  {/* Tombol Simpan - type="submit" agar trigger handleSubmit saat diklik */}
                  <button type="submit" className="px-4 py-2 rounded-md bg-[#00b5a9] text-white hover:bg-[#008a99]">
                    Simpan User
                  </button>
                </div>
              </form>
            </div>

            {/* Berfungsi untuk spacer vertikal 4rem (64px) di bawah form agar konten tidak mepet ke edge modal saat scroll */}
            <div className="h-15"></div> {/* 4rem = 64px ruang kosong */}

          </div>
        </div>
      )}
    </div>
  );
}