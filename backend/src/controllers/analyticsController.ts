import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import Task from '@/models/Task';
import User from '@/models/User';
import { TaskStatus } from '@/models/Task';

export const getXPProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    // Get all completed tasks in the period
    const completedTasks = await Task.find({
      userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $gte: startDate }
    }).sort({ completedAt: 1 });

    // Group by date and sum XP
    const xpByDate: Record<string, number> = {};
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const dateKey = task.completedAt.toISOString().split('T')[0];
        xpByDate[dateKey] = (xpByDate[dateKey] || 0) + task.points;
      }
    });

    // Convert to array format for charts
    const data = Object.entries(xpByDate).map(([date, xp]) => ({
      date,
      xp
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskCompletionAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    const tasks = await Task.find({
      userId,
      createdAt: { $gte: startDate }
    });

    // Analytics by priority
    const byPriority: Record<string, number> = {};
    // Analytics by status
    const byStatus: Record<string, number> = {};
    // Analytics by completion
    let totalTasks = tasks.length;
    let completedTasks = 0;

    tasks.forEach(task => {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      if (task.status === TaskStatus.COMPLETED) {
        completedTasks++;
      }
    });

    res.json({
      success: true,
      data: {
        byPriority,
        byStatus,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityHeatmap = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 365 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    const completedTasks = await Task.find({
      userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $gte: startDate }
    });

    // Group by date and count tasks
    const activityByDate: Record<string, number> = {};
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const dateKey = task.completedAt.toISOString().split('T')[0];
        activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
      }
    });

    // Convert to array format
    const data = Object.entries(activityByDate).map(([date, count]) => ({
      date,
      count
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
