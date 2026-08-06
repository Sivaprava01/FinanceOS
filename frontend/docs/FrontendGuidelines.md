# FrontendGuidelines.md

# FinanceOS Frontend Development Guidelines

Version: 1.0

---

# 1. Purpose

This document defines the engineering standards and best practices for developing the FinanceOS frontend.

Every frontend implementation must follow these guidelines to ensure:

- Consistency
- Maintainability
- Scalability
- Readability
- Performance

These guidelines are mandatory for all contributors.

---

# 2. General Principles

Always prioritize:

- Readability over clever code.
- Reusability over duplication.
- Simplicity over unnecessary abstraction.
- Consistency over personal preference.
- Maintainability over short-term convenience.

Every implementation should align with the FinanceOS Blueprint and Tech Stack documents.

---

# 3. Folder Structure

The application should follow a feature-oriented architecture.

Example:

src/

app/

components/

features/

hooks/

layouts/

lib/

pages/

routes/

services/

store/

styles/

types/

utils/

assets/

Organize code by responsibility.

Avoid dumping unrelated files into shared folders.

---

# 4. Naming Conventions

Components

PascalCase

Example

TransactionTable.tsx

DashboardCard.tsx

---

Hooks

camelCase beginning with "use"

Example

useTransactions.ts

useTheme.ts

---

Utilities

camelCase

Example

formatCurrency.ts

calculateSavings.ts

---

Constants

UPPER_SNAKE_CASE where appropriate.

---

Types

PascalCase

Example

Transaction

Category

UserProfile

---

# 5. Components

Every reusable UI element must become a component.

Do not duplicate UI.

Prefer composition over inheritance.

Each component should have one clear responsibility.

Large components should be broken into smaller reusable pieces.

---

# 6. Styling Rules

Use Tailwind CSS utilities whenever possible.

Avoid inline styles.

Avoid excessive custom CSS.

Maintain spacing using the FinanceOS spacing scale.

Use design tokens instead of hardcoded values.

---

# 7. State Management

Choose the appropriate state management strategy.

Local State

Component-specific interactions.

React Context

Global UI state only.

Examples:

Theme

Authentication

Sidebar

TanStack Query

Server data.

Examples:

Transactions

Dashboard

Statements

Analytics

Avoid storing server data inside Context.

---

# 8. API Communication

All backend communication should occur through the API service layer.

Components should never call Axios directly.

Example

Component

↓

Hook

↓

API Service

↓

Axios

↓

Backend

This separation improves maintainability and testing.

---

# 9. Forms

All forms should use:

React Hook Form

+

Zod

Validation should exist in one place.

Error messages should remain clear and user-friendly.

Never rely solely on backend validation.

---

# 10. Routing

React Router should manage all navigation.

Protected routes must require authentication.

Public routes should remain isolated.

Layouts should wrap related pages.

Avoid deeply nested routing unless necessary.

---

# 11. Component Design

Every component should support:

Loading

Disabled

Error

Empty

Normal

Success

A component is incomplete until all applicable states exist.

---

# 12. Accessibility

Every interactive element must support keyboard navigation.

Buttons require accessible labels.

Forms require associated labels.

Focus states must remain visible.

Color should never be the only indicator of information.

Semantic HTML should always be preferred.

---

# 13. Performance

Lazy-load heavy pages.

Avoid unnecessary re-renders.

Memoize expensive computations only when required.

Optimize images and assets.

Keep bundle size small.

Performance should remain a continuous consideration rather than an afterthought.

---

# 14. Error Handling

Frontend errors should never expose technical information to users.

Provide:

Clear explanation.

Helpful action.

Recovery path.

Unexpected failures should fail gracefully.

---

# 15. Loading Experience

Use skeleton loaders for page content.

Use progress indicators for long-running operations.

Use spinners only for short actions.

Loading should communicate progress without feeling distracting.

---

# 16. Animations

Animations should be:

Consistent

Purposeful

Smooth

Fast

Avoid excessive motion.

Users should notice improved usability rather than the animation itself.

---

# 17. Git Practices

Keep commits focused.

Write meaningful commit messages.

Avoid committing unused files.

Do not leave commented-out code.

Open pull requests only after local testing.

---

# 18. Code Quality

Run ESLint before committing.

Run Prettier before committing.

Resolve warnings whenever possible.

Avoid disabling lint rules without justification.

Code reviews should prioritize:

Correctness

Readability

Consistency

Performance

---

# 19. Testing Philosophy

Every feature should be manually verified before completion.

Verify:

Light Mode

Dark Mode

Responsive layouts

Error states

Loading states

Empty states

Authentication

Navigation

API integration

Future automated testing can supplement but not replace thoughtful manual verification.

---

# 20. Definition of Good Code

Good frontend code is:

Easy to read.

Easy to modify.

Easy to reuse.

Easy to test.

Easy to remove.

If a future developer can understand a file without additional explanation, the implementation is successful.

Every contribution should make the project better than it was before.