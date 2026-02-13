import React, { useState, useEffect } from 'react';
import DeleteIcon from "../assets/deleteicon.svg";

export default function UserManagement({ isAdmin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user'
  });

  useEffect(() => {
    if (!isAdmin) {
      setError("Akses ditolak. Hanya admin yang dapat mengakses halaman ini.");
      setLoading(false);
      return;
    }
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch("/api/users", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Endpoint /api/users tidak ditemukan. Pastikan backend sudah dikonfigurasi.");
        }
        throw new Error(`Gagal memuat data: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        throw new Error("Format data tidak valid");
      }
    } catch (err) {
      console.error("Load users error:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data user");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal membuat user");
      }

      const result = await res.json();

      alert("User berhasil dibuat!");
      setShowForm(false);
      setFormData({ username: '', email: '', password: '', full_name: '', role: 'user' });
      loadUsers();
    } catch (err) {
      console.error("Register user error:", err);
      setError(err.message || "Terjadi kesalahan saat membuat user");
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Yakin ingin menghapus user "${username}"?`)) return;

    try {
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus user");
      }

      alert("User berhasil dihapus");
      loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err.message || "Terjadi kesalahan saat menghapus user");
    }
  };

  // ====== HANYA TAMPILAN (STYLE) ======
  const inputClass =
    "w-full h-11 px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "placeholder:text-gray-400 placeholder:font-normal " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const selectClass =
    "w-full h-11 px-4 py-2.5 border border-gray-300 rounded-md bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  // ===================================

  // Error Boundary
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat data user...</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (users.length === 0) {
    return (
      <div className="space-y-6 pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h2>
            <p className="text-sm text-gray-500 mt-1">
              Kelola akun pengguna sistem SIKERMA
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah User
          </button>
        </div>

        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="text-gray-300 text-6xl mb-4">
            <i className="fas fa-users"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Pengguna</h2>
          <p className="text-gray-500 mb-6">
            Database belum memiliki data pengguna. Tambahkan pengguna pertama Anda!
          </p>

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-6 border">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i className="fas fa-plus-circle text-blue-600"></i>
                Tambah User Baru
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Masukkan username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={selectClass}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800">
                    Simpan User
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal State - Tampilkan tabel
  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Pengguna</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola akun pengguna sistem SIKERMA
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah User
        </button>
      </div>

      {/* Form Tambah User */}
      {showForm ? (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-plus-circle text-blue-600"></i>
            Tambah User Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Masukkan username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                className={selectClass}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowForm(false)}
              >
                Batal
              </button>
              <button type="submit" className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800">
                Simpan User
              </button>
            </div>
          </form>
        </div>
      ) : (

        // Tabel User - HANYA TAMPIL SAAT FORM TIDAK DIBUKA
        <div className="bg-white rounded-lg border p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-4">
              <thead className="border-b border-gray-300">
                <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Username</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Nama Lengkap</th>
                  <th className="px-4 py-3 text-center font-semibold">Role</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Dibuat</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody className="text-[13px] text-gray-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4 text-left align-middle">
                      <strong>{user.username}</strong>
                    </td>
                    <td className="px-4 py-4 text-left align-middle">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 text-left align-middle">
                      {user.full_name || '-'}
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <span className={`inline-block px-3 py-1 text-xs rounded-md font-medium ${user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <span className={`inline-block px-3 py-1 text-xs rounded-md font-medium ${user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-4 text-center align-middle">
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md p-2 transition"
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
    </div>
  );
}
