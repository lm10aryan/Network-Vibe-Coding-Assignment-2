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
