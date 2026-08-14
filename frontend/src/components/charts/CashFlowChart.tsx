/**
 * Cash Flow Chart
 * Displays money in vs money out for the current month.
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
  Cell,
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
    const data = payload[0];
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{data.payload.name}</p>
        <p style={{ color: data.color }} className="text-sm">
          {currencySymbol}
          {data.value?.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const CashFlowChart: React.FC = () => {
  const { data, isLoading, error } = useSpendingAnalytics();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
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
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load cash flow data</p>
        </CardContent>
      </Card>
    );
  }

  const incomeVsExpense = data?.analysis.incomeVsExpense;

  if (!incomeVsExpense) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            No cash flow data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: 'Money In',
      value: incomeVsExpense.income,
      fill: '#22c55e',
    },
    {
      name: 'Money Out',
      value: incomeVsExpense.expenses,
      fill: '#ef4444',
    },
    {
      name: 'Net Flow',
      value: incomeVsExpense.savings,
      fill: incomeVsExpense.savings >= 0 ? '#3b82f6' : '#ec4899',
    },
  ];

  const currencySymbol = user?.preferredCurrency || 'USD';
  const currencySymbolChar = formatCurrencyFromUser(0, currencySymbol).slice(0, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current month cash flow breakdown
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              content={
                <CustomTooltip
                  currencySymbol={currencySymbolChar}
                />
              }
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">Money In</p>
            <p className="text-lg font-semibold text-green-600">
              {currencySymbolChar}
              {incomeVsExpense.income.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">Money Out</p>
            <p className="text-lg font-semibold text-red-600">
              {currencySymbolChar}
              {incomeVsExpense.expenses.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">Net Flow</p>
            <p
              className={`text-lg font-semibold ${
                incomeVsExpense.savings >= 0 ? 'text-blue-600' : 'text-pink-600'
              }`}
            >
              {currencySymbolChar}
              {incomeVsExpense.savings.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
