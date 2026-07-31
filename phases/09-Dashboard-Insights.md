# Phase 09 – Dashboard & Insights

## Objective

Implement the Dashboard and Financial Insights module.

This module provides users with a complete overview of their financial health by using existing financial data. No dashboard values should be permanently stored unless absolutely necessary. Everything should be calculated dynamically.

Before starting, read:

- docs/Blueprint.md
- docs/Guidelines.md
- docs/TechStack.md

---

## Functional Requirements

Implement the following functionality.

### Dashboard

Provide a financial overview including:

- Total Income
- Total Expenses
- Net Balance
- Net Worth
- Active Loans
- Monthly EMI
- Recent Transactions
- Top Spending Categories

---

### Spending Analysis

Generate:

- Category-wise Spending
- Monthly Spending Trends
- Income vs Expense
- Top Merchants
- Highest Expenses
- Highest Income Sources

---

### Monthly Comparison

Compare:

- Current Month vs Previous Month
- Spending Changes
- Income Changes
- Savings Changes

Display increases and decreases clearly.

---

### Financial Health Score

Generate a Financial Health Score based on:

- Savings Rate
- Debt Ratio
- Spending Habits
- Income Stability

The score should always be calculated dynamically.

---

### AI Insights

Implement an AI Insights module that helps users understand their finances.

Examples:

- Where did my money go?
- Which category increased the most?
- How much did I spend on food this month?
- Which merchant received the most money?
- Monthly financial summary

Do not expose raw AI implementation details to users. Present insights naturally.

---

## Business Rules

- Dashboard data should always reflect the latest transactions.
- Insights should never modify user data.
- Calculated values should not be permanently stored.
- AI should assist users, not make financial decisions for them.

---

## Security

- Users may only access their own dashboard and insights.
- Protect all APIs using authentication.

---

## Swagger

Document every endpoint with:

- Request
- Response
- Authentication
- Status Codes

---

## Deliverables

At the end of this phase:

- Dashboard APIs completed.
- Spending analysis completed.
- Monthly comparison completed.
- Financial Health Score implemented.
- AI Insights implemented.
- Swagger updated.

---

## Out of Scope

Do NOT implement:

- Family Finance
- Currency Conversion
- Settings

These will be implemented in later phases.

---

## Completion

When complete:

- Explain all dashboard calculations.
- Explain Financial Health Score calculation.
- Explain AI Insights architecture.
- Wait for approval before continuing.