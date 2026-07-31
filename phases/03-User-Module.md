# Phase 03 – User Module

## Objective

Implement the complete User module for FinanceOS.

This module is responsible for storing and managing user information and preferences. Every authenticated user should have exactly one profile.

Read and follow:

- docs/Blueprint.md
- docs/Guidelines.md
- docs/TechStack.md

---

## Functional Requirements

Implement the following APIs:

- Get Current User
- Get User by ID (Admin/Internal if required)
- Update Profile
- Update Preferences
- Delete Account (Soft Delete preferred)

---

## User Information

The profile should support:

### Basic Information

- Full Name
- Email
- Profile Picture (optional)
- Country
- Preferred Currency
- Time Zone

### Preferences

- Default Currency
- Language (future-ready)
- Theme (future-ready)
- Notification Preferences (placeholder)

Design the schema so additional preferences can be added later.

---

## Validation

Validate:

- Required fields
- Country format
- Currency format
- Time Zone
- Email uniqueness

Return meaningful validation errors.

---

## Business Rules

- Users can edit their own profile.
- Users cannot edit another user's profile.
- Email should not be editable through the normal update endpoint.
- Password updates belong to the Authentication module.
- Deleted users should not be permanently removed unless explicitly required.

---

## Security

- All endpoints require authentication.
- Never expose sensitive fields.
- Exclude passwords and tokens from responses.
- Validate ownership before updates.

---

## Swagger

Document every endpoint with:

- Request body
- Response
- Status codes
- Authentication requirements

---

## Deliverables

At the end of this phase:

- User schema created
- User service implemented
- User controller implemented
- Protected routes working
- Validation implemented
- Swagger updated
- APIs tested

---

## Out of Scope

Do not implement:

- Family
- Statements
- Transactions
- Loans
- Assets
- Insights

---

## Completion

When complete:

- Explain the folder structure.
- Explain each API.
- Explain the database schema.
- Mention any assumptions.
- Wait for approval before Phase 04.