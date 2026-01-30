import React, { useState, useEffect } from 'react';
import './UserManagement.css';

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

      console.log("Memuat data user...");
      
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
      console.log("Data user diterima:", data);
      
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
      console.log("User berhasil dibuat:", result);
      
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

  // Error Boundary
  if (error) {
    return (
      <div className="error-boundary">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle error-icon"></i>
          <h2>Error</h2>
          <p className="error-message">{error}</p>
          <button onClick={loadUsers} className="btn-retry">Muat Ulang</button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="spinner"></div>
        <p>Memuat data user...</p>
      </div>
    );
  }

  // Empty State - TAMPILKAN INI JIKA DATABASE KOSONG
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <i className="fas fa-users"></i>
        </div>
        <h2>Belum Ada Pengguna</h2>
        <p className="empty-description">
          Database belum memiliki data pengguna. Tambahkan pengguna pertama Anda!
        </p>
        <button onClick={() => setShowForm(true)} className="btn-add-first">
          <i className="fas fa-plus"></i>
        </button>
        
        {/* Form muncul di sini jika empty state */}
        {showForm && (
          <div className="user-management-container">
            <div className="add-user-section">
              <h3 className="add-user-title">
                <i className="fas fa-plus-circle"></i> Tambah User Baru
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username <span className="required">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Masukkan username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="Masukkan email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Password <span className="required">*</span></label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength="6"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Nama Lengkap <span className="required">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Masukkan nama lengkap"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Role <span className="required">*</span></label>
                    <select 
                      className="form-control select"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-cancel"
                    onClick={() => setShowForm(false)}
                  >
                    <i className="fas fa-times"></i> Batal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save"></i> Simpan User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal State - Tampilkan tabel
  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>Manajemen Pengguna</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-add-user"
        >
          <i className="fas fa-plus"></i>
          Tambah User
        </button>
      </div>

      {/* Form Tambah User */}
      {showForm && (
        <div className="user-management-container">
          <div className="add-user-section">
            <h3 className="add-user-title">
              <i className="fas fa-plus-circle"></i> Tambah User Baru
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Username <span className="required">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Masukkan username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="Masukkan email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength="6"
                  />
                </div>
                
                <div className="form-group">
                  <label>Nama Lengkap <span className="required">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Masukkan nama lengkap"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Role <span className="required">*</span></label>
                  <select 
                    className="form-control select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  <i className="fas fa-times"></i> Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel User */}
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Nama Lengkap</th>
              <th>Role</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.username}</strong></td>
                <td>{user.email}</td>
                <td>{user.full_name || '-'}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(user.id, user.username)}
                    className="btn-delete"
                    disabled={user.id === JSON.parse(localStorage.getItem('user'))?.id}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}