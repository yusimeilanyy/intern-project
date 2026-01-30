// backend/src/routes/mous.js
import express from 'express';
import multer from 'multer';  // ✅ Tambahkan import multer
import { 
  getDashboardData,
  getDocumentPreview,
  getAllMous, 
  getMouById, 
  createMou, 
  updateMou, 
  deleteMou 
} from '../controllers/mousController.js';

// ✅ Setup multer
const upload = multer({ 
  dest: 'uploads/',  // Folder tujuan upload
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

router.get('/dashboard', getDashboardData);
router.get('/preview/:id', getDocumentPreview);
router.get('/', getAllMous);
router.get('/:id', getMouById);
router.post('/', upload.single('file'), createMou);  // ✅ Tambahkan middleware
router.put('/:id', upload.single('file'), updateMou);  // ✅ Tambahkan middleware
router.delete('/:id', deleteMou);

export default router;