import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import Login from './pages/Login.jsx';

function App() {

  const [activeTab, setActiveTab] = useState('pemda');
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {

    // cek hash tab
    const hash = window.location.hash.slice(1);
    if (hash === 'non-pemda') {
      setActiveTab('non-pemda');
    } else {
      setActiveTab('pemda');
    }

    // cek token login
    const token = localStorage.getItem("token");
    if (token) {
      setIsLogin(true);
    }

  }, []);

  // JIKA BELUM LOGIN → TAMPILKAN LOGIN
  if (!isLogin) {
    return <Login onSuccess={() => setIsLogin(true)} />;
  }

  // JIKA SUDAH LOGIN → TAMPILKAN HOMEPAGE
  return (
    <div className="min-h-screen bg-gray-50">

      <Header />

      <main className="container mx-auto px-4 py-6">
        <Homepage
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </main>

      <Footer />

    </div>
  );
}

export default App;
