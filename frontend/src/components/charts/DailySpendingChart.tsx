/**
 * Daily Spending Chart
 * Displays daily spending breakdown for the current month.
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{data.date}</p>
        <p style={{ color: payload[0].color }} className="text-sm">
          {currencySymbol}
          {data.spending.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const DailySpendingChart: React.FC = () => {
  const { data, isLoading, error } = useSpendingAnalytics();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending Pattern</CardTitle>
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
          <CardTitle>Daily Spending Pattern</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load spending data</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate daily spending from highest expenses
  const expenses = data?.analysis.highestExpenses || [];

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending Pattern</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            No spending data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by date and sum
  const spendingByDate: Record<string, number> = {};
  expenses.forEach((exp) => {
    const dateStr = new Date(exp.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    spendingByDate[dateStr] = (spendingByDate[dateStr] || 0) + exp.amount;
  });

  const chartData = Object.entries(spendingByDate)
    .map(([date, spending]) => ({
      date,
      spending,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const currencySymbol = user?.preferredCurrency || 'USD';
  const currencySymbolChar = formatCurrencyFromUser(0, currencySymbol).slice(0, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spending Pattern</CardTitle>
        <p className="text-sm text-muted-foreground">
          Spending distribution throughout the month
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              content={
                <CustomTooltip
                  currencySymbol={currencySymbolChar}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="spending"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorSpending)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DailySpendingChart;
