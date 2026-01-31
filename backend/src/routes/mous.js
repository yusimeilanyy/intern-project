// backend/src/routes/mous.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

// Import controller functions - sesuaikan dengan lokasi actual Anda
import {
  getDashboardData,
  getAllMous,
  getMouById,
  createMou,
  updateMou,
  deleteMou,
  getDocumentPreview
} from '../controllers/mousController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ========================================
// MULTER CONFIGURATION
// ========================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Path relatif dari /src/routes/ ke /public/uploads/
    const uploadPath = path.join(__dirname, '../../public/uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file PDF, DOC, dan DOCX yang diizinkan!'));
    }
  }
});

// ========================================
// ROUTES
// ========================================

// Dashboard data (jika ada endpoint terpisah)
router.get('/dashboard', requireAuth, getDashboardData);

// CRUD routes
router.get('/', requireAuth, getAllMous);
router.get('/:id', requireAuth, getMouById);
router.get('/:id/preview', requireAuth, getDocumentPreview);
router.post('/', requireAuth, upload.single('file'), createMou);
router.put('/:id', requireAuth, upload.single('file'), updateMou);
router.delete('/:id', requireAuth, deleteMou);

export default router;