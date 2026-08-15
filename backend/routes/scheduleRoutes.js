import { Router } from 'express';
import { listSchedules, getUpcomingCollections } from '../controllers/scheduleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', listSchedules);
router.get('/upcoming', getUpcomingCollections);
export default router;
