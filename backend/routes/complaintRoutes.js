import { Router } from 'express';
import {
  createComplaint, getComplaint, listComplaints,
  updateComplaint, getStats, upload,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/stats', getStats);
router.route('/').get(listComplaints).post(upload.array('images', 5), createComplaint);
router.route('/:id').get(getComplaint).patch(updateComplaint);
export default router;
