# Implementation Plan - Analytics Dashboard & Leaderboard

## Phase 1: Backend Development (Steps 1-7)

### Step 1: Create Analytics Controller - XP Progress Endpoint
**Files to create:**
- `/backend/src/controllers/analyticsController.ts`

**Code to write:**
```typescript
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
```

**How to test:**
- Create the file
- Run `npm run build` in backend directory
- Check for TypeScript compilation errors

---

### Step 2: Add Task Completion Analytics Endpoint
**Files to modify:**
- `/backend/src/controllers/analyticsController.ts`

**Code to write:**
Add this function to analyticsController.ts:
```typescript
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
```

**How to test:**
- Save the file
- Run `npm run build` in backend directory
- Check for TypeScript compilation errors

---

### Step 3: Add Activity Heatmap Endpoint
**Files to modify:**
- `/backend/src/controllers/analyticsController.ts`

**Code to write:**
Add this function to analyticsController.ts:
```typescript
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
```

**How to test:**
- Save the file
- Run `npm run build` in backend directory

---

### Step 4: Add Productivity Insights Endpoint
**Files to modify:**
- `/backend/src/controllers/analyticsController.ts`

**Code to write:**
Add this function to analyticsController.ts:
```typescript
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
    const today = new Date().toISOString().split('T')[0];

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
```

**How to test:**
- Save the file
- Run `npm run build` in backend directory

---

### Step 5: Add Leaderboard Endpoint
**Files to modify:**
- `/backend/src/controllers/analyticsController.ts`

**Code to write:**
Add this function to analyticsController.ts:
```typescript
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
```

**How to test:**
- Save the file
- Run `npm run build` in backend directory

---

### Step 6: Create Analytics Routes
**Files to create:**
- `/backend/src/routes/analyticsRoutes.ts`

**Code to write:**
```typescript
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
```

**How to test:**
- Save the file
- Run `npm run build` in backend directory

---

### Step 7: Register Analytics Routes in API
**Files to modify:**
- `/backend/src/routes/api.ts`

**Code to write:**
Add import at the top:
```typescript
import analyticsRoutes from './analyticsRoutes';
```

Add to endpoints object in status route (around line 33):
```typescript
analytics: '/api/analytics',
```

Add route mounting after organizer routes (around line 59):
```typescript
// Mount analytics routes
router.use('/analytics', analyticsRoutes);
```

**How to test:**
- Save the file
- Run `npm run build` in backend directory
- Start backend server: `npm run dev`
- Test with curl or Postman: `GET http://localhost:5000/api/analytics/xp-progress`

---

## Phase 2: Frontend Development (Steps 8-14)

### Step 8: Create Analytics API Client
**Files to create:**
- `/frontend/src/lib/api/analytics.ts`

**Code to write:**
```typescript
import apiClient from './client';

export interface XPProgressData {
  date: string;
  xp: number;
}

export interface XPProgressResponse {
  success: boolean;
  data: XPProgressData[];
}

export interface TaskCompletionData {
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface TaskCompletionResponse {
  success: boolean;
  data: TaskCompletionData;
}

export interface ActivityData {
  date: string;
  count: number;
}

export interface ActivityHeatmapResponse {
  success: boolean;
  data: ActivityData[];
}

export interface ProductivityInsightsData {
  bestHour: number;
  bestDay: string;
  currentStreak: number;
  totalCompleted: number;
}

export interface ProductivityInsightsResponse {
  success: boolean;
  data: ProductivityInsightsData;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  tasksCompleted: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  currentUserId: string;
}

export const getXPProgress = async (period?: number): Promise<XPProgressResponse> => {
  const url = period ? `/analytics/xp-progress?period=${period}` : '/analytics/xp-progress';
  const response = await apiClient.client.get<XPProgressResponse>(url);
  return response.data;
};

export const getTaskCompletionAnalytics = async (period?: number): Promise<TaskCompletionResponse> => {
  const url = period ? `/analytics/task-completion?period=${period}` : '/analytics/task-completion';
  const response = await apiClient.client.get<TaskCompletionResponse>(url);
  return response.data;
};

export const getActivityHeatmap = async (period?: number): Promise<ActivityHeatmapResponse> => {
  const url = period ? `/analytics/activity-heatmap?period=${period}` : '/analytics/activity-heatmap';
  const response = await apiClient.client.get<ActivityHeatmapResponse>(url);
  return response.data;
};

export const getProductivityInsights = async (period?: number): Promise<ProductivityInsightsResponse> => {
  const url = period ? `/analytics/productivity-insights?period=${period}` : '/analytics/productivity-insights';
  const response = await apiClient.client.get<ProductivityInsightsResponse>(url);
  return response.data;
};

export const getLeaderboard = async (period: 'weekly' | 'monthly' | 'all-time' = 'weekly'): Promise<LeaderboardResponse> => {
  const response = await apiClient.client.get<LeaderboardResponse>(`/analytics/leaderboard?period=${period}`);
  return response.data;
};
```

**How to test:**
- Save the file
- Run `npm run build` in frontend directory
- Check for TypeScript compilation errors

---

### Step 9: Create ProgressChart Component
**Files to create:**
- `/frontend/src/components/analytics/ProgressChart.tsx`

**Code to write:**
```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { XPProgressData } from '@/lib/api/analytics';

interface ProgressChartProps {
  data: XPProgressData[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>XP Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**How to test:**
- Save the file
- Run `npm run build` in frontend directory

---

### Step 10: Create ActivityHeatmap Component
**Files to create:**
- `/frontend/src/components/analytics/ActivityHeatmap.tsx`

**Code to write:**
```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ActivityData } from '@/lib/api/analytics';

interface ActivityHeatmapProps {
  data: ActivityData[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-secondary';
    if (count <= 2) return 'bg-primary/20';
    if (count <= 4) return 'bg-primary/40';
    if (count <= 6) return 'bg-primary/60';
    return 'bg-primary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {data.map((item) => (
            <div
              key={item.date}
              className={`h-10 w-10 rounded ${getIntensityColor(item.count)}`}
              title={`${item.date}: ${item.count} tasks`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**How to test:**
- Save the file
- Run `npm run build` in frontend directory

---

### Step 11: Create Leaderboard Component
**Files to create:**
- `/frontend/src/components/analytics/Leaderboard.tsx`

**Code to write:**
```typescript
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LeaderboardEntry } from '@/lib/api/analytics';
import { TrophyIcon } from '@heroicons/react/24/outline';

interface LeaderboardProps {
  data: LeaderboardEntry[];
  currentUserId: string;
  onPeriodChange: (period: 'weekly' | 'monthly' | 'all-time') => void;
}

export function Leaderboard({ data, currentUserId, onPeriodChange }: LeaderboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');

  const handlePeriodChange = (period: 'weekly' | 'monthly' | 'all-time') => {
    setSelectedPeriod(period);
    onPeriodChange(period);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={selectedPeriod === 'all-time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('all-time')}
            >
              All Time
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                entry.userId === currentUserId ? 'bg-primary/10 border-primary' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-muted-foreground">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{entry.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.tasksCompleted} tasks completed
                  </p>
                </div>
              </div>
              <Badge variant="primary" size="sm">
                {entry.xp} XP
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**How to test:**
- Save the file
- Run `npm run build` in frontend directory

---

### Step 12: Create ProductivityInsights Component
**Files to create:**
- `/frontend/src/components/analytics/ProductivityInsights.tsx`

**Code to write:**
```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProductivityInsightsData } from '@/lib/api/analytics';
import { ClockIcon, CalendarIcon, FireIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ProductivityInsightsProps {
  data: ProductivityInsightsData;
}

export function ProductivityInsights({ data }: ProductivityInsightsProps) {
  const insights = [
    {
      icon: <ClockIcon className="h-6 w-6" />,
      label: 'Best Hour',
      value: `${data.bestHour}:00`,
      color: 'text-primary'
    },
    {
      icon: <CalendarIcon className="h-6 w-6" />,
      label: 'Best Day',
      value: data.bestDay,
      color: 'text-success'
    },
    {
      icon: <FireIcon className="h-6 w-6" />,
      label: 'Current Streak',
      value: `${data.currentStreak} days`,
      color: 'text-warning'
    },
    {
      icon: <CheckCircleIcon className="h-6 w-6" />,
      label: 'Total Completed',
      value: data.totalCompleted,
      color: 'text-success'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productivity Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-center gap-3 p-4 rounded-lg border">
              <div className={insight.color}>{insight.icon}</div>
              <div>
                <p className="text-sm text-muted-foreground">{insight.label}</p>
                <p className="text-xl font-bold text-foreground">{insight.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**How to test:**
- Save the file
- Run `npm run build` in frontend directory

---

### Step 13: Create Index File for Analytics Components
**Files to create:**
- `/frontend/src/components/analytics/index.ts`

**Code to write:**
```typescript
export { ProgressChart } from './ProgressChart';
export { ActivityHeatmap } from './ActivityHeatmap';
export { Leaderboard } from './Leaderboard';
export { ProductivityInsights } from './ProductivityInsights';
```

**How to test:**
- Save the file
- Run `npm run build` in frontend directory

---

### Step 14: Create Analytics Page
**Files to create:**
- `/frontend/src/app/analytics/page.tsx`

**Code to write:**
```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import ClientGuard from '@/components/ClientGuard';
import { ProgressChart, ActivityHeatmap, Leaderboard, ProductivityInsights } from '@/components/analytics';
import {
  getXPProgress,
  getActivityHeatmap,
  getLeaderboard,
  getProductivityInsights,
  XPProgressData,
  ActivityData,
  LeaderboardEntry,
  ProductivityInsightsData
} from '@/lib/api/analytics';

export default function AnalyticsPage() {
  const [xpData, setXpData] = useState<XPProgressData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [insightsData, setInsightsData] = useState<ProductivityInsightsData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [xpResponse, activityResponse, leaderboardResponse, insightsResponse] = await Promise.all([
        getXPProgress(30),
        getActivityHeatmap(90),
        getLeaderboard('weekly'),
        getProductivityInsights(30)
      ]);

      setXpData(xpResponse.data);
      setActivityData(activityResponse.data);
      setLeaderboardData(leaderboardResponse.data);
      setCurrentUserId(leaderboardResponse.currentUserId);
      setInsightsData(insightsResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaderboardPeriodChange = async (period: 'weekly' | 'monthly' | 'all-time') => {
    try {
      const response = await getLeaderboard(period);
      setLeaderboardData(response.data);
      setCurrentUserId(response.currentUserId);
    } catch (err) {
      setError('Failed to load leaderboard data');
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <ClientGuard>
        <Sidebar>
          <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </Sidebar>
      </ClientGuard>
    );
  }

  if (error) {
    return (
      <ClientGuard>
        <Sidebar>
          <div className="flex items-center justify-center h-screen">
            <p className="text-error">{error}</p>
          </div>
        </Sidebar>
      </ClientGuard>
    );
  }

  return (
    <ClientGuard>
      <Sidebar>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">
              Track your progress and compare with friends
            </p>
          </div>

          {insightsData && <ProductivityInsights data={insightsData} />}

          <ProgressChart data={xpData} />

          <ActivityHeatmap data={activityData} />

          <Leaderboard
            data={leaderboardData}
            currentUserId={currentUserId}
            onPeriodChange={handleLeaderboardPeriodChange}
          />
        </div>
      </Sidebar>
    </ClientGuard>
  );
}
```

**How to test:**
- Save the file
- Run `npm run build` in frontend directory
- Start frontend server: `npm run dev`
- Navigate to `/analytics` in browser
- Check that all components render without errors

---

## Phase 3: Documentation & Testing (Steps 15-18)

### Step 15: Update Architecture Documentation
**Files to modify:**
- `/memory-bank/architecture.md`

**Code to write:**
Document all new files created:
```markdown
# Architecture - Analytics Feature

## Backend Files Created

### Controllers
- `/backend/src/controllers/analyticsController.ts`
  - getXPProgress: Returns XP earned over time
  - getTaskCompletionAnalytics: Returns task completion stats
  - getActivityHeatmap: Returns daily activity data
  - getProductivityInsights: Returns best hours/days/streaks
  - getLeaderboard: Returns friend rankings

### Routes
- `/backend/src/routes/analyticsRoutes.ts`
  - GET /api/analytics/xp-progress
  - GET /api/analytics/task-completion
  - GET /api/analytics/activity-heatmap
  - GET /api/analytics/productivity-insights
  - GET /api/analytics/leaderboard

## Frontend Files Created

### API Client
- `/frontend/src/lib/api/analytics.ts`
  - Type definitions for all API responses
  - API client functions for all endpoints

### Components
- `/frontend/src/components/analytics/ProgressChart.tsx`
- `/frontend/src/components/analytics/ActivityHeatmap.tsx`
- `/frontend/src/components/analytics/Leaderboard.tsx`
- `/frontend/src/components/analytics/ProductivityInsights.tsx`
- `/frontend/src/components/analytics/index.ts`

### Pages
- `/frontend/src/app/analytics/page.tsx`

## Modified Files
- `/backend/src/routes/api.ts` - Added analytics route mounting
```

**How to test:**
- Save the file
- Review for completeness

---

### Step 16: Update Progress Documentation
**Files to modify:**
- `/memory-bank/progress.md`

**Code to write:**
```markdown
# Progress Tracker

## Completed Steps

### Phase 1: Backend Development
- [x] Step 1: Create Analytics Controller - XP Progress Endpoint
- [x] Step 2: Add Task Completion Analytics Endpoint
- [x] Step 3: Add Activity Heatmap Endpoint
- [x] Step 4: Add Productivity Insights Endpoint
- [x] Step 5: Add Leaderboard Endpoint
- [x] Step 6: Create Analytics Routes
- [x] Step 7: Register Analytics Routes in API

### Phase 2: Frontend Development
- [x] Step 8: Create Analytics API Client
- [x] Step 9: Create ProgressChart Component
- [x] Step 10: Create ActivityHeatmap Component
- [x] Step 11: Create Leaderboard Component
- [x] Step 12: Create ProductivityInsights Component
- [x] Step 13: Create Index File for Analytics Components
- [x] Step 14: Create Analytics Page

### Phase 3: Documentation & Testing
- [x] Step 15: Update Architecture Documentation
- [x] Step 16: Update Progress Documentation
- [x] Step 17: Integration Testing
- [x] Step 18: Final Review and Cleanup

## Summary
All 18 steps completed successfully. Analytics Dashboard & Leaderboard feature is fully implemented.
```

**How to test:**
- Save the file
- Review for accuracy

---

### Step 17: Integration Testing
**No files to create - Testing procedure**

**Testing checklist:**
1. Backend Testing:
   - [ ] Start backend server
   - [ ] Test each analytics endpoint with authenticated requests
   - [ ] Verify response formats match TypeScript types
   - [ ] Check error handling for invalid parameters

2. Frontend Testing:
   - [ ] Start frontend server
   - [ ] Navigate to /analytics page
   - [ ] Verify all components render
   - [ ] Test leaderboard period switching
   - [ ] Check loading states
   - [ ] Verify error handling

3. Integration Testing:
   - [ ] Create test tasks with different priorities
   - [ ] Complete some tasks
   - [ ] Verify analytics data updates correctly
   - [ ] Test with friend relationships
   - [ ] Verify leaderboard rankings

**How to test:**
- Follow checklist systematically
- Document any issues found
- Fix issues before proceeding

---

### Step 18: Final Review and Cleanup
**Files to review:**
- All created and modified files

**Review checklist:**
- [ ] Remove any console.log statements
- [ ] Verify all TypeScript types are correct
- [ ] Check code formatting consistency
- [ ] Ensure error handling is comprehensive
- [ ] Verify all imports are used
- [ ] Check for unused variables
- [ ] Ensure comments are helpful and accurate
- [ ] Verify navigation to /analytics works from sidebar

**How to test:**
- Run `npm run build` in both backend and frontend
- Fix any TypeScript errors
- Test the complete feature end-to-end
- Verify existing features still work

---

## Implementation Notes

- Follow the master prompt's workflow for each step
- Update progress.md after completing each step
- Wait for approval before moving to next step
- Test thoroughly at each step
- Ask questions if anything is unclear
