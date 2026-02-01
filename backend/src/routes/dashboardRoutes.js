// ========================================
// DASHBOARD ROUTES
// ========================================
import express from 'express';
import { getExpiringStats } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// ENDPOINT: GET /api/dashboard/expiring-stats
// Deskripsi: Mengambil statistik dokumen yang akan expired
// Akses: Hanya user yang login (requireAuth)
// ========================================
router.get('/expiring-stats', requireAuth, getExpiringStats);

export default router;