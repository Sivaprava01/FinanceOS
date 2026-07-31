# FinanceOS Backend - Architecture Diagram

## Request Flow - Visual Representation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                              │
│                    (React Frontend - Port 3000)                          │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             │ HTTP Request
                             │ GET /api/v1/health
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    FINANCEOS BACKEND (Express)                           │
│                        (Port 8000)                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ MIDDLEWARE LAYER                                              │   │
│  │                                                                │   │
│  │  1. CORS Middleware                                           │   │
│  │     └─ Validates origin (localhost only in dev)             │   │
│  │                                                                │   │
│  │  2. Body Parser Middleware                                    │   │
│  │     └─ Parses JSON request body                              │   │
│  │                                                                │   │
│  │  3. Morgan Logger Middleware                                  │   │
│  │     └─ Logs: GET /api/v1/health 200 2.5ms                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             │                                          │
│                             ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ROUTE LAYER (routes/health.routes.js)                         │   │
│  │                                                                │   │
│  │  router.get('/health', getHealthStatus)                       │   │
│  │  ↓ matches /api/v1/health                                    │   │
│  │  ✓ Call controller: getHealthStatus                          │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             │                                          │
│                             ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ CONTROLLER LAYER (controllers/healthController.js)            │   │
│  │                                                                │   │
│  │  export const getHealthStatus = asyncHandler(async (req, res) => {│   │
│  │    // 1. Validate request (if needed)                        │   │
│  │    // 2. Call service                                        │   │
│  │    const status = await healthService.checkHealth()          │   │
│  │    // 3. Return response                                     │   │
│  │    return res.json(new ApiResponse(200, status, "..."))      │   │
│  │  })                                                           │   │
│  │                                                                │   │
│  │  Responsibilities:                                            │   │
│  │  - Receive HTTP request                                      │   │
│  │  - Validate inputs (if needed)                               │   │
│  │  - Call service for business logic                           │   │
│  │  - Format response                                           │   │
│  │  - Handle errors (caught by asyncHandler)                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             │                                          │
│                             ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ SERVICE LAYER (services/healthService.js)                     │   │
│  │                                                                │   │
│  │  export const healthService = {                              │   │
│  │    checkHealth: async () => {                                │   │
│  │      // 1. Perform business logic                            │   │
│  │      // 2. Query database (if needed)                        │   │
│  │      // 3. Calculate results                                 │   │
│  │      // 4. Return data                                       │   │
│  │      return { success: true, message: "Running" }            │   │
│  │    }                                                          │   │
│  │  }                                                            │   │
│  │                                                                │   │
│  │  Responsibilities:                                            │   │
│  │  - Contain all business logic                                │   │
│  │  - Query database (through models)                           │   │
│  │  - Perform calculations                                      │   │
│  │  - Return data to controller                                 │   │
│  │  - Be reusable across multiple controllers                   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             │                                          │
│                             ↓ (if database needed)                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ DATABASE (via Models/Mongoose)                                │   │
│  │                                                                │   │
│  │  const user = await User.findById(id)                         │   │
│  │  ↓                                                            │   │
│  │  MongoDB Database                                             │   │
│  │  └─ Returns document                                          │   │
│  │                                                                │   │
│  │  (For Phase 01, not used yet)                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             │                                          │
│                             ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ RESPONSE FORMATTING (utils/ApiResponse.js)                    │   │
│  │                                                                │   │
│  │  new ApiResponse(200, data, "Success")                        │   │
│  │  ↓                                                            │   │
│  │  Returns:                                                     │   │
│  │  {                                                            │   │
│  │    "success": true,                                          │   │
│  │    "message": "FinanceOS Backend is running",                │   │
│  │    "data": {                                                 │   │
│  │      "success": true,                                        │   │
│  │      "message": "FinanceOS Backend is running"               │   │
│  │    },                                                         │   │
│  │    "statusCode": 200                                         │   │
│  │  }                                                            │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             │                                          │
│                             ↓                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ERROR HANDLER (middlewares/errorHandler.js) - if error thrown │   │
│  │                                                                │   │
│  │  Global error handler catches ALL errors:                     │   │
│  │  - Validation errors                                          │   │
│  │  - Database errors                                            │   │
│  │  - Application errors (ApiError)                              │   │
│  │  - Unexpected errors                                          │   │
│  │                                                                │   │
│  │  Returns:                                                     │   │
│  │  {                                                            │   │
│  │    "success": false,                                         │   │
│  │    "message": "Error description",                           │   │
│  │    "statusCode": 400 (or appropriate status)                 │   │
│  │  }                                                            │   │
│  │                                                                │   │
│  │  Stack trace shown only in development                        │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                             │                                          │
│                             ↓ HTTP Response                           │
└─────────────────────────────┼──────────────────────────────────────────┘
                              │
                              │ { success: true, ... }
                              ↓
                         CLIENT RECEIVES
                         HTTP 200
                         JSON Response
```

---

## File Dependency Map

```
src/index.js (Server Start)
    │
    ├─→ dotenv (Load .env)
    ├─→ src/app.js (Express app)
    │   │
    │   ├─→ express (Framework)
    │   ├─→ cors (CORS middleware)
    │   ├─→ src/middlewares/logger.js (Morgan)
    │   ├─→ src/routes/index.js (Routes aggregator)
    │   │   │
    │   │   └─→ src/routes/health.routes.js
    │   │       │
    │   │       └─→ src/controllers/healthController.js
    │   │           │
    │   │           ├─→ src/utils/asyncHandler.js
    │   │           ├─→ src/services/healthService.js
    │   │           └─→ src/utils/ApiResponse.js
    │   │
    │   └─→ src/middlewares/errorHandler.js
    │       │
    │       ├─→ src/utils/ApiError.js
    │       └─→ src/constants/index.js
    │
    └─→ src/db/index.js (MongoDB Connection)
        │
        ├─→ mongoose (Database ODM)
        └─→ process.env (Environment variables)
```

---

## Data Flow Example: Health Check Request

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. REQUEST ARRIVES                                                  │
│    GET http://localhost:8000/api/v1/health                          │
│    Headers: { "Accept": "application/json" }                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. CORS MIDDLEWARE                                                  │
│    ✓ Origin is localhost:3000                                      │
│    ✓ CORS_ORIGINS includes localhost:3000                          │
│    ✓ Allow request to continue                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. MORGAN LOGGER                                                    │
│    Log: GET /api/v1/health                                          │
│    (Will log response after route completes)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. ROUTE MATCHING                                                   │
│    Request path: /api/v1/health                                     │
│    Route defined: router.get('/health', getHealthStatus)            │
│    ✓ Match found                                                    │
│    → Call controller: getHealthStatus(req, res, next)               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. CONTROLLER EXECUTION                                             │
│    getHealthStatus = asyncHandler(async (req, res) => {            │
│      // 1. Controller receives request                              │
│      console.log("Request received")                                │
│                                                                      │
│      // 2. Call service                                             │
│      const healthStatus = await healthService.checkHealth()        │
│                                                                      │
│      // 3. Format response                                          │
│      return res.status(200).json(                                   │
│        new ApiResponse(200, healthStatus, healthStatus.message)    │
│      )                                                              │
│    })                                                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. SERVICE EXECUTION                                                │
│    healthService.checkHealth() {                                    │
│      // 1. Perform business logic (none for health check)           │
│      // 2. Return status                                            │
│      return {                                                       │
│        success: true,                                              │
│        message: "FinanceOS Backend is running"                     │
│      }                                                              │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓ Returns to controller
┌─────────────────────────────────────────────────────────────────────┐
│ 7. RESPONSE FORMATTING (ApiResponse)                                │
│    new ApiResponse(200, healthStatus, healthStatus.message)        │
│    │                                                                 │
│    Creates object:                                                  │
│    {                                                                │
│      success: true,  // statusCode < 400                           │
│      message: "FinanceOS Backend is running",                      │
│      data: {                                                        │
│        success: true,                                              │
│        message: "FinanceOS Backend is running"                     │
│      },                                                             │
│      statusCode: 200                                               │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓ res.json() sends to client
┌─────────────────────────────────────────────────────────────────────┐
│ 8. MORGAN LOG COMPLETED                                             │
│    GET /api/v1/health 200 - 2.345 ms                               │
│                                                                      │
│    (Logged after response sent)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 9. RESPONSE SENT TO CLIENT                                          │
│    HTTP/1.1 200 OK                                                  │
│    Content-Type: application/json                                   │
│    Content-Length: 145                                              │
│                                                                      │
│    {                                                                │
│      "success": true,                                              │
│      "message": "FinanceOS Backend is running",                    │
│      "data": {                                                      │
│        "success": true,                                            │
│        "message": "FinanceOS Backend is running"                   │
│      },                                                             │
│      "statusCode": 200                                             │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Error Flow Example

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ERROR OCCURS ANYWHERE IN REQUEST FLOW                            │
│    throw new ApiError(400, "Invalid request data")                  │
│                                                                      │
│    In: Controller, Service, Middleware, or Route handler            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. asyncHandler CATCHES ERROR (if in async function)                │
│    Promise.resolve(fn(...)).catch((err) => next(err))               │
│                                                                      │
│    Passes error to Express error handler via next(err)              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. GLOBAL ERROR HANDLER MIDDLEWARE                                  │
│    app.use(errorHandler)                                            │
│                                                                      │
│    Receives error object:                                           │
│    - statusCode: 400                                                │
│    - message: "Invalid request data"                                │
│    - stack trace (for logging)                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. ERROR PROCESSING                                                 │
│    - Log error details (status, message, path)                      │
│    - Determine status code (400, 500, etc.)                         │
│    - In development: include stack trace                            │
│    - In production: hide stack trace                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. ERROR RESPONSE FORMATTED                                         │
│    {                                                                │
│      "success": false,                                             │
│      "message": "Invalid request data",                            │
│      "statusCode": 400                                             │
│      // stack trace here (development only)                        │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. ERROR RESPONSE SENT TO CLIENT                                    │
│    HTTP/1.1 400 Bad Request                                         │
│    Content-Type: application/json                                   │
│                                                                      │
│    {                                                                │
│      "success": false,                                             │
│      "message": "Invalid request data",                            │
│      "statusCode": 400                                             │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure (Ready for Future Expansion)

```
PHASE 01 - FOUNDATION (Current)
├── Health Check ✓
└── Error Handling ✓

PHASE 02 - AUTHENTICATION
├── src/
│   ├── controllers/
│   │   └── authController.js        (NEW)
│   │       ├── register()
│   │       ├── login()
│   │       └── refresh()
│   │
│   ├── services/
│   │   ├── authService.js           (NEW)
│   │   │   ├── registerUser()
│   │   │   ├── authenticateUser()
│   │   │   └── refreshToken()
│   │   │
│   │   └── tokenService.js          (NEW)
│   │       ├── generateAccessToken()
│   │       ├── generateRefreshToken()
│   │       └── verifyToken()
│   │
│   ├── models/
│   │   └── User.js                  (NEW)
│   │
│   ├── middlewares/
│   │   └── authMiddleware.js         (NEW)
│   │       └── verifyToken()
│   │
│   ├── routes/
│   │   ├── auth.routes.js            (NEW)
│   │   │   ├── POST /register
│   │   │   ├── POST /login
│   │   │   └── POST /refresh
│   │   │
│   │   └── index.js                  (UPDATED)
│   │
│   └── utils/
│       └── tokenHelper.js            (NEW)

PHASE 03 - USER MODULE
├── src/
│   ├── controllers/
│   │   └── userController.js         (NEW)
│   │       ├── getProfile()
│   │       ├── updateProfile()
│   │       └── deleteAccount()
│   │
│   ├── services/
│   │   └── userService.js            (NEW)
│   │       ├── getUserById()
│   │       ├── updateUser()
│   │       └── deleteUser()
│   │
│   ├── routes/
│   │   ├── user.routes.js            (NEW)
│   │   │   ├── GET /profile
│   │   │   ├── PUT /profile
│   │   │   └── DELETE /account
│   │   │
│   │   └── index.js                  (UPDATED)

... and so on for Transactions, Loans, Assets, Family, Insights, etc.
```

---

## Technology Layer Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│              React Frontend (Port 3000)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST APIs
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│                  Express.js (Port 8000)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Routes → Controllers → Services → Models            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose ODM
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│                 MongoDB (Port 27017)                        │
│         Collections: Users, Transactions, etc.             │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Timing Diagram

```
Time →

Client          Network         Server          Database
  │                │               │               │
  │ GET /health    │               │               │
  ├──────────────→ │               │               │
  │                │ Express       │               │
  │                │ receives      │               │
  │                ├──────────────→│               │
  │                │               │ Route match   │
  │                │               │ Controller    │
  │                │               │ Service       │
  │                │               │ (no DB call   │
  │                │               │  for health)  │
  │                │               │ Format JSON   │
  │                │ Response      │               │
  │ 200 OK         │←──────────────┤               │
  │ JSON data      │←──────────────┤               │
  │←──────────────┤               │               │
  │                │               │               │
  │ Total: ~2-5ms  │               │               │

Legend:
- Simple endpoint: 2-5ms
- With database query: 10-50ms
- Complex business logic: 50-200ms
- Database slow query: 200-1000ms+
```

---

## Conclusion

This architecture provides:
- ✓ Clear separation of concerns
- ✓ Consistent request/response handling
- ✓ Centralized error handling
- ✓ Reusable components
- ✓ Easy testing
- ✓ Scalable structure
- ✓ Production-ready patterns
