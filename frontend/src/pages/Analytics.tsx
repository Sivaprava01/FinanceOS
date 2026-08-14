/**
 * Analytics Page
 * Main analytics dashboard with comprehensive financial insights.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ExpenseCategoryChart from '@/components/charts/ExpenseCategoryChart';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import CashFlowChart from '@/components/charts/CashFlowChart';
import HealthScoreCard from '@/components/charts/HealthScoreCard';
import IncomeSourcesChart from '@/components/charts/IncomeSourcesChart';
import DailySpendingChart from '@/components/charts/DailySpendingChart';
import CategoryTrendsChart from '@/components/charts/CategoryTrendsChart';
import TopMerchantsChart from '@/components/charts/TopMerchantsChart';
import YearlySummaryCard from '@/components/charts/YearlySummaryCard';
import { useInsightsAnalytics } from '@/hooks/useAnalytics';

const Analytics: React.FC = () => {
  const { data: insightsData } = useInsightsAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Comprehensive insights into your financial health and spending patterns
        </p>
      </div>

      {/* Key Insights Section */}
      {insightsData && insightsData.insights && insightsData.insights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insightsData.insights.slice(0, 3).map((insight, idx) => (
            <Card
              key={idx}
              className={
                insight.severity === 'warning'
                  ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30'
                  : insight.severity === 'success'
                    ? 'border-green-500/50 bg-green-50 dark:bg-green-950/30'
                    : ''
              }
            >
              <CardContent className="pt-6">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{insight.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Financial Overview Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Financial Overview</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <YearlySummaryCard />
          <HealthScoreCard />
        </div>
      </div>

      {/* Income Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Income Analytics</h2>
        <IncomeSourcesChart />
      </div>

      {/* Expense Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Expense Analytics</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <DailySpendingChart />
          <MonthlyTrendChart />
        </div>
      </div>

      {/* Category Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Category Analytics</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseCategoryChart />
          <CategoryTrendsChart />
        </div>
      </div>

      {/* Cash Flow Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cash Flow</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <CashFlowChart />
          <TopMerchantsChart />
        </div>
      </div>

      {/* Additional Insights */}
      {insightsData && insightsData.insights && insightsData.insights.length > 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insightsData.insights.slice(3).map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-lg border border-border p-4"
                >
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">{insight.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {insight.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
