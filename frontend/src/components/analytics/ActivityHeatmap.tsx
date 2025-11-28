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
