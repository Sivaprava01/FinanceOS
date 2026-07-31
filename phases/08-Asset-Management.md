# Phase 08 – Asset Management

## Objective

Implement the complete Asset Management module.

This module allows users to record and manage their assets. FinanceOS should calculate the user's net worth dynamically using assets and liabilities rather than storing a separate net worth value.

Before starting, read:

- docs/Blueprint.md
- docs/Guidelines.md
- docs/TechStack.md

---

## Functional Requirements

Implement the following functionality:

### Asset Management

Users should be able to:

- Add Asset
- View Assets
- Edit Asset
- Delete Asset
- View Asset Details

---

### Asset Information

Each asset should support:

- Asset Name
- Asset Category
- Current Value
- Purchase Value (Optional)
- Purchase Date (Optional)
- Notes (Optional)

Suggested categories:

- Cash
- Bank Account
- Gold
- Real Estate
- Vehicle
- Stocks
- Mutual Funds
- Cryptocurrency
- Others

---

### Asset Summary

Provide:

- Total Assets Value
- Assets by Category
- Number of Assets

All values should be calculated dynamically.

---

### Net Worth

Calculate Net Worth dynamically using:

Net Worth = Total Assets − Total Liabilities

Do NOT store Net Worth separately in the database.

---

## Business Rules

- Every asset belongs to exactly one user.
- Asset values can be updated anytime.
- Net Worth should always be calculated in real time.
- Deleted assets should immediately reflect in Net Worth calculations.

---

## Security

- Users can access only their own assets.
- Validate all asset information.
- Prevent unauthorized updates.

---

## Swagger

Document every endpoint with:

- Request Body
- Response
- Authentication
- Status Codes

---

## Deliverables

At the end of this phase:

- Asset CRUD completed.
- Asset categories implemented.
- Asset summary implemented.
- Dynamic Net Worth calculation completed.
- Swagger updated.

---

## Out of Scope

Do NOT implement:

- Dashboard
- Insights
- Family Finance

These will be implemented in later phases.

---

## Completion

When complete:

- Explain the asset schema.
- Explain Net Worth calculation.
- Explain all APIs.
- Wait for approval before continuing.