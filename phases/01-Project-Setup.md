# Phase 01 – Project Setup

## Objective

Establish the backend foundation for FinanceOS.

This phase should only initialize and configure the project architecture. No business modules or application features should be implemented.

---

# Before You Begin

Read and understand the following documents before writing any code:

- docs/ExtensivePRD.md
- docs/Blueprint.md
- docs/Guidelines.md
- docs/TechStack.md

These documents define the architecture, coding standards, project goals and technology stack.

Follow them throughout development.

---

# Scope

This phase is limited to backend initialization only.

Implement only the items listed below.

Do NOT implement anything outside this scope.

---

# Tasks

## 1. Initialize Project

- Create a new Node.js + Express backend project.
- Configure ES6+ with Babel or modern Node.js.
- Ensure project structure is consistent with `Guidelines.md`.
- Use a clean, reference-backend-inspired architecture.

---

## 2. Folder Structure

Create the complete backend folder structure that future modules will use.

Suggested structure:

```
src/

├── config/
├── constants/
├── controllers/
├── services/
├── models/
├── routes/
├── middlewares/
├── guards/
├── interceptors/
├── filters/
├── decorators/
├── utils/
├── database/
├── modules/
├── common/
└── main.ts
```

Only create folders required for the architecture.

Do not create business modules yet.

---

## 3. Environment Configuration

Configure environment variable support.

Prepare variables for:

- PORT
- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

Do not hardcode any secrets.

---

## 4. Database

Configure MongoDB.

Requirements:

- Database connection
- Connection configuration
- Proper error handling
- Graceful startup failure if database is unavailable

Do not create any collections or schemas yet.

---

## 5. Global Configuration

Configure:

- CORS
- Validation Pipe
- Global Exception Filter
- Logging
- Global Prefix (e.g. /api/v1)

The backend should be ready for future APIs.

---

## 6. Swagger

Configure Swagger/OpenAPI.

Requirements:

- Project title
- Description
- Version
- Authentication placeholder

Swagger should load successfully even if there are no endpoints yet.

---

## 7. Health Check

Create a simple health endpoint.

Example:

```
GET /api/v1/health
```

The endpoint should confirm:

- Server is running
- API is accessible

Do not include database health checks yet.

---

## 8. Development Quality

Configure:

- ESLint
- Prettier
- Git Ignore
- Environment example file (.env.example)

Ensure the project follows consistent formatting.

---

# Out of Scope

Do NOT implement:

- Authentication
- Users
- Statements
- Transactions
- Loans
- Assets
- Family
- Currency
- Insights
- Business logic
- Models
- Controllers for features

If any of these are created, they should be removed.

---

# Expected Deliverables

At the end of this phase:

- Backend starts successfully.
- MongoDB connection is configured.
- Environment variables work.
- Swagger loads successfully.
- Health endpoint responds correctly.
- Folder structure is complete.
- Code follows `Guidelines.md`.

---

# After Completion

When this phase is complete:

1. Explain every file and folder that was created.
2. Explain why each configuration was added.
3. Mention any architectural decisions made.
4. List any assumptions.
5. Wait for approval before starting the next phase.

Do not automatically continue to Phase 02.
