// ========================================
// RENEWAL ROUTES
// ========================================
import express from 'express';
import { 
  renewExpiredDocument, 
  getRenewalHistory 
} from '../controllers/renewalController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ========================================
// ENDPOINT: PUT /api/renewal/:id
// Deskripsi: Memperpanjang dokumen yang sudah kadaluarsa
// Akses: Hanya user yang login
// ========================================
router.put('/:id', requireAuth, renewExpiredDocument);

// ========================================
// ENDPOINT: GET /api/renewal/:id/history
// Deskripsi: Mengambil history perpanjangan dokumen
// Akses: Hanya user yang login
// ========================================
router.get('/:id/history', requireAuth, getRenewalHistory);

export default router;