import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import Login from './pages/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import UserManagement from './components/UserManagement';
import './style.css';

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userRole, setUserRole] = useState(null); // ✅ State untuk role

  useEffect(() => {
    // Cek login saat halaman dimuat
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLogin(true);
        setUserRole(user.role); // ✅ Ambil role dari localStorage
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // ✅ Handler login yang menerima role
  const handleLoginSuccess = (role) => {
    setIsLogin(true);
    setUserRole(role);
  };

  if (!isLogin) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  // ✅ Helper: Cek apakah admin
  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Navigasi dengan kondisi role */}
        <div className="mb-6 flex flex-wrap gap-3 md:gap-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              currentPage === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>
            Dashboard
          </button>
          
          <button
            onClick={() => setCurrentPage('homepage')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              currentPage === 'homepage'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <i className="fas fa-file-contract mr-2"></i>
            Daftar MoU
          </button>
          
          {/* ✅ HANYA TAMPIL UNTUK ADMIN */}
          {isAdmin && (
            <button
              onClick={() => setCurrentPage('user-management')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'user-management'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <i className="fas fa-users-cog mr-2"></i>
              Manajemen User
            </button>
          )}
        </div>

        {/* Render halaman */}
        {currentPage === 'dashboard' ? (
          <Dashboard />
        ) : currentPage === 'user-management' ? (
          <UserManagement isAdmin={isAdmin} /> 
        ) : (
          <Homepage 
            activeTab="pemda" 
            onTabChange={() => {}} 
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;