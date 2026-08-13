/**
 * Insight Engine
 *
 * Rule-based natural-language insight generator.
 * Receives pre-calculated financial data objects and returns an array
 * of human-readable insight strings.
 *
 * Architecture note:
 * This module is intentionally isolated from the dashboard service so
 * it can be replaced with an LLM-backed engine in a future phase without
 * changing the service or controller. The contract is always:
 *   generateInsights(data) → string[]
 *
 * Each rule is a pure function: (data) => string | null.
 * Returning null means the rule produced no insight for this data set.
 * Null results are filtered before the array is returned to the caller.
 */

// ─── Individual Rules ─────────────────────────────────────────────────────────

/**
 * Savings trend — did savings improve or decline vs last month?
 */
const savingsTrendRule = ({ monthly }) => {
  const { currentMonth, previousMonth } = monthly;
  const currSavings = currentMonth.income - currentMonth.expenses;
  const prevSavings = previousMonth.income - previousMonth.expenses;

  if (prevSavings === 0 || currSavings === prevSavings) return null;

  const diff = currSavings - prevSavings;
  const pct = Math.abs(Math.round((diff / Math.abs(prevSavings)) * 100));
  const dir = diff > 0 ? "improved" : "declined";
  const symbol = diff > 0 ? "📈" : "📉";

  return `${symbol} Savings ${dir} by ${pct}% compared to last month.`;
};

/**
 * Expense trend — did spending increase or decrease?
 */
const expenseTrendRule = ({ monthly }) => {
  const { currentMonth, previousMonth } = monthly;
  if (previousMonth.expenses === 0) return null;

  const diff = currentMonth.expenses - previousMonth.expenses;
  const pct = Math.abs(Math.round((diff / previousMonth.expenses) * 100));
  if (pct === 0) return null;

  const dir = diff > 0 ? "increased" : "decreased";
  const symbol = diff > 0 ? "⚠️" : "✅";

  return `${symbol} Total spending ${dir} by ${pct}% compared to last month.`;
};

/**
 * Top spending category this month.
 */
const topCategoryRule = ({ spending }) => {
  if (!spending.byCategory || spending.byCategory.length === 0) return null;
  const top = spending.byCategory[0];
  return `🛒 Your highest spending category this month is ${top._id} (₹${top.total.toLocaleString("en-IN")}).`;
};

/**
 * Category spike — if one category rose >20% vs last month.
 */
const categorySpikeRule = ({ spending }) => {
  if (!spending.categoryComparison) return null;

  const spike = spending.categoryComparison.find(
    (c) => c.changePercent > 20 && c.currentAmount > 0
  );
  if (!spike) return null;

  return `⚠️ ${spike.category} spending increased by ${spike.changePercent}% compared to last month.`;
};

/**
 * Most frequent merchant this month.
 */
const frequentMerchantRule = ({ spending }) => {
  if (!spending.topMerchants || spending.topMerchants.length === 0) return null;
  const top = spending.topMerchants[0];
  return `🏪 ${top._id} is your most visited merchant this month (${top.count} transaction${top.count > 1 ? "s" : ""}).`;
};

/**
 * Largest single expense this month.
 */
const largestExpenseRule = ({ spending }) => {
  if (!spending.highestExpenses || spending.highestExpenses.length === 0) return null;
  const top = spending.highestExpenses[0];
  return `💸 Your largest expense this month was ₹${top.amount.toLocaleString("en-IN")} at ${top.merchant}.`;
};

/**
 * Loan-to-asset ratio warning.
 */
const loanToAssetRule = ({ overview }) => {
  if (!overview.netWorth || overview.netWorth.totalAssets === 0) return null;

  const ratio = Math.round(
    (overview.netWorth.totalLiabilities / overview.netWorth.totalAssets) * 100
  );
  if (ratio === 0) return null;

  const emoji = ratio > 50 ? "🔴" : ratio > 25 ? "🟡" : "🟢";
  return `${emoji} Loans currently represent ${ratio}% of your total assets.`;
};

/**
 * High EMI burden — EMI > 40% of monthly income is a warning sign.
 */
const emiBurdenRule = ({ overview }) => {
  if (!overview.monthlyEmi || !overview.totalIncome || overview.totalIncome === 0) return null;

  const ratio = Math.round((overview.monthlyEmi / overview.totalIncome) * 100);
  if (ratio < 10) return null;

  const emoji = ratio > 40 ? "🔴" : ratio > 25 ? "🟡" : "🟢";
  return `${emoji} Your monthly EMI obligations are ${ratio}% of your income this month.`;
};

/**
 * No income recorded — prompt the user to add transactions.
 */
const noIncomeRule = ({ overview }) => {
  if (overview.totalIncome > 0) return null;
  return "ℹ️ No income recorded yet. Add or import transactions to get personalised insights.";
};

/**
 * Positive net balance celebration.
 */
const positiveBalanceRule = ({ overview }) => {
  if (overview.netBalance <= 0) return null;
  const pct =
    overview.totalIncome > 0 ? Math.round((overview.netBalance / overview.totalIncome) * 100) : 0;
  if (pct < 5) return null;
  return `✅ You saved ${pct}% of your income this month. Keep it up!`;
};

// ─── Engine ───────────────────────────────────────────────────────────────────

// Ordered list of rules. Add new rules here without touching anything else.
const RULES = [
  noIncomeRule,
  positiveBalanceRule,
  savingsTrendRule,
  expenseTrendRule,
  topCategoryRule,
  categorySpikeRule,
  frequentMerchantRule,
  largestExpenseRule,
  loanToAssetRule,
  emiBurdenRule,
];

/**
 * Generates an array of natural-language insights from financial data.
 *
 * @param {{
 *   overview: object,
 *   spending: object,
 *   monthly: object
 * }} data - Pre-calculated financial data from the dashboard service
 * @returns {string[]} Array of insight strings (empty if no data available)
 */
const generateInsights = (data) => {
  return RULES.map((rule) => {
    try {
      return rule(data);
    } catch {
      // A single failing rule must never break the entire insights response
      return null;
    }
  }).filter(Boolean);
};

export { generateInsights };
