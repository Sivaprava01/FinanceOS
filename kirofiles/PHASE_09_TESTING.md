# Phase 09 – Dashboard & Insights: Postman Testing Guide

**Status**: Ready for Testing  
**Date**: August 5, 2026

---

## Overview

Phase 09 provides users with a complete financial overview through the Dashboard and Insights module. This guide covers testing all 5 API endpoints that deliver calculated financial data.

All endpoints are **read-only** and calculate values dynamically from existing transactions, loans, and assets.

---

## Prerequisites

1. ✅ Phase 04-06 complete (transactions imported and managed)
2. ✅ Backend running: `npm run dev`
3. ✅ MongoDB Atlas connected
4. ✅ JWT token from Phase 02 login
5. ✅ Transactions imported with various categories and types

---

## Setup: Prepare for Dashboard Tests

### Step 1: Verify Transactions Exist

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions`

**Headers**:
```
Authorization: Bearer {your_token}
```

**Response**: Should show imported transactions

**What to Verify**:
- ✅ At least 10 transactions exist
- ✅ Mix of Debit and Credit transactions
- ✅ Multiple categories assigned
- ✅ Transactions span multiple months (if possible)

**Save**: Note transaction data for later comparison

### Step 2: Note Current Date

For Monthly Comparison tests, be aware of:
- Current month: August 2026
- Previous month: July 2026
- Tests will compare these periods

---

## Test 1: Get Dashboard Overview

### Objective

Retrieve key financial figures for the current month including total income, expenses, net balance, net worth, active loans, and EMI obligations.

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/overview`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Sample Request

```bash
curl -X GET http://localhost:8000/api/v1/dashboard/overview \
  -H "Authorization: Bearer {your_token}"
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "currentMonth": "August 2026",
    "totalIncome": 10000.00,
    "totalExpenses": 5000.00,
    "netBalance": 5000.00,
    "netWorth": 75000.00,
    "activeLoans": 2,
    "totalEMI": 1500.00,
    "recentTransactions": [
      {
        "_id": "66c2a2c3d4e5f6g7h8i9j0k5",
        "date": "2026-08-05T10:00:00Z",
        "amount": 500.00,
        "type": "Debit",
        "merchant": "Amazon",
        "category": "Shopping"
      },
      {
        "_id": "66c2a2c3d4e5f6g7h8i9j0k6",
        "date": "2026-08-04T15:30:00Z",
        "amount": 5000.00,
        "type": "Credit",
        "merchant": "Employer",
        "category": "Income"
      }
    ],
    "topSpendingCategories": [
      {
        "category": "Shopping",
        "total": 2000.00,
        "percentage": 40
      },
      {
        "category": "Food",
        "total": 1500.00,
        "percentage": 30
      },
      {
        "category": "Transport",
        "total": 1000.00,
        "percentage": 20
      }
    ],
    "calculatedAt": "2026-08-05T10:30:00Z"
  }
}
```

### What to Verify

**Financial Calculations**:
- ✅ `totalIncome` = sum of all Credit transactions this month
- ✅ `totalExpenses` = sum of all Debit transactions this month
- ✅ `netBalance` = `totalIncome - totalExpenses`
- ✅ `netWorth` = calculated from assets (if none, should be 0)
- ✅ `activeLoans` = count of non-completed loans
- ✅ `totalEMI` = sum of active loan EMIs

**Data Structure**:
- ✅ `recentTransactions` shows latest 5 transactions
- ✅ `topSpendingCategories` limited to top 5
- ✅ `percentage` values sum to 100 or less

**Timestamps**:
- ✅ `calculatedAt` shows current timestamp
- ✅ All transaction dates are ISO format

---

## Test 2: Get Spending Analysis

### Objective

Retrieve detailed category-wise spending breakdown, monthly trends, top merchants, and spending distribution.

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/spending-analysis`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Sample Request

```bash
curl -X GET http://localhost:8000/api/v1/dashboard/spending-analysis \
  -H "Authorization: Bearer {your_token}"
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Spending analysis retrieved successfully",
  "data": {
    "period": "August 2026",
    "categoryBreakdown": [
      {
        "category": "Shopping",
        "total": 2000.00,
        "percentage": 40,
        "transactions": 4,
        "averageTransaction": 500.00
      },
      {
        "category": "Food",
        "total": 1500.00,
        "percentage": 30,
        "transactions": 15,
        "averageTransaction": 100.00
      },
      {
        "category": "Transport",
        "total": 1000.00,
        "percentage": 20,
        "transactions": 5,
        "averageTransaction": 200.00
      }
    ],
    "monthlyTrend": [
      {
        "month": "June 2026",
        "spending": 4500.00
      },
      {
        "month": "July 2026",
        "spending": 4800.00
      },
      {
        "month": "August 2026",
        "spending": 5000.00
      }
    ],
    "incomeVsExpense": {
      "totalIncome": 10000.00,
      "totalExpense": 5000.00,
      "savingsRate": 50.00,
      "savingsAmount": 5000.00
    },
    "topMerchants": [
      {
        "merchant": "Amazon",
        "total": 1500.00,
        "percentage": 30,
        "category": "Shopping"
      },
      {
        "merchant": "Starbucks",
        "total": 800.00,
        "percentage": 16,
        "category": "Food"
      }
    ],
    "highestExpenseTransaction": {
      "_id": "66c2a2c3d4e5f6g7h8i9j0k5",
      "amount": 500.00,
      "merchant": "Amazon",
      "date": "2026-08-05T10:00:00Z",
      "category": "Shopping"
    },
    "highestIncomeTransaction": {
      "_id": "66c2a2c3d4e5f6g7h8i9j0k6",
      "amount": 5000.00,
      "merchant": "Employer",
      "date": "2026-08-04T15:30:00Z"
    }
  }
}
```

### What to Verify

**Category Breakdown**:
- ✅ `percentage` values sum to 100
- ✅ `averageTransaction` = `total / transactions`
- ✅ All categories listed

**Monthly Trend**:
- ✅ Shows last 3 months
- ✅ Dates in descending order
- ✅ Spending trends visualizable

**Income vs Expense**:
- ✅ `savingsRate` = (`totalIncome - totalExpense`) / `totalIncome` * 100
- ✅ `savingsAmount` = `totalIncome - totalExpense`
- ✅ Rates make financial sense

**Top Merchants**:
- ✅ Limited to top 5
- ✅ Merchant categories shown
- ✅ Percentages calculated correctly

**Highest Transactions**:
- ✅ Both expense and income identified
- ✅ Complete transaction details shown

---

## Test 3: Get Monthly Comparison

### Objective

Compare current month vs previous month to show spending changes, income changes, and savings changes with clear indicators.

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/monthly-comparison`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Sample Request

```bash
curl -X GET http://localhost:8000/api/v1/dashboard/monthly-comparison \
  -H "Authorization: Bearer {your_token}"
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Monthly comparison retrieved successfully",
  "data": {
    "currentMonth": {
      "month": "August 2026",
      "income": 10000.00,
      "expense": 5000.00,
      "savings": 5000.00,
      "savingsRate": 50.00,
      "transactionCount": 50
    },
    "previousMonth": {
      "month": "July 2026",
      "income": 8000.00,
      "expense": 4800.00,
      "savings": 3200.00,
      "savingsRate": 40.00,
      "transactionCount": 45
    },
    "comparison": {
      "incomeChange": {
        "amount": 2000.00,
        "percentage": 25.00,
        "trend": "increase",
        "description": "Income increased by 25% (₹2000)"
      },
      "expenseChange": {
        "amount": 200.00,
        "percentage": 4.17,
        "trend": "increase",
        "description": "Expenses increased by 4% (₹200)"
      },
      "savingsChange": {
        "amount": 1800.00,
        "percentage": 56.25,
        "trend": "increase",
        "description": "Savings improved by 56% (₹1800)"
      },
      "savingsRateChange": {
        "amount": 10.00,
        "percentage": 25.00,
        "trend": "increase",
        "description": "Savings rate improved from 40% to 50%"
      },
      "transactionCountChange": {
        "amount": 5,
        "percentage": 11.11,
        "trend": "increase",
        "description": "More active this month (5 more transactions)"
      }
    },
    "categoryComparison": [
      {
        "category": "Shopping",
        "currentMonth": 2000.00,
        "previousMonth": 1500.00,
        "change": 500.00,
        "changePercentage": 33.33,
        "trend": "increase"
      },
      {
        "category": "Food",
        "currentMonth": 1500.00,
        "previousMonth": 2000.00,
        "change": -500.00,
        "changePercentage": -25.00,
        "trend": "decrease"
      }
    ]
  }
}
```

### What to Verify

**Current vs Previous Month**:
- ✅ Both months have complete data
- ✅ Calculations match Phase 09 spec
- ✅ Savings rates calculated correctly

**Comparison Metrics**:
- ✅ `amount` = current - previous
- ✅ `percentage` = (amount / previous) * 100
- ✅ `trend` = "increase" or "decrease" based on amount
- ✅ `description` field provides plain language explanation

**Category Comparison**:
- ✅ All categories included
- ✅ Change calculations accurate
- ✅ Trends correctly identified

**Edge Cases**:
- ✅ If previous month has 0, percentage handled gracefully
- ✅ Zero changes show correctly

---

## Test 4: Get Financial Health Score

### Objective

Calculate a 0-100 financial health score based on savings rate, debt ratio, spending habits, and income stability.

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/health-score`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Sample Request

```bash
curl -X GET http://localhost:8000/api/v1/dashboard/health-score \
  -H "Authorization: Bearer {your_token}"
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Financial health score retrieved successfully",
  "data": {
    "overallScore": 72,
    "scoreDescription": "Good financial health. You're doing well, keep it up!",
    "factors": {
      "savingsRate": {
        "score": 80,
        "weight": 0.3,
        "weightedScore": 24,
        "explanation": "You're saving 50% of your income - excellent!"
      },
      "debtRatio": {
        "score": 70,
        "weight": 0.25,
        "weightedScore": 17.5,
        "explanation": "Your debt-to-income ratio is 15% - manageable"
      },
      "spendingHabits": {
        "score": 75,
        "weight": 0.25,
        "weightedScore": 18.75,
        "explanation": "Your spending is well-distributed across categories"
      },
      "incomeStability": {
        "score": 60,
        "weight": 0.2,
        "weightedScore": 12,
        "explanation": "Income varies between months - consider diversifying"
      }
    },
    "breakdown": {
      "totalIncome": 10000.00,
      "totalExpense": 5000.00,
      "totalDebt": 1500.00,
      "savingsRate": 50.00,
      "debtToIncomeRatio": 15.00,
      "monthlyVariance": 20.00
    },
    "recommendations": [
      "Your savings rate is excellent. Consider investing the savings.",
      "Reduce spending on Shopping category by 10% to improve further.",
      "Maintain income stability to reach a score of 80+."
    ]
  }
}
```

### What to Verify

**Score Calculation**:
- ✅ `overallScore` ranges 0-100
- ✅ Sum of `weightedScore` values ≈ `overallScore`
- ✅ All weights sum to 1.0
- ✅ Each factor has a score 0-100

**Factor Breakdown**:
- ✅ `savingsRate` based on income savings percentage
- ✅ `debtRatio` = (total debt / total income) * 100
- ✅ `spendingHabits` evaluated from category distribution
- ✅ `incomeStability` from month-to-month variance

**Description & Recommendations**:
- ✅ Score description appropriate to score range
- ✅ Recommendations actionable and specific
- ✅ Based on user's actual financial data

**Score Ranges** (Expected):
- 0-20: Poor - Significant financial stress
- 21-40: Fair - Room for improvement
- 41-60: Satisfactory - Stable but could be better
- 61-80: Good - Healthy financial habits
- 81-100: Excellent - Exceptional financial management

---

## Test 5: Get AI Insights

### Objective

Get natural-language rule-based insights about user's finances using AI patterns.

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/insights`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Sample Request

```bash
curl -X GET http://localhost:8000/api/v1/dashboard/insights \
  -H "Authorization: Bearer {your_token}"
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Insights retrieved successfully",
  "data": {
    "period": "August 2026",
    "insights": [
      {
        "type": "spending_summary",
        "title": "August Spending Summary",
        "content": "You spent ₹5,000 this month across 50 transactions. Your biggest spending category was Shopping (40% or ₹2,000), followed by Food (30% or ₹1,500).",
        "priority": "high",
        "actionable": false
      },
      {
        "type": "income_summary",
        "title": "August Income",
        "content": "You earned ₹10,000 this month from 2 transactions. Your primary income source is Employer salary.",
        "priority": "high",
        "actionable": false
      },
      {
        "type": "savings_insight",
        "title": "Excellent Savings This Month",
        "content": "You saved ₹5,000 this month (50% of income). Keep up this habit to build wealth faster.",
        "priority": "medium",
        "actionable": true,
        "action": "Consider investing your savings in low-risk funds"
      },
      {
        "type": "category_spike",
        "title": "Shopping Increased",
        "content": "Your Shopping category spending increased by 33% compared to July (₹500 more). This was the biggest change in your spending pattern.",
        "priority": "medium",
        "actionable": true,
        "action": "Review your Shopping purchases to see if this is necessary"
      },
      {
        "type": "top_merchant",
        "title": "Most Frequent Merchant",
        "content": "Amazon is your most used merchant this month with ₹1,500 spent (30% of total expenses).",
        "priority": "low",
        "actionable": false
      },
      {
        "type": "balance_insight",
        "title": "Net Balance Positive",
        "content": "Your net balance this month is positive ₹5,000. You're spending less than you earn.",
        "priority": "high",
        "actionable": false
      },
      {
        "type": "food_spending",
        "title": "Food Spending is Stable",
        "content": "You spent ₹1,500 on Food this month, which is consistent with previous months. Good control!",
        "priority": "low",
        "actionable": false
      }
    ],
    "generatedAt": "2026-08-05T10:30:00Z"
  }
}
```

### What to Verify

**Insight Types**:
- ✅ `spending_summary` – Overall spending overview
- ✅ `income_summary` – Income details
- ✅ `savings_insight` – Savings performance
- ✅ `category_spike` – Major category changes
- ✅ `top_merchant` – Spending pattern
- ✅ `balance_insight` – Net balance status
- ✅ Additional contextual insights

**Insight Structure**:
- ✅ Each has `type`, `title`, `content`
- ✅ `priority` = "high", "medium", or "low"
- ✅ `actionable` = true/false
- ✅ If actionable, `action` field provided

**Content Quality**:
- ✅ Insights use actual user data
- ✅ Written in plain language
- ✅ No jargon or raw numbers without context
- ✅ Helpful and relevant

**Timestamp**:
- ✅ `generatedAt` shows current time

---

## Security Tests

### Test 6: No Authentication

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/overview`

**Headers**: (DO NOT add Authorization)

### Send Request

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "No token provided",
  "statusCode": 401
}
```

**What to Verify**:
- ✅ Request rejected without token
- ✅ Clear error message

---

### Test 7: Invalid Token

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/overview`

**Headers**:
```
Authorization: Bearer INVALID_TOKEN_12345
```

### Send Request

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid token",
  "statusCode": 401
}
```

**What to Verify**:
- ✅ Invalid token rejected
- ✅ Auth middleware working

---

### Test 8: Cross-User Access Prevention

### Setup
1. Create User A, get token A
2. Create User B, get token B
3. Import transactions for User A

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/overview`

**Headers**:
```
Authorization: Bearer {token_b}
```

### Send Request

**Expected Response (200 OK)** — But shows User B's data, not User A's

**What to Verify**:
- ✅ Dashboard shows only User B's data
- ✅ Users cannot access other users' dashboards
- ✅ Data isolation working

---

## Validation Tests

### Test 9: Empty Data (New User)

### Setup
1. Create fresh user with no transactions
2. Login and get token

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/overview`

**Headers**:
```
Authorization: Bearer {fresh_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "currentMonth": "August 2026",
    "totalIncome": 0,
    "totalExpenses": 0,
    "netBalance": 0,
    "netWorth": 0,
    "activeLoans": 0,
    "totalEMI": 0,
    "recentTransactions": [],
    "topSpendingCategories": [],
    "calculatedAt": "2026-08-05T10:30:00Z"
  }
}
```

**What to Verify**:
- ✅ All values default to 0
- ✅ Arrays empty but structure correct
- ✅ No errors thrown
- ✅ Graceful handling of empty data

---

### Test 10: Single Transaction

### Setup
1. Import 1 transaction

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/spending-analysis`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (200 OK)** — Should handle single transaction

**What to Verify**:
- ✅ Percentages calculated correctly (100%)
- ✅ Average transaction = total amount
- ✅ No division by zero errors

---

## Regression Tests

### Test 11: Phase 05 Transactions Still Accessible

```
GET /api/v1/transactions
Authorization: Bearer {your_token}

Expected (200): Transactions list returned
```

**What to Verify**:
- ✅ Dashboard depends on transactions
- ✅ Transactions unchanged by dashboard operations

---

### Test 12: Phase 04 Statements Still Exist

```
GET /api/v1/statements
Authorization: Bearer {your_token}

Expected (200): Statements list returned
```

**What to Verify**:
- ✅ Statement import not affected
- ✅ Data integrity maintained

---

## Performance & Load Tests

### Test 13: Dashboard Response Time

**Objective**: Verify dashboard endpoints respond quickly

### Postman Setup

Enable Postman's response time tracking:
1. Open request
2. Send request
3. Check "Response time" in response headers

**Expected Response Times**:
- `/dashboard/overview` – < 500ms
- `/dashboard/spending-analysis` – < 800ms
- `/dashboard/monthly-comparison` – < 1000ms
- `/dashboard/health-score` – < 1000ms
- `/dashboard/insights` – < 1500ms

**What to Verify**:
- ✅ Calculations efficient for 1000+ transactions
- ✅ No N+1 query problems
- ✅ Acceptable latency for user experience

---

## Database Verification

### Verify Dashboard Data Accuracy

```bash
mongosh
use financeos

# Count transactions for current month
db.transactions.countDocuments({
  user: ObjectId("..."),
  isDeleted: false,
  date: { $gte: ISODate("2026-08-01"), $lt: ISODate("2026-09-01") }
})

# Verify totals
db.transactions.aggregate([
  { $match: { user: ObjectId("..."), isDeleted: false } },
  { $group: { 
      _id: null,
      totalDebit: { $sum: { $cond: [{ $eq: ["$type", "Debit"] }, "$amount", 0] } },
      totalCredit: { $sum: { $cond: [{ $eq: ["$type", "Credit"] }, "$amount", 0] } }
    }
  }
])
```

**What to Verify**:
- ✅ Dashboard totals match database calculations
- ✅ Transaction counts accurate
- ✅ Category sums correct

---

## Test Summary Checklist

**Dashboard Operations**:
- [ ] Test 1: Overview → 200 ✅
- [ ] Test 2: Spending Analysis → 200 ✅
- [ ] Test 3: Monthly Comparison → 200 ✅
- [ ] Test 4: Health Score → 200 ✅
- [ ] Test 5: Insights → 200 ✅

**Security**:
- [ ] Test 6: No auth → 401 ✅
- [ ] Test 7: Invalid token → 401 ✅
- [ ] Test 8: Cross-user access blocked ✅

**Validation**:
- [ ] Test 9: Empty data handled ✅
- [ ] Test 10: Single transaction handled ✅

**Regression**:
- [ ] Test 11: Phase 05 transactions working ✅
- [ ] Test 12: Phase 04 statements working ✅

**Performance**:
- [ ] Test 13: Response times acceptable ✅

**Data Accuracy**:
- [ ] Calculations match database ✅
- [ ] Percentages accurate ✅
- [ ] Trends correct ✅

---

## Expected Values Summary

| Metric | Formula | Example |
|--------|---------|---------|
| Net Balance | Income - Expenses | ₹5,000 |
| Savings Rate | (Income - Expenses) / Income * 100 | 50% |
| Debt Ratio | Total Debt / Income * 100 | 15% |
| Average Transaction | Total / Count | ₹100 |
| Category % | Category / Total * 100 | 40% |
| Month Change | (Current - Previous) / Previous * 100 | +25% |
| Health Score | Weighted sum of factors | 72 |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| All zeros in overview | Check if transactions exist |
| Percentages > 100% | Check calculation logic |
| Wrong month data | Verify date filters in code |
| Missing categories | Check transaction data structure |
| Health score always 50 | Verify factor weights sum to 1.0 |
| Insights are generic | Verify rule-based logic matches data |
| Slow response | Check database indexes on user + date |

---

**Status**: Ready for Testing ✅  
**Last Updated**: August 5, 2026  
**Phase 09**: Complete

