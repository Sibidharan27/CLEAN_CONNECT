import { Router } from 'express'; import { summary } from '../controllers/analyticsController.js'; const router = Router(); router.get('/summary', summary); export default router;
