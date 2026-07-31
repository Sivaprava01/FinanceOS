# Phase 07 – Loan Management

## Objective

Implement the complete Loan Management module.

This module allows users to track all their loans, monitor outstanding balances, manage EMI schedules, and view repayment progress.

Before starting, read:

- docs/Blueprint.md
- docs/Guidelines.md
- docs/TechStack.md

---

## Functional Requirements

Implement the following functionality:

### Loan Management

Users should be able to:

- Add Loan
- View Loans
- Edit Loan
- Delete Loan
- View Loan Details

---

### Loan Information

Each loan should support:

- Loan Name
- Loan Type
- Lender Name
- Principal Amount
- Interest Rate
- Loan Start Date
- Loan End Date
- EMI Amount
- EMI Due Date
- Outstanding Balance
- Loan Status (Active / Closed)

---

### EMI Tracking

Support:

- Upcoming EMI
- EMI History
- Remaining EMIs
- Loan Progress

Automatically calculate:

- Total Paid
- Remaining Balance
- Remaining Tenure

---

### Loan Summary

Provide:

- Total Active Loans
- Total Outstanding Amount
- Monthly EMI Total
- Closed Loans

These values should be calculated dynamically.

---

## Business Rules

- Every loan belongs to exactly one user.
- Closed loans remain available for history.
- Outstanding balance should update automatically.
- Loan summaries should always reflect current data.

---

## Security

- Users can access only their own loans.
- Validate all loan information.
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

- Loan CRUD completed.
- EMI tracking completed.
- Loan summary completed.
- Dynamic calculations implemented.
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

- Explain the loan schema.
- Explain calculation logic.
- Explain all APIs.
- Wait for approval before continuing.