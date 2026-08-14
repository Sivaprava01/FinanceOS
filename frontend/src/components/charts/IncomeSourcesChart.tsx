/**
 * Income Sources Chart
 * Displays top income sources and distribution.
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
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {currencySymbol}
          {data.total.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">{data.count} transaction(s)</p>
      </div>
    );
  }
  return null;
};

const IncomeSourcesChart: React.FC = () => {
  const { data, isLoading, error } = useSpendingAnalytics();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
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
          <CardTitle>Income Sources</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load income sources</p>
        </CardContent>
      </Card>
    );
  }

  const incomeData = data?.analysis.highestIncome || [];

  if (incomeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            No income data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = incomeData.map((item) => ({
    name: item.merchant || 'Unknown Source',
    total: item.amount,
    count: 1,
  }));

  const currencySymbol = user?.preferredCurrency || 'USD';
  const currencySymbolChar = formatCurrencyFromUser(0, currencySymbol).slice(0, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income Sources</CardTitle>
        <p className="text-sm text-muted-foreground">Top income transactions</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={110} />
            <Tooltip
              content={
                <CustomTooltip
                  currencySymbol={currencySymbolChar}
                />
              }
            />
            <Bar dataKey="total" fill="#22c55e" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default IncomeSourcesChart;
