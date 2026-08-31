import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getStats, getAllComplaints, updateComplaint, deleteComplaint,
  getAllDrivers, getAllCitizens, getAllRoutes, getAllSchedules, createDriver,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id', updateComplaint);
router.delete('/complaints/:id', deleteComplaint);
router.get('/drivers', getAllDrivers);
router.post('/drivers', createDriver);
router.get('/citizens', getAllCitizens);
router.get('/routes', getAllRoutes);
router.get('/schedules', getAllSchedules);

export default router;
