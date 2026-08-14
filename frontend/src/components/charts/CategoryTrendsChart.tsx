/**
 * Category Trends Chart
 * Shows comparison of top spending categories between current and previous month.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useSpendingAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyFromUser } from '@/utils/currency';

interface CustomTooltipProps extends TooltipProps<number, string> {
  currencySymbol: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  currencySymbol,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {currencySymbol}
            {entry.value?.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CategoryTrendsChart: React.FC = () => {
  const { data, isLoading, error } = useSpendingAnalytics();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
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
          <CardTitle>Category Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load category data</p>
        </CardContent>
      </Card>
    );
  }

  const categoryComparison = data?.analysis.categoryComparison || [];

  if (categoryComparison.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            No comparison data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = categoryComparison
    .slice(0, 8)
    .map((cat) => ({
      category: cat.category.substring(0, 12),
      current: cat.currentAmount,
      previous: cat.previousAmount,
    }));

  const currencySymbol = user?.preferredCurrency || 'USD';
  const currencySymbolChar = formatCurrencyFromUser(0, currencySymbol).slice(0, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Comparison</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current vs previous month spending by category
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip
              content={
                <CustomTooltip
                  currencySymbol={currencySymbolChar}
                />
              }
            />
            <Legend />
            <Bar dataKey="current" fill="#ef4444" name="This Month" radius={[8, 8, 0, 0]} />
            <Bar dataKey="previous" fill="#94a3b8" name="Last Month" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryTrendsChart;
