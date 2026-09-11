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

import Transaction from "../models/transaction.model.js";
import Loan from "../models/loan.model.js";
import Asset from "../models/asset.model.js";
import { LOAN_STATUS, HEALTH_SCORE_GRADES } from "../constants/index.js";
import { generateInsights } from "../utils/insights.engine.js";

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/** Returns timezone-robust bounds for a given month covering UTC and local timestamps. */
const monthBounds = (year, month) => {
  const localStart = new Date(year, month, 1, 0, 0, 0, 0);
  const utcStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const start = localStart < utcStart ? localStart : utcStart;

  const localEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const utcEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  const end = localEnd > utcEnd ? localEnd : utcEnd;

  return { start, end };
};

/** Rounds a number to 2 decimal places. */
const r2 = (n) => Math.round(n * 100) / 100;

// ─── Shared Aggregation Helpers ───────────────────────────────────────────────

import User from "../models/user.model.js";
import { convertCurrency } from "../utils/currency.js";

/** Returns user target currency */
const getUserTargetCurrency = async (userId) => {
  const user = await User.findById(userId).select("preferredCurrency").lean();
  return user?.preferredCurrency || "USD";
};

/** Helper to convert transaction amount to user preferred currency */
const getConvertedAmount = async (amount, fromCurrency, targetCurrency) => {
  if (!fromCurrency || fromCurrency.toUpperCase() === targetCurrency.toUpperCase()) {
    return amount;
  }
  try {
    const res = await convertCurrency(amount, fromCurrency, targetCurrency);
    return res.converted;
  } catch (err) {
    console.warn(`[Currency Warning] Failed to convert ${fromCurrency} to ${targetCurrency}: ${err.message}`);
    return 0;
  }
};

export const DB_INCOME_TYPES = ["income", "Credit", "Income", "credit"];
export const DB_EXPENSE_TYPES = ["expense", "Debit", "Expense", "debit"];
export const DB_ASSET_TYPES = ["asset", "Asset"];
export const DB_LIABILITY_TYPES = ["liability", "Liability"];

const isIncomeType = (type) => {
  if (!type) return false;
  const t = String(type).toLowerCase().trim();
  return t === "income" || t === "credit";
};

const isExpenseType = (type) => {
  if (!type) return false;
  const t = String(type).toLowerCase().trim();
  return t === "expense" || t === "debit";
};

/**
 * Sums income and expenses for a user within a date range with currency conversion.
 * Returns { income, expenses }.
 */
const sumIncomeExpenses = async (userId, start, end) => {
  const targetCurrency = await getUserTargetCurrency(userId);
  const transactions = await Transaction.find({
    user: userId,
    isDeleted: false,
    date: { $gte: start, $lte: end },
  }).select("amount type currency").lean();

  let income = 0;
  let expenses = 0;

  for (const tx of transactions) {
    const converted = await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
    if (isIncomeType(tx.type)) {
      income += converted;
    } else if (isExpenseType(tx.type)) {
      expenses += converted;
    }
  }

  return { income: r2(income), expenses: r2(expenses), currency: targetCurrency };
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
  const targetCurrency = await getUserTargetCurrency(userId);
  const now = new Date();
  const { start, end } = monthBounds(now.getFullYear(), now.getMonth());

  const [
    monthlyTotals,
    recentTransactions,
    rawTopCategoryTx,
    loans,
    assets,
    assetTxs,
    liabilityTxs,
  ] = await Promise.all([
    // Income and expenses for current month
    sumIncomeExpenses(userId, start, end),

    // Latest 10 transactions
    Transaction.find({ user: userId, isDeleted: false }).sort({ date: -1 }).limit(10).lean(),

    // Top spending categories this month
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_EXPENSE_TYPES },
      date: { $gte: start, $lte: end },
    }).select("amount currency category").lean(),

    // Active loans
    Loan.find({ user: userId, loanStatus: LOAN_STATUS.ACTIVE }).lean(),

    // All assets
    Asset.find({ user: userId }).lean(),

    // All asset transactions
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_ASSET_TYPES },
    }).select("amount currency").lean(),

    // All liability transactions
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_LIABILITY_TYPES },
    }).select("amount currency").lean(),
  ]);

  // Aggregate top spending categories with currency conversion
  const categoryMap = {};
  for (const tx of rawTopCategoryTx) {
    const converted = await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
    const cat = tx.category || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] || 0) + converted;
  }

  const topSpendingCategories = Object.entries(categoryMap)
    .map(([_id, total]) => ({ _id, total: r2(total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  let assetTxTotal = 0;
  for (const tx of assetTxs) {
    assetTxTotal += await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
  }

  let liabilityTxTotal = 0;
  for (const tx of liabilityTxs) {
    liabilityTxTotal += await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
  }

  const totalAssets = r2(assets.reduce((s, a) => s + a.currentValue, 0) + assetTxTotal);
  const totalLiabilities = r2(loans.reduce((s, l) => s + l.outstandingBalance, 0) + liabilityTxTotal);
  const monthlyEmi = r2(loans.reduce((s, l) => s + l.emiAmount, 0));

  return {
    totalIncome: monthlyTotals.income,
    totalExpenses: monthlyTotals.expenses,
    netBalance: r2(monthlyTotals.income - monthlyTotals.expenses),
    currency: targetCurrency,
    netWorth: {
      totalAssets,
      totalLiabilities,
      netWorth: r2(totalAssets - totalLiabilities),
    },
    activeLoans: loans.length,
    monthlyEmi,
    recentTransactions: recentTransactions.map((t) => ({
      _id: t._id,
      date: t.date,
      amount: t.amount,
      currency: t.currency || targetCurrency,
      type: t.type,
      ...(t.paymentMethod ? { paymentMethod: t.paymentMethod } : {}),
      merchant: t.merchant,
      category: t.category,
      source: t.source,
    })),
    topSpendingCategories,
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
  const targetCurrency = await getUserTargetCurrency(userId);
  const now = new Date();
  const { start: curStart, end: curEnd } = monthBounds(now.getFullYear(), now.getMonth());
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { start: prevStart, end: prevEnd } = monthBounds(
    prevMonth.getFullYear(),
    prevMonth.getMonth()
  );

  const [
    curTx,
    prevTx,
    trendTx,
    highestExpenses,
    highestIncome,
  ] = await Promise.all([
    // Current month transactions (all types)
    Transaction.find({
      user: userId,
      isDeleted: false,
      date: { $gte: curStart, $lte: curEnd },
    }).select("amount type currency category merchant date").lean(),

    // Previous month debit/expense transactions
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_EXPENSE_TYPES },
      date: { $gte: prevStart, $lte: prevEnd },
    }).select("amount currency category").lean(),

    // 6-month trend debit/expense transactions
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_EXPENSE_TYPES },
      date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
    }).select("amount currency date").lean(),

    // Top 5 highest individual expense transactions — current month
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_EXPENSE_TYPES },
      date: { $gte: curStart, $lte: curEnd },
    })
      .sort({ amount: -1 })
      .limit(5)
      .select("date amount currency merchant category paymentMethod")
      .lean(),

    // Top 5 highest individual income transactions — current month
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_INCOME_TYPES },
      date: { $gte: curStart, $lte: curEnd },
    })
      .sort({ amount: -1 })
      .limit(5)
      .select("date amount currency merchant category")
      .lean(),
  ]);

  // Convert and aggregate by category (current month)
  const catMap = {};
  const catCount = {};
  let incomeTotal = 0;
  let expenseTotal = 0;
  const merchantMap = {};
  const merchantCount = {};

  for (const tx of curTx) {
    const converted = await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
    if (isExpenseType(tx.type)) {
      expenseTotal += converted;
      const cat = tx.category || "Uncategorized";
      catMap[cat] = (catMap[cat] || 0) + converted;
      catCount[cat] = (catCount[cat] || 0) + 1;

      const m = tx.merchant || "Unknown";
      merchantMap[m] = (merchantMap[m] || 0) + converted;
      merchantCount[m] = (merchantCount[m] || 0) + 1;
    } else if (isIncomeType(tx.type)) {
      incomeTotal += converted;
    }
  }

  const byCategory = Object.entries(catMap)
    .map(([_id, total]) => ({ _id, total: r2(total), count: catCount[_id] }))
    .sort((a, b) => b.total - a.total);

  // Convert and aggregate by category (previous month)
  const prevCatMap = {};
  for (const tx of prevTx) {
    const converted = await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
    const cat = tx.category || "Uncategorized";
    prevCatMap[cat] = (prevCatMap[cat] || 0) + converted;
  }

  const categoryComparison = byCategory.map((c) => {
    const prev = prevCatMap[c._id] ?? 0;
    const change = c.total - prev;
    const changePercent = prev > 0 ? Math.round((change / prev) * 100) : 100;
    return {
      category: c._id,
      currentAmount: r2(c.total),
      previousAmount: r2(prev),
      change: r2(change),
      changePercent,
    };
  });

  // Convert and aggregate monthly trend (last 6 months)
  const trendMap = {};
  for (const tx of trendTx) {
    const converted = await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!trendMap[key]) {
      trendMap[key] = { year: d.getFullYear(), month: d.getMonth() + 1, total: 0 };
    }
    trendMap[key].total += converted;
  }

  const monthlyTrend = Object.values(trendMap)
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((m) => ({ year: m.year, month: m.month, total: r2(m.total) }));

  const topMerchants = Object.entries(merchantMap)
    .map(([_id, total]) => ({ _id, total: r2(total), count: merchantCount[_id] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    currency: targetCurrency,
    byCategory,
    categoryComparison,
    monthlyTrend,
    incomeVsExpense: {
      income: r2(incomeTotal),
      expenses: r2(expenseTotal),
      savings: r2(incomeTotal - expenseTotal),
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
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const { start: curStart, end: curEnd } = monthBounds(now.getFullYear(), now.getMonth());
  const { start: prevStart, end: prevEnd } = monthBounds(
    prevMonth.getFullYear(),
    prevMonth.getMonth()
  );

  const [current, previous] = await Promise.all([
    sumIncomeExpenses(userId, curStart, curEnd),
    sumIncomeExpenses(userId, prevStart, prevEnd),
  ]);

  const pct = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const currSavings = r2(current.income - current.expenses);
  const prevSavings = r2(previous.income - previous.expenses);

  return {
    currentMonth: {
      label: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`,
      income: current.income,
      expenses: current.expenses,
      savings: currSavings,
    },
    previousMonth: {
      label: `${prevMonth.toLocaleString("default", { month: "long" })} ${prevMonth.getFullYear()}`,
      income: previous.income,
      expenses: previous.expenses,
      savings: prevSavings,
    },
    comparison: {
      incomeDiff: r2(current.income - previous.income),
      incomeChangePercent: pct(current.income, previous.income),
      expenseDiff: r2(current.expenses - previous.expenses),
      expenseChangePercent: pct(current.expenses, previous.expenses),
      savingsDiff: r2(currSavings - prevSavings),
      savingsChangePercent: pct(currSavings, prevSavings),
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
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const { start: curStart, end: curEnd } = monthBounds(now.getFullYear(), now.getMonth());
  const { start: prevStart, end: prevEnd } = monthBounds(
    prevMonth.getFullYear(),
    prevMonth.getMonth()
  );

  const targetCurrency = await getUserTargetCurrency(userId);
  const [current, previous, loans, assets, assetTxs, liabilityTxs] = await Promise.all([
    sumIncomeExpenses(userId, curStart, curEnd),
    sumIncomeExpenses(userId, prevStart, prevEnd),
    Loan.find({ user: userId, loanStatus: LOAN_STATUS.ACTIVE }).lean(),
    Asset.find({ user: userId }).lean(),
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_ASSET_TYPES },
    }).select("amount currency").lean(),
    Transaction.find({
      user: userId,
      isDeleted: false,
      type: { $in: DB_LIABILITY_TYPES },
    }).select("amount currency").lean(),
  ]);

  let assetTxTotal = 0;
  for (const tx of assetTxs) {
    assetTxTotal += await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
  }

  let liabilityTxTotal = 0;
  for (const tx of liabilityTxs) {
    liabilityTxTotal += await getConvertedAmount(tx.amount, tx.currency, targetCurrency);
  }

  // ── Savings Rate (40 pts) ─────────────────────────────────────────────────
  // Full 40 pts at ≥20% savings rate. Scales linearly below that.
  const savingsRate = current.income > 0 ? (current.income - current.expenses) / current.income : 0;
  const savingsScore = Math.min(40, Math.max(0, Math.round(savingsRate * 200)));

  // ── Debt Ratio (30 pts) ───────────────────────────────────────────────────
  // Full 30 pts when liabilities = 0. 0 pts when liabilities ≥ total assets.
  const totalAssets = assets.reduce((s, a) => s + a.currentValue, 0) + assetTxTotal;
  const totalLiabilities = loans.reduce((s, l) => s + l.outstandingBalance, 0) + liabilityTxTotal;
  const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  const debtScore = Math.round(Math.max(0, 30 - debtRatio * 30));

  // ── Spending Habits (20 pts) ──────────────────────────────────────────────
  // Full 20 pts when expenses did not increase month-over-month.
  // Linearly penalised up to 50% increase.
  const spendingIncrease =
    previous.expenses > 0 ? (current.expenses - previous.expenses) / previous.expenses : 0;
  const spendingScore =
    spendingIncrease <= 0 ? 20 : Math.max(0, Math.round(20 - spendingIncrease * 40));

  // ── Income Stability (10 pts) ─────────────────────────────────────────────
  // Full 10 pts when income recorded this month and last month.
  const incomeScore = current.income > 0 && previous.income > 0 ? 10 : current.income > 0 ? 5 : 0;

  const totalScore = savingsScore + debtScore + spendingScore + incomeScore;

  // Determine grade from constants
  const { grade } = HEALTH_SCORE_GRADES.find((g) => totalScore >= g.min);

  return {
    score: totalScore,
    grade,
    breakdown: {
      savingsRate: {
        score: savingsScore,
        maxScore: 40,
        value: `${Math.round(savingsRate * 100)}%`,
      },
      debtRatio: { score: debtScore, maxScore: 30, value: `${Math.round(debtRatio * 100)}%` },
      spendingHabits: {
        score: spendingScore,
        maxScore: 20,
        value: spendingIncrease <= 0 ? "Stable" : `+${Math.round(spendingIncrease * 100)}%`,
      },
      incomeStability: {
        score: incomeScore,
        maxScore: 10,
        value: current.income > 0 ? "Income recorded" : "No income",
      },
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
