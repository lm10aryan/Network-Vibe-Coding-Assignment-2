import { Router } from 'express';
import authenticate from '@/middleware/auth';
import { query } from 'express-validator';
import {
  getXPProgress,
  getTaskCompletionAnalytics,
  getActivityHeatmap,
  getProductivityInsights,
  getLeaderboard
} from '@/controllers/analyticsController';

const router = Router();

router.get('/xp-progress', authenticate, [
  query('period').optional().isInt({ min: 1, max: 365 })
], getXPProgress);

router.get('/task-completion', authenticate, [
  query('period').optional().isInt({ min: 1, max: 365 })
], getTaskCompletionAnalytics);

router.get('/activity-heatmap', authenticate, [
  query('period').optional().isInt({ min: 1, max: 365 })
], getActivityHeatmap);

router.get('/productivity-insights', authenticate, [
  query('period').optional().isInt({ min: 1, max: 365 })
], getProductivityInsights);

router.get('/leaderboard', authenticate, [
  query('period').optional().isIn(['weekly', 'monthly', 'all-time'])
], getLeaderboard);

export default router;
