/**
 * Yearly Summary Card
 * Displays year-to-date financial summary.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMonthlyAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyFromUser } from '@/utils/currency';

const YearlySummaryCard: React.FC = () => {
  const { data, isLoading, error } = useMonthlyAnalytics();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Year-to-Date Summary</CardTitle>
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
          <CardTitle>Year-to-Date Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive">Failed to load summary data</p>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = data?.comparison.currentMonth;
  const previousMonth = data?.comparison.previousMonth;
  const comparison = data?.comparison.comparison;

  if (!currentMonth || !previousMonth || !comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Year-to-Date Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Insufficient data for summary
          </p>
        </CardContent>
      </Card>
    );
  }

  const currencySymbol = user?.preferredCurrency || 'USD';
  const currencySymbolChar = formatCurrencyFromUser(0, currencySymbol).slice(0, 1);

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-red-600'; // Increase in expenses is bad
    return 'text-green-600';
  };

  const getChangeArrow = (value: number) => {
    if (value > 0) return '↑';
    return '↓';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year-to-Date Summary</CardTitle>
        <p className="text-sm text-muted-foreground">
          {previousMonth.label} vs {currentMonth.label}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Income */}
          <div className="rounded-lg border border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium">Total Income</h3>
              <span className={`text-sm font-semibold ${getChangeColor(comparison.incomeDiff)}`}>
                {getChangeArrow(comparison.incomeDiff)} {Math.abs(comparison.incomeChangePercent)}%
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Last Month</p>
                <p className="text-lg font-semibold">
                  {currencySymbolChar}
                  {previousMonth.income.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-semibold">
                  {currencySymbolChar}
                  {currentMonth.income.toFixed(2)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Change</p>
                <p className={`text-lg font-semibold ${getChangeColor(-comparison.incomeDiff)}`}>
                  {currencySymbolChar}
                  {comparison.incomeDiff.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="rounded-lg border border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium">Total Expenses</h3>
              <span className={`text-sm font-semibold ${getChangeColor(comparison.expenseDiff)}`}>
                {getChangeArrow(comparison.expenseDiff)} {Math.abs(comparison.expenseChangePercent)}%
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Last Month</p>
                <p className="text-lg font-semibold">
                  {currencySymbolChar}
                  {previousMonth.expenses.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-semibold">
                  {currencySymbolChar}
                  {currentMonth.expenses.toFixed(2)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Change</p>
                <p className={`text-lg font-semibold ${getChangeColor(comparison.expenseDiff)}`}>
                  {currencySymbolChar}
                  {comparison.expenseDiff.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Savings */}
          <div className="rounded-lg border border-border bg-blue-50 p-4 dark:bg-blue-950/30">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium">Net Savings</h3>
              <span
                className={`text-sm font-semibold ${
                  comparison.savingsDiff > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison.savingsDiff > 0 ? '↑' : '↓'} {Math.abs(comparison.savingsChangePercent)}%
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Last Month</p>
                <p className="text-lg font-semibold">
                  {currencySymbolChar}
                  {previousMonth.savings.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-semibold">
                  {currencySymbolChar}
                  {currentMonth.savings.toFixed(2)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Change</p>
                <p
                  className={`text-lg font-semibold ${
                    comparison.savingsDiff > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {currencySymbolChar}
                  {comparison.savingsDiff.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default YearlySummaryCard;
