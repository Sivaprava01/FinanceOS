# FinanceOS Backend Development Guidelines

> This document defines the backend architecture and coding standards that every developer and AI agent must follow.
>
> These rules are inspired by the reference backend architecture and should remain consistent throughout the project.

---

# 1. Project Structure

The backend follows a modular structure.

```
src/
│
├── controllers/
├── models/
├── routes/
├── middlewares/
├── utils/
├── db/
├── constants.js
├── app.js
└── index.js
```

Every folder has a single responsibility.

Never place unrelated code inside another module.

---

# 2. Request Flow

Every request should follow this order.

```
Client

↓

Route

↓

Middleware

↓

Controller

↓

Model

↓

MongoDB

↓

ApiResponse

↓

Client
```

Keep this flow consistent across the project.

---

# 3. Controllers

Controllers should remain thin.

Responsibilities:

- Receive request
- Validate required inputs
- Call models/services
- Return ApiResponse
- Throw ApiError when required

Controllers should NOT:

- Contain large business logic
- Duplicate database queries
- Perform unrelated operations

Always wrap async controllers using `asyncHandler`.

---

# 4. Models

Every collection has exactly one model.

Rules:

- Use Mongoose Schemas.
- Enable timestamps.
- Use descriptive field names.
- Add indexes where required.
- Keep schema validation inside models.
- Never store sensitive information in plain text.

Models are responsible only for database structure and model-specific logic.

---

# 5. Routes

Routes should remain simple.

Responsibilities:

- Define API endpoints.
- Apply middleware.
- Call controller methods.

Rules:

- One route file per module.
- Keep REST naming consistent.
- Use `/api/v1/` prefix.
- Keep route definitions clean.

---

# 6. Middleware

Middleware handles reusable request processing.

Examples:

- Authentication
- Authorization
- File Upload
- Validation
- Error Handling

Never duplicate middleware logic inside controllers.

---

# 7. Authentication

Authentication should remain centralized.

Requirements:

- JWT Authentication
- Refresh Tokens
- Access Tokens
- Google OAuth support
- Secure HTTP-only cookies where applicable

Never expose sensitive authentication data.

---

# 8. Utilities

Reusable functionality belongs inside `utils/`.

Examples:

- ApiResponse
- ApiError
- asyncHandler
- Token Helpers
- File Helpers
- Cloud Storage Helpers
- Validation Helpers

Avoid duplicating helper logic.

---

# 9. Error Handling

All errors should follow one pattern.

Rules:

- Throw ApiError.
- Never expose stack traces.
- Use proper HTTP status codes.
- Return consistent error responses.

Unexpected errors should be handled globally.

---

# 10. API Responses

Every successful request returns a consistent response format.

```
{
    success,
    message,
    data
}
```

Never return raw database documents without processing when sensitive fields exist.

---

# 11. Validation

Validate data before database operations.

Validation should happen in:

- Middleware
- Controllers
- Mongoose Schemas

Never trust client input.

---

# 12. Configuration

Use environment variables for configuration.

Examples:

- PORT
- MONGODB_URI
- JWT_SECRET
- JWT_REFRESH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

Never hardcode secrets.

Never commit `.env`.

---

# 13. Naming Conventions

Use consistent naming everywhere.

Folders:

```
controllers
models
routes
middlewares
utils
```

Variables:

```
camelCase
```

Classes & Models:

```
PascalCase
```

Constants:

```
UPPER_SNAKE_CASE
```

---

# 14. Code Style

- Use async/await.
- Prefer early returns.
- Keep functions small.
- Avoid duplicate code.
- Write reusable helpers.
- Keep files focused.
- Follow consistent formatting.

Readable code is preferred over clever code.

---

# 15. Backend Principles

Always follow these principles.

- Single Responsibility Principle.
- DRY (Don't Repeat Yourself).
- Keep controllers thin.
- Keep modules independent.
- Reuse utilities.
- Never duplicate business logic.
- Keep APIs predictable.
- Build for scalability.

---

# 16. FinanceOS Extension

While this architecture is inspired by the reference backend, FinanceOS extends it with a dedicated `services/` layer.

The final request flow becomes:

```
Client

↓

Route

↓

Middleware

↓

Controller

↓

Service

↓

Model

↓

MongoDB

↓

ApiResponse

↓

Client
```

Rules for Services:

- Business logic belongs here.
- Controllers should never implement complex business logic.
- Services may coordinate multiple models.
- Services should remain reusable and independent.
- One service file per module.

---

# Final Rule

Every future backend module must follow this document.

If a new feature cannot be implemented while following these guidelines, discuss the architectural change before implementing it.

Architecture consistency is more important than development speed.