// Dashboard.jsx atau file parent
import { useState, useEffect } from 'react';
import axios from 'axios';
import MoUList from './components/MoUList';

export default function Dashboard() {
  const [mous, setMous] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FETCH DENGAN CACHE-BUSTING
  useEffect(() => {
    const fetchMoUs = async () => {
      try {
        const response = await axios.get(
          `/api/mous?category=pemda&t=${Date.now()}` // ← TAMBAHKAN INI
        );
        setMous(response.data);
      } catch (error) {
        console.error('Error fetching MoUs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoUs();
  }, []); // [] = hanya dijalankan sekali saat mount

  const handleAdd = () => {
    // Setelah tambah dokumen, refetch data
    axios.get(`/api/mous?category=pemda&t=${Date.now()}`)
      .then(res => setMous(res.data));
  };

  return (
    <div>
      <MoUList mous={mous} />
    </div>
  );
}