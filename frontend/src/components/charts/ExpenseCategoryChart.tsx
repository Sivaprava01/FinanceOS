/**
 * Expense Category Chart
 * Displays spending breakdown by category using a pie chart.
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useSpendingAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyFromUser } from '@/utils/currency';

// Color palette for categories - 12 distinct colors
const COLORS = [
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Fuchsia
  '#64748b', // Slate
];

interface CustomTooltipProps extends TooltipProps<number, string> {
  currencySymbol: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  currencySymbol,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.value / data.total) * 100).toFixed(1);
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {currencySymbol}
          {data.value.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">{percentage}%</p>
      </div>
    );
  }
  return null;
};

const ExpenseCategoryChart: React.FC = () => {
  const { data, isLoading, error } = useSpendingAnalytics();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
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
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load spending data</p>
        </CardContent>
      </Card>
    );
  }

  const categoryData = data?.analysis.byCategory || [];

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            No spending data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for recharts
  const chartData = categoryData.map((item, index) => ({
    name: item._id || 'Uncategorized',
    value: item.total,
    total: categoryData.reduce((sum, cat) => sum + cat.total, 0),
    count: item.count,
  }));

  const currencySymbol = user?.preferredCurrency || 'USD';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={
                <CustomTooltip
                  currencySymbol={formatCurrencyFromUser(0, currencySymbol).slice(0, 1)}
                />
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ExpenseCategoryChart;
