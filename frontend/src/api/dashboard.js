import axios from 'axios';

// Pastikan port sesuai dengan backend yang sudah diperbaiki (4001)
const API_URL = 'http://localhost:4001/api';

export const fetchDashboardStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalMou: 0,
      totalPks: 0,
      activeCount: 0,
      expiredCount: 0,
      expiringSoonCount: 0,
      mou: { active: 0, expired: 0 },
      pks: { active: 0, expired: 0 },
      monthlyTrend: { mou: [], pks: [] }
    };
  }
};

export const fetchDocuments = async (type = 'all') => {
  try {
    const response = await axios.get(`${API_URL}/documents?type=${type}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};