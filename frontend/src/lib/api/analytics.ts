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
