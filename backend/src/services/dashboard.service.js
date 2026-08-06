/**
 * Dashboard Service
 *
 * Calculates all dashboard values dynamically by querying existing models.
 * Nothing is stored. Every response is computed fresh on each request.
 *
 * Data sources:
 *   Transaction model — income, expenses, categories, merchants
 *   Loan model        — active loans, EMI totals, liabilities
 *   Asset model       — total asset value, net worth
 */

import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import Loan from "../models/loan.model.js";
import Asset from "../models/asset.model.js";
import { LOAN_STATUS, HEALTH_SCORE_GRADES } from "../constants/index.js";
import { generateInsights } from "../utils/insights.engine.js";

const { Types } = mongoose;

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/** Returns the first and last millisecond of a given month. */
const monthBounds = (year, month) => ({
  start: new Date(year, month, 1),
  end:   new Date(year, month + 1, 0, 23, 59, 59, 999),
});

/** Rounds a number to 2 decimal places. */
const r2 = (n) => Math.round(n * 100) / 100;

// ─── Shared Aggregation Helpers ───────────────────────────────────────────────

/**
 * Sums income and expenses for a user within a date range.
 * Returns { income, expenses }.
 */
const sumIncomeExpenses = async (userId, start, end) => {
  const result = await Transaction.aggregate([
    {
      $match: {
        user: new Types.ObjectId(userId),
        isDeleted: false,
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const income   = result.find((r) => r._id === "Credit")?.total ?? 0;
  const expenses = result.find((r) => r._id === "Debit")?.total ?? 0;
  return { income: r2(income), expenses: r2(expenses) };
};

// ─── Overview ─────────────────────────────────────────────────────────────────

/**
 * Dashboard overview — all key figures in one call.
 * Uses Promise.all so all independent queries run concurrently.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getOverview = async (userId) => {
  const now   = new Date();
  const { start, end } = monthBounds(now.getFullYear(), now.getMonth());

  const [
    monthlyTotals,
    recentTransactions,
    topCategories,
    loans,
    assets,
  ] = await Promise.all([
    // Income and expenses for current month
    sumIncomeExpenses(userId, start, end),

    // Latest 10 transactions
    Transaction.find({ user: userId, isDeleted: false })
      .sort({ date: -1 })
      .limit(10)
      .lean(),

    // Top 5 spending categories this month
    Transaction.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          isDeleted: false,
          type: "Debit",
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),

    // Active loans
    Loan.find({ user: userId, loanStatus: LOAN_STATUS.ACTIVE }).lean(),

    // All assets
    Asset.find({ user: userId }).lean(),
  ]);

  const totalAssets      = r2(assets.reduce((s, a) => s + a.currentValue, 0));
  const totalLiabilities = r2(loans.reduce((s, l) => s + l.outstandingBalance, 0));
  const monthlyEmi       = r2(loans.reduce((s, l) => s + l.emiAmount, 0));

  return {
    totalIncome:   monthlyTotals.income,
    totalExpenses: monthlyTotals.expenses,
    netBalance:    r2(monthlyTotals.income - monthlyTotals.expenses),
    netWorth: {
      totalAssets,
      totalLiabilities,
      netWorth: r2(totalAssets - totalLiabilities),
    },
    activeLoans:   loans.length,
    monthlyEmi,
    recentTransactions: recentTransactions.map((t) => ({
      _id:      t._id,
      date:     t.date,
      amount:   t.amount,
      type:     t.type,
      merchant: t.merchant,
      category: t.category,
    })),
    topSpendingCategories: topCategories,
  };
};

// ─── Spending Analysis ────────────────────────────────────────────────────────

/**
 * Category breakdown, monthly trends, top merchants, and extreme transactions.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getSpendingAnalysis = async (userId) => {
  const now   = new Date();
  const { start: curStart, end: curEnd } = monthBounds(now.getFullYear(), now.getMonth());
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { start: prevStart, end: prevEnd } = monthBounds(prevMonth.getFullYear(), prevMonth.getMonth());

  const uid = new Types.ObjectId(userId);
  const baseMatch = { user: uid, isDeleted: false };

  const [
    byCategory,
    prevByCategory,
    monthlyTrend,
    incomeVsExpense,
    topMerchants,
    highestExpenses,
    highestIncome,
  ] = await Promise.all([
    // Category-wise spending — current month
    Transaction.aggregate([
      { $match: { ...baseMatch, type: "Debit", date: { $gte: curStart, $lte: curEnd } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),

    // Category-wise spending — previous month (for comparison)
    Transaction.aggregate([
      { $match: { ...baseMatch, type: "Debit", date: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),

    // Monthly spending trend — last 6 months
    Transaction.aggregate([
      {
        $match: {
          ...baseMatch,
          type: "Debit",
          date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Income vs expense — current month
    Transaction.aggregate([
      { $match: { ...baseMatch, date: { $gte: curStart, $lte: curEnd } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),

    // Top 5 merchants by transaction count — current month
    Transaction.aggregate([
      { $match: { ...baseMatch, type: "Debit", date: { $gte: curStart, $lte: curEnd } } },
      { $group: { _id: "$merchant", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),

    // Top 5 highest individual expense transactions — current month
    Transaction.find({ user: userId, isDeleted: false, type: "Debit", date: { $gte: curStart, $lte: curEnd } })
      .sort({ amount: -1 })
      .limit(5)
      .select("date amount merchant category")
      .lean(),

    // Top 5 highest individual income transactions — current month
    Transaction.find({ user: userId, isDeleted: false, type: "Credit", date: { $gte: curStart, $lte: curEnd } })
      .sort({ amount: -1 })
      .limit(5)
      .select("date amount merchant category")
      .lean(),
  ]);

  // Build category comparison (current vs previous month)
  const prevMap = Object.fromEntries(prevByCategory.map((c) => [c._id, c.total]));
  const categoryComparison = byCategory.map((c) => {
    const prev          = prevMap[c._id] ?? 0;
    const change        = c.total - prev;
    const changePercent = prev > 0 ? Math.round((change / prev) * 100) : 100;
    return {
      category:      c._id,
      currentAmount: r2(c.total),
      previousAmount: r2(prev),
      change:        r2(change),
      changePercent,
    };
  });

  const incomeTotal   = incomeVsExpense.find((r) => r._id === "Credit")?.total ?? 0;
  const expenseTotal  = incomeVsExpense.find((r) => r._id === "Debit")?.total   ?? 0;

  return {
    byCategory: byCategory.map((c) => ({ ...c, total: r2(c.total) })),
    categoryComparison,
    monthlyTrend: monthlyTrend.map((m) => ({
      year:  m._id.year,
      month: m._id.month,
      total: r2(m.total),
    })),
    incomeVsExpense: {
      income:   r2(incomeTotal),
      expenses: r2(expenseTotal),
      savings:  r2(incomeTotal - expenseTotal),
    },
    topMerchants,
    highestExpenses,
    highestIncome,
  };
};

// ─── Monthly Comparison ───────────────────────────────────────────────────────

/**
 * Compares current month vs previous month across income, expenses, savings.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getMonthlyComparison = async (userId) => {
  const now       = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const { start: curStart,  end: curEnd  } = monthBounds(now.getFullYear(), now.getMonth());
  const { start: prevStart, end: prevEnd } = monthBounds(prevMonth.getFullYear(), prevMonth.getMonth());

  const [current, previous] = await Promise.all([
    sumIncomeExpenses(userId, curStart,  curEnd),
    sumIncomeExpenses(userId, prevStart, prevEnd),
  ]);

  const pct = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const currSavings = r2(current.income  - current.expenses);
  const prevSavings = r2(previous.income - previous.expenses);

  return {
    currentMonth: {
      label:    `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`,
      income:   current.income,
      expenses: current.expenses,
      savings:  currSavings,
    },
    previousMonth: {
      label:    `${prevMonth.toLocaleString("default", { month: "long" })} ${prevMonth.getFullYear()}`,
      income:   previous.income,
      expenses: previous.expenses,
      savings:  prevSavings,
    },
    comparison: {
      incomeDiff:          r2(current.income   - previous.income),
      incomeChangePercent: pct(current.income,   previous.income),
      expenseDiff:         r2(current.expenses  - previous.expenses),
      expenseChangePercent: pct(current.expenses, previous.expenses),
      savingsDiff:         r2(currSavings       - prevSavings),
      savingsChangePercent: pct(currSavings,      prevSavings),
    },
  };
};

// ─── Financial Health Score ───────────────────────────────────────────────────

/**
 * Calculates a 0–100 financial health score.
 *
 * Weights:
 *   Savings Rate    40 pts — savings as % of income
 *   Debt Ratio      30 pts — liabilities vs total assets
 *   Spending Habits 20 pts — consistency of month-over-month spending
 *   Income Stability 10 pts — whether income was recorded at all
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getHealthScore = async (userId) => {
  const now       = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const { start: curStart,  end: curEnd  } = monthBounds(now.getFullYear(), now.getMonth());
  const { start: prevStart, end: prevEnd } = monthBounds(prevMonth.getFullYear(), prevMonth.getMonth());

  const [current, previous, loans, assets] = await Promise.all([
    sumIncomeExpenses(userId, curStart,  curEnd),
    sumIncomeExpenses(userId, prevStart, prevEnd),
    Loan.find({ user: userId, loanStatus: LOAN_STATUS.ACTIVE }).lean(),
    Asset.find({ user: userId }).lean(),
  ]);

  // ── Savings Rate (40 pts) ─────────────────────────────────────────────────
  // Full 40 pts at ≥20% savings rate. Scales linearly below that.
  const savingsRate    = current.income > 0
    ? (current.income - current.expenses) / current.income
    : 0;
  const savingsScore   = Math.min(40, Math.max(0, Math.round(savingsRate * 200)));

  // ── Debt Ratio (30 pts) ───────────────────────────────────────────────────
  // Full 30 pts when liabilities = 0. 0 pts when liabilities ≥ total assets.
  const totalAssets      = assets.reduce((s, a) => s + a.currentValue, 0);
  const totalLiabilities = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const debtRatio        = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  const debtScore        = Math.round(Math.max(0, 30 - debtRatio * 30));

  // ── Spending Habits (20 pts) ──────────────────────────────────────────────
  // Full 20 pts when expenses did not increase month-over-month.
  // Linearly penalised up to 50% increase.
  const spendingIncrease = previous.expenses > 0
    ? (current.expenses - previous.expenses) / previous.expenses
    : 0;
  const spendingScore    = spendingIncrease <= 0
    ? 20
    : Math.max(0, Math.round(20 - spendingIncrease * 40));

  // ── Income Stability (10 pts) ─────────────────────────────────────────────
  // Full 10 pts when income recorded this month and last month.
  const incomeScore = current.income > 0 && previous.income > 0 ? 10
    : current.income > 0 ? 5
    : 0;

  const totalScore = savingsScore + debtScore + spendingScore + incomeScore;

  // Determine grade from constants
  const { grade } = HEALTH_SCORE_GRADES.find((g) => totalScore >= g.min);

  return {
    score: totalScore,
    grade,
    breakdown: {
      savingsRate:    { score: savingsScore,   maxScore: 40, value: `${Math.round(savingsRate * 100)}%` },
      debtRatio:      { score: debtScore,      maxScore: 30, value: `${Math.round(debtRatio * 100)}%` },
      spendingHabits: { score: spendingScore,  maxScore: 20, value: spendingIncrease <= 0 ? "Stable" : `+${Math.round(spendingIncrease * 100)}%` },
      incomeStability:{ score: incomeScore,    maxScore: 10, value: current.income > 0 ? "Income recorded" : "No income" },
    },
  };
};

// ─── Insights ─────────────────────────────────────────────────────────────────

/**
 * Generates rule-based natural-language insights.
 * Reuses already-calculated overview, spending, and monthly data.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getInsights = async (userId) => {
  // Run all three data fetches in parallel
  const [overview, spending, monthly] = await Promise.all([
    getOverview(userId),
    getSpendingAnalysis(userId),
    getMonthlyComparison(userId),
  ]);

  const insights = generateInsights({ overview, spending, monthly });

  return {
    insights,
    generatedAt: new Date().toISOString(),
    count: insights.length,
  };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const dashboardService = {
  getOverview,
  getSpendingAnalysis,
  getMonthlyComparison,
  getHealthScore,
  getInsights,
};
