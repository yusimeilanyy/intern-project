import axios from 'axios';

// Gunakan proxy Vite, jadi cukup '/api'
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMousByCategory = async (category) => {
  try {
    const response = await api.get(`/mous?category=${category}`);
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

export default api;