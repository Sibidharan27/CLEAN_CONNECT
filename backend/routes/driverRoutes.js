import { Router } from 'express';
import {
  getDriverRoutes,
  completeStop,
  startRoute,
  updateDriverLocation,
  getDriverStats,
} from '../controllers/driverController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/routes', getDriverRoutes);
router.post('/routes/:routeId/start', startRoute);
router.post('/routes/:routeId/stops/:stopId/complete', completeStop);
router.post('/location', updateDriverLocation);
router.get('/stats', getDriverStats);
export default router;
