// src/api/mous.js
import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ambil data
// src/api/mous.js
export const getMousByCategory = async (category) => {
  try {
    const response = await api.get(`/mous?category=${category}`);
    console.log('Data dari API:', response.data); // Memeriksa data yang diterima
    return response.data;
  } catch (error) {
    console.error('Error fetching MoUs:', error);
    throw error;
  }
};

export const getAllMous = async () => {
  try {
    const response = await api.get('/mous');
    return response.data;
  } catch (error) {
    console.error('Error fetching all MoUs:', error);
    throw error;
  }
};

// ✅ TAMBAHKAN INI: Fungsi untuk menyimpan MoU/PKS
export const createMou = async (mouData) => {
  try {
    const response = await api.post('/mous', mouData);
    return response.data;
  } catch (error) {
    console.error('Error creating MoU:', error);
    // Jika error respons dari backend, ambil pesannya
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Gagal menyimpan dokumen ke server');
  }
};

export default api;