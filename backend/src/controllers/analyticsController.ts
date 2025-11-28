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

export const getProductivityInsights = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    const completedTasks = await Task.find({
      userId,
      status: TaskStatus.COMPLETED,
      completedAt: { $gte: startDate }
    });

    // Calculate best hours
    const hourCounts: Record<number, number> = {};
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const hour = task.completedAt.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const bestHour = Object.entries(hourCounts).reduce((max, [hour, count]) =>
      count > max.count ? { hour: Number(hour), count } : max,
      { hour: 0, count: 0 }
    );

    // Calculate best days
    const dayCounts: Record<number, number> = {};
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const day = task.completedAt.getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    });

    const bestDay = Object.entries(dayCounts).reduce((max, [day, count]) =>
      count > max.count ? { day: Number(day), count } : max,
      { day: 0, count: 0 }
    );

    // Calculate current streak
    const sortedDates = completedTasks
      .map(t => t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : '')
      .filter(d => d)
      .sort()
      .reverse();

    const uniqueDates = [...new Set(sortedDates)];
    let currentStreak = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];

      if (uniqueDates[i] === expected) {
        currentStreak++;
      } else {
        break;
      }
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.json({
      success: true,
      data: {
        bestHour: bestHour.hour,
        bestDay: dayNames[bestDay.day],
        currentStreak,
        totalCompleted: completedTasks.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { period = 'weekly' } = req.query;

    let startDate: Date | undefined;
    if (period === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get current user's friends
    const currentUser = await User.findById(userId).populate('friends', 'name email avatar xp totalTasksCompleted');
    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Build leaderboard including current user and friends
    const usersToRank = [currentUser, ...(currentUser.friends as any[])];

    // If period-based, calculate XP for that period
    if (startDate) {
      const leaderboardData = await Promise.all(
        usersToRank.map(async (user) => {
          const periodTasks = await Task.find({
            userId: user._id,
            status: TaskStatus.COMPLETED,
            completedAt: { $gte: startDate }
          });

          const periodXP = periodTasks.reduce((sum, task) => sum + task.points, 0);
          const periodTasksCompleted = periodTasks.length;

          return {
            userId: user._id,
            name: user.name,
            avatar: user.avatar,
            xp: periodXP,
            tasksCompleted: periodTasksCompleted
          };
        })
      );

      // Sort by XP descending
      leaderboardData.sort((a, b) => b.xp - a.xp);

      res.json({
        success: true,
        data: leaderboardData,
        currentUserId: userId
      });
    } else {
      // All-time leaderboard
      const leaderboardData = usersToRank.map(user => ({
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
        xp: user.xp,
        tasksCompleted: user.totalTasksCompleted
      }));

      leaderboardData.sort((a, b) => b.xp - a.xp);

      res.json({
        success: true,
        data: leaderboardData,
        currentUserId: userId
      });
    }
  } catch (error) {
    next(error);
  }
};
