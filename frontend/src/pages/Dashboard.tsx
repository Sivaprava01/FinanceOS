/**
 * Dashboard Page
 * Main dashboard page with overview cards, charts, and recent transactions.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Loader } from '@components/ui/Loader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  useDashboardOverview,
  useSpendingAnalysis,
  useMonthlyComparison,
  useHealthScore,
} from '@/hooks/useDashboard';
import { formatCurrencyFromUser } from '@/utils/formatCurrency';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard: React.FC = () => {
  const { data: user } = useCurrentUser();
  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useDashboardOverview();
  const { data: spendingData, isLoading: spendingLoading } = useSpendingAnalysis();
  const { data: comparisonData, isLoading: comparisonLoading } = useMonthlyComparison();
  const { data: healthData, isLoading: healthLoading } = useHealthScore();

  const isLoading = overviewLoading || spendingLoading || comparisonLoading || healthLoading;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your financial overview</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your financial overview</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load dashboard data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overview = overviewData?.overview;
  const spending = spendingData?.analysis;
  const comparison = comparisonData?.comparison;
  const health = healthData?.healthScore;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {overview ? formatCurrencyFromUser(overview.totalIncome, user) : '$0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {overview ? formatCurrencyFromUser(overview.totalExpenses, user) : '$0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${overview && overview.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {overview ? formatCurrencyFromUser(overview.netBalance, user) : '$0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <CardDescription>Assets - Liabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${overview && overview.netWorth.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {overview ? formatCurrencyFromUser(overview.netWorth.netWorth, user) : '$0.00'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Comparison chart</CardDescription>
          </CardHeader>
          <CardContent>
            {spending && spending.incomeVsExpense ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[spending.incomeVsExpense]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" />
                  <Bar dataKey="expenses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Top categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            {spending && spending.byCategory && spending.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spending.byCategory}
                    dataKey="total"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {spending.byCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                No spending data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
            <CardDescription>Current vs previous month</CardDescription>
          </CardHeader>
          <CardContent>
            {comparison ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{comparison.currentMonth.label}</p>
                    <p className="text-sm font-medium">
                      Income: {formatCurrencyFromUser(comparison.currentMonth.income, user)}
                    </p>
                    <p className="text-sm font-medium">
                      Expenses: {formatCurrencyFromUser(comparison.currentMonth.expenses, user)}
                    </p>
                    <p className="text-sm font-medium">
                      Savings: {formatCurrencyFromUser(comparison.currentMonth.savings, user)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {comparison.previousMonth.label}
                    </p>
                    <p className="text-sm font-medium">
                      Income: {formatCurrencyFromUser(comparison.previousMonth.income, user)}
                    </p>
                    <p className="text-sm font-medium">
                      Expenses: {formatCurrencyFromUser(comparison.previousMonth.expenses, user)}
                    </p>
                    <p className="text-sm font-medium">
                      Savings: {formatCurrencyFromUser(comparison.previousMonth.savings, user)}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Change %</p>
                  <p
                    className={`text-sm ${comparison.comparison.incomeChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    Income:{' '}
                    {`${comparison.comparison.incomeChangePercent > 0 ? '+' : ''}${comparison.comparison.incomeChangePercent}%`}
                  </p>
                  <p
                    className={`text-sm ${comparison.comparison.expenseChangePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    Expenses:{' '}
                    {`${comparison.comparison.expenseChangePercent > 0 ? '+' : ''}${comparison.comparison.expenseChangePercent}%`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                No comparison data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Health Score */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>Your financial wellness rating</CardDescription>
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl font-bold">{health.score}</p>
                    <Badge className={`mt-2 ${getGradeColor(health.grade)}`}>
                      Grade {health.grade}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Savings Rate</span>
                    <span>{health.breakdown.savingsRate.value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debt Ratio</span>
                    <span>{health.breakdown.debtRatio.value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spending Habits</span>
                    <span>{health.breakdown.spendingHabits.value}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Income Stability</span>
                    <span>{health.breakdown.incomeStability.value}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                No health score data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest 10 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {overview && overview.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Merchant</th>
                    <th className="py-2 text-left">Category</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-center">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b hover:bg-muted/50">
                      <td className="py-2">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-2">{tx.merchant}</td>
                      <td className="py-2">{tx.category}</td>
                      <td
                        className={`py-2 text-right font-medium ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.type === 'Credit' ? '+' : '-'}
                        {formatCurrencyFromUser(tx.amount, user).substring(1)}
                      </td>
                      <td className="py-2 text-center">
                        <Badge variant={tx.type === 'Credit' ? 'default' : 'destructive'}>
                          {tx.type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              No transactions yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
