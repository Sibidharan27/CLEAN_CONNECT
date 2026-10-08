import { Router } from 'express';
import { summary, getHotspotAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/summary', summary);
router.get('/hotspots', protect, getHotspotAnalytics);

export default router;
