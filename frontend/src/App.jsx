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
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("pemda");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLogin(true);
        setUserRole(user.role);
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLoginSuccess = (role) => {
    setIsLogin(true);
    setUserRole(role);
  };

  if (!isLogin) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  const isAdmin = userRole === 'admin';

  return (
    /* Gunakan flex-col dan min-h-screen di sini */
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isAdmin={isAdmin} 
      />

      {/* flex-grow akan memastikan bagian main mengambil ruang yang tersedia, sehingga footer terdorong ke bawah */}
      <main className="flex-grow container mx-auto px-4 py-6 mt-10">
        {currentPage === 'dashboard' ? (
          <Dashboard />
        ) : currentPage === 'user-management' ? (
          <UserManagement isAdmin={isAdmin} />
        ) : (
          <Homepage 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </main>
      
      {/* Footer sekarang otomatis di paling bawah */}
      <Footer />
    </div>
  );
}

export default App;