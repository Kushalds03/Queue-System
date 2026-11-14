import { Router } from 'express';
import {
  getQueues,
  getQueueById,
  createQueue,
  updateQueue,
  toggleQueueStatus,
  deleteQueue,
} from '../controllers/queueController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getQueues);
router.get('/:id', getQueueById);
router.post('/', createQueue);
router.put('/:id', updateQueue);
router.patch('/:id/toggle-status', toggleQueueStatus);
router.delete('/:id', deleteQueue);

export default router;
