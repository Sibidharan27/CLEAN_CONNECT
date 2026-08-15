import { Router } from 'express'; import { latestLocation, updateLocation } from '../controllers/trackingController.js'; import { protect } from '../middleware/authMiddleware.js';
const router = Router(); router.get('/:vehicleId', protect, latestLocation); router.post('/', protect, updateLocation); export default router;
