/**
 * Health Score Card
 * Displays financial health score and breakdown.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useHealthAnalytics } from '@/hooks/useAnalytics';

const HealthScoreCard: React.FC = () => {
  const { data, isLoading, error } = useHealthAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <div className="animate-pulse">
            <div className="h-8 w-32 rounded bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load health score</p>
        </CardContent>
      </Card>
    );
  }

  const healthScore = data?.healthScore;

  if (!healthScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Insufficient data for health score
          </p>
        </CardContent>
      </Card>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-600';
      case 'B':
        return 'text-blue-600';
      case 'C':
        return 'text-yellow-600';
      case 'D':
        return 'text-orange-600';
      case 'F':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getScorePercentage = (score: number, maxScore: number) => {
    return ((score / maxScore) * 100).toFixed(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health</CardTitle>
        <p className="text-sm text-muted-foreground">
          Overall financial wellness assessment
        </p>
      </CardHeader>
      <CardContent>
        {/* Main Score */}
        <div className="mb-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
          <div className={`text-6xl font-bold ${getGradeColor(healthScore.grade)}`}>
            {healthScore.grade}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Score: {healthScore.score.toFixed(0)}/100
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">Savings Rate</span>
              <span className="text-sm text-muted-foreground">
                {getScorePercentage(
                  healthScore.breakdown.savingsRate.score,
                  healthScore.breakdown.savingsRate.maxScore
                )}
                %
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{
                  width: `${getScorePercentage(
                    healthScore.breakdown.savingsRate.score,
                    healthScore.breakdown.savingsRate.maxScore
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {healthScore.breakdown.savingsRate.value}
            </p>
          </div>

          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">Debt Ratio</span>
              <span className="text-sm text-muted-foreground">
                {getScorePercentage(
                  healthScore.breakdown.debtRatio.score,
                  healthScore.breakdown.debtRatio.maxScore
                )}
                %
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${getScorePercentage(
                    healthScore.breakdown.debtRatio.score,
                    healthScore.breakdown.debtRatio.maxScore
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {healthScore.breakdown.debtRatio.value}
            </p>
          </div>

          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">Spending Habits</span>
              <span className="text-sm text-muted-foreground">
                {getScorePercentage(
                  healthScore.breakdown.spendingHabits.score,
                  healthScore.breakdown.spendingHabits.maxScore
                )}
                %
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{
                  width: `${getScorePercentage(
                    healthScore.breakdown.spendingHabits.score,
                    healthScore.breakdown.spendingHabits.maxScore
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {healthScore.breakdown.spendingHabits.value}
            </p>
          </div>

          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">Income Stability</span>
              <span className="text-sm text-muted-foreground">
                {getScorePercentage(
                  healthScore.breakdown.incomeStability.score,
                  healthScore.breakdown.incomeStability.maxScore
                )}
                %
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{
                  width: `${getScorePercentage(
                    healthScore.breakdown.incomeStability.score,
                    healthScore.breakdown.incomeStability.maxScore
                  )}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {healthScore.breakdown.incomeStability.value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthScoreCard;
