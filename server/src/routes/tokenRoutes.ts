import { Router } from 'express';
import {
  createToken,
  getWaitingTokens,
  getCurrentlyServing,
  callNext,
  completeService,
  cancelToken,
  moveToken,
  batchReorderTokens,
  getTokenHistory,
} from '../controllers/tokenController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Token CRUD and retrieval
router.post('/', createToken);
router.get('/queue/:queueId/waiting', getWaitingTokens);
router.get('/queue/:queueId/serving', getCurrentlyServing);
router.get('/queue/:queueId/history', getTokenHistory);

// Service lifecycle operations
router.post('/call-next', callNext);
router.patch('/:id/complete', completeService);
router.patch('/:id/cancel', cancelToken);

// Ordering / reordering operations
router.patch('/:id/move', moveToken);
router.post('/reorder', batchReorderTokens);

export default router;

