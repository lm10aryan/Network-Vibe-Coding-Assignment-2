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
