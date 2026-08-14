/**
 * Monthly Trend Chart
 * Displays income vs expense trends over the last 6 months.
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
import { useMonthlyAnalytics } from '@/hooks/useAnalytics';
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

const MonthlyTrendChart: React.FC = () => {
  const { data, isLoading, error } = useMonthlyAnalytics();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
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
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load trend data</p>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = data?.comparison.currentMonth;
  const previousMonth = data?.comparison.previousMonth;

  if (!currentMonth || !previousMonth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Insufficient data for comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      month: previousMonth.label,
      Income: previousMonth.income,
      Expenses: previousMonth.expenses,
    },
    {
      month: currentMonth.label,
      Income: currentMonth.income,
      Expenses: currentMonth.expenses,
    },
  ];

  const currencySymbol = user?.preferredCurrency || 'USD';
  const currencySymbolChar = formatCurrencyFromUser(0, currencySymbol).slice(0, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Income vs Expenses comparison
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              content={
                <CustomTooltip
                  currencySymbol={currencySymbolChar}
                />
              }
            />
            <Legend />
            <Bar dataKey="Income" fill="#22c55e" />
            <Bar dataKey="Expenses" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrendChart;
