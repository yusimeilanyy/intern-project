import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import Login from './pages/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import './style.css';

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' atau 'homepage'

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLogin(true);
    }
  }, []);

  if (!isLogin) {
    return <Login onSuccess={() => setIsLogin(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Navigasi Halaman */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              currentPage === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('homepage')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              currentPage === 'homepage'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Daftar MoU
          </button>
        </div>

        {/* Render Halaman */}
        {currentPage === 'dashboard' ? (
          <Dashboard />
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