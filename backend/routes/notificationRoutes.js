import { Router } from 'express';
import {
  listNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.use(protect);
router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);
export default router;
