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
