import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { allowRoles } from '../middleware/roleMiddleware.js';
import {
  listAlerts,
  getAlert,
  updateAlertStatus,
  addNote,
  requestRecollection,
  updateRecollectionStatus,
  getAlertStats,
} from '../controllers/alertController.js';

const router = Router();

// All alert routes require authentication
router.use(protect);

// ── Admin-only endpoints ───────────────────────────────────────────────────────
router.get('/stats',     adminOnly, getAlertStats);
router.get('/',          adminOnly, listAlerts);
router.get('/:id',       adminOnly, getAlert);
router.patch('/:id/status',        adminOnly, updateAlertStatus);
router.post('/:id/notes',          adminOnly, addNote);
router.post('/:id/recollection',   adminOnly, requestRecollection);

// ── Driver can acknowledge/complete recollection ───────────────────────────────
router.patch('/:id/recollection', allowRoles('driver', 'admin'), updateRecollectionStatus);

export default router;
