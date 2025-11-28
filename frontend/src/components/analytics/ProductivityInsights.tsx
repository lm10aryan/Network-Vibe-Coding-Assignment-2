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
