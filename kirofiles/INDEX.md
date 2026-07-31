# FinanceOS Backend - Complete Documentation Index

## Quick Links

### For Getting Started
- **[README.md](./README.md)** - Installation and quick start guide
- **[.env.example](./.env.example)** - Environment variables template

### For Understanding Architecture
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Detailed explanation of every architectural decision
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Visual diagrams and flow charts
- **[PROJECT_STRUCTURE.txt](./PROJECT_STRUCTURE.txt)** - Visual folder structure

### For Project Overview
- **[../PHASE_01_SUMMARY.md](../PHASE_01_SUMMARY.md)** - Complete Phase 01 summary
- **[../PHASE_01_COMPLETE.md](../PHASE_01_COMPLETE.md)** - Final assessment and sign-off

### Guidelines to Follow
- **[../docs/Guidelines.md](../docs/Guidelines.md)** - Architecture standards (REQUIRED READING)
- **[../docs/TechStack.md](../docs/TechStack.md)** - Technology stack overview
- **[../docs/PRD.md](../docs/PRD.md)** - Product requirements document
- **[../docs/BluePrint_Summary.md](../docs/BluePrint_Summary.md)** - System blueprint

### Development Scripts
```bash
npm start      # Run production server
npm run dev    # Run development server with auto-reload
npm run lint   # Check code with ESLint
npm run format # Auto-format code with Prettier
```

---

## File Organization

### Source Code (src/)

#### Entry Points
- `index.js` - Server startup and initialization
- `app.js` - Express app configuration

#### Request Handling
- `routes/health.routes.js` - Health check endpoint
- `controllers/healthController.js` - Request handler logic
- `services/healthService.js` - Business logic layer

#### Utilities
- `utils/ApiResponse.js` - Format success responses
- `utils/ApiError.js` - Custom error class
- `utils/asyncHandler.js` - Async error wrapper

#### Middleware
- `middlewares/logger.js` - HTTP request logging
- `middlewares/errorHandler.js` - Global error handling

#### Infrastructure
- `db/index.js` - MongoDB connection
- `constants/index.js` - Application constants

#### Folder Structure (Ready for Future)
- `config/` - Empty, for configuration modules
- `models/` - Empty, for Mongoose schemas
- `services/` - Ready for more services
- `controllers/` - Ready for more controllers
- `routes/` - Ready for more routes

### Configuration Files
- `.env` - Environment variables (user-configured)
- `.env.example` - Environment variables template
- `.eslintrc.json` - Linting rules
- `.prettierrc.json` - Code formatting
- `.gitignore` - Git ignore patterns
- `package.json` - Dependencies and scripts

---

## Understanding the Architecture

### Request Flow
```
Client Request
    ↓
CORS Middleware (Validate origin)
    ↓
Morgan Logger (Log request)
    ↓
Route Handler (Match path)
    ↓
Controller (Receive request)
    ↓
Service (Business logic)
    ↓
Response (Format and send)
    ↓
Client Response
```

### Error Flow
```
Error Thrown
    ↓
asyncHandler Catches (if async)
    ↓
Global Error Handler
    ↓
Error Formatted
    ↓
Error Response Sent
```

### Response Format
```javascript
Success:
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "statusCode": 200
}

Error:
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## Key Architectural Patterns

### 1. Service Layer Pattern
- Controllers call services
- Services contain business logic
- Models define database structure
- Benefit: Reusable, testable, clear responsibilities

### 2. Global Error Handling
- All errors thrown as ApiError
- Caught by error handler middleware
- Consistent format across API
- Benefit: No error handling boilerplate

### 3. Consistent Response Format
- All responses use ApiResponse class
- Success: { success, message, data, statusCode }
- Error: { success, message, statusCode }
- Benefit: Frontend always knows structure

### 4. Async Handler Wrapper
- Wrap async controller functions
- Automatically catches errors
- Forwards to error handler
- Benefit: Clean code, no try-catch

---

## Development Workflow

### Setting Up
```bash
# 1. Ensure MongoDB is running
# 2. Copy .env.example to .env
# 3. Configure .env with your values
# 4. Install dependencies
npm install

# 5. Start development server
npm run dev
```

### Testing
```bash
# Test health endpoint
curl http://localhost:8000/api/v1/health

# Test error handling
curl http://localhost:8000/api/v1/nonexistent

# Check code quality
npm run lint

# Format code
npm run format
```

### Creating New Features
```
1. Create route (src/routes/feature.routes.js)
2. Create controller (src/controllers/featureController.js)
3. Create service (src/services/featureService.js)
4. Create model if needed (src/models/Feature.js)
5. Register route in src/routes/index.js
6. Test endpoint
```

---

## Important Files to Know

### Critical for Understanding
1. **Guidelines.md** - MUST READ before making changes
2. **IMPLEMENTATION_GUIDE.md** - Why every decision was made
3. **src/app.js** - How Express is configured
4. **src/index.js** - How server starts

### Key Utilities
1. **ApiResponse.js** - Use for success responses
2. **ApiError.js** - Use for errors
3. **asyncHandler.js** - Wrap all async controllers

### Common Patterns
1. **Route → Controller → Service** - Always follow this
2. **Throw ApiError** - Never throw generic errors
3. **Use ApiResponse** - All successful responses
4. **No Try-Catch** - Use asyncHandler instead

---

## Configuration Reference

### Environment Variables
```
PORT                    - Server port (default: 8000)
NODE_ENV                - Environment (development/production)
MONGODB_URI             - MongoDB connection string
CORS_ORIGINS            - Comma-separated allowed origins
JWT_SECRET              - JWT signing key
JWT_REFRESH_SECRET      - Refresh token key
GOOGLE_CLIENT_ID        - Google OAuth client ID
GOOGLE_CLIENT_SECRET    - Google OAuth client secret
```

### CORS Configuration
- Allowed origins: http://localhost:3000, http://localhost:3001
- Configurable via CORS_ORIGINS environment variable

### Database Connection
- MongoDB connection required to start server
- Graceful failure if unavailable
- Connection pooling enabled

---

## Naming Conventions

### Folders
```
lowercase with underscores
src/config/
src/middlewares/
```

### Files
```
camelCase with appropriate extensions
healthController.js
authService.js
health.routes.js
```

### Variables
```
camelCase
const statusCode = 200;
let userData = {};
```

### Classes/Objects
```
PascalCase
class ApiResponse {}
const healthService = {}
```

### Constants
```
UPPER_SNAKE_CASE
const HTTP_STATUS = {...}
const CORS_ORIGINS = [...]
```

---

## Phase 01 Achievements

✅ Complete folder structure
✅ Request flow established
✅ Error handling centralized
✅ Response format consistent
✅ Database connection working
✅ Development tools configured
✅ Health check endpoint
✅ Comprehensive documentation
✅ Production-ready foundation

---

## Ready for Phase 02

Phase 02 will implement Authentication:
- User model
- Auth service
- Auth controller
- Auth routes
- JWT tokens
- Google OAuth
- Auth middleware

### What to Do
1. Create User model in src/models/User.js
2. Create auth service in src/services/authService.js
3. Create auth controller in src/controllers/authController.js
4. Create auth routes in src/routes/auth.routes.js
5. Update src/routes/index.js to include auth routes
6. Follow the same patterns established in Phase 01

---

## Troubleshooting

### Server Won't Start
1. Check MongoDB is running
2. Check .env file exists
3. Check MONGODB_URI is correct
4. Check PORT is not in use
5. Run `npm install` to ensure dependencies

### Health Endpoint Returns Error
1. Check MongoDB connection
2. Check server is running
3. Check port is correct (8000)
4. Check URL format: http://localhost:8000/api/v1/health

### Code Formatting Issues
1. Run `npm run format` to auto-format
2. Run `npm run lint` to check issues
3. Fix ESLint warnings before committing

---

## Resources

### Learning
- Express.js Documentation: https://expressjs.com/
- Mongoose Documentation: https://mongoosejs.com/
- MongoDB Documentation: https://docs.mongodb.com/

### Guidelines to Follow
- Guidelines.md (in docs folder)
- TechStack.md (in docs folder)

### Project Documentation
- README.md
- IMPLEMENTATION_GUIDE.md
- ARCHITECTURE_DIAGRAM.md
- PROJECT_STRUCTURE.txt

---

## Team Standards

### Code Review Checklist
- [ ] Follows Guidelines.md
- [ ] Error handling with ApiError
- [ ] Response format with ApiResponse
- [ ] Async handlers for controllers
- [ ] Service layer for logic
- [ ] No hardcoded values
- [ ] Comments where needed
- [ ] Passes linting

### Commit Standards
- [ ] Clear commit message
- [ ] One feature per commit
- [ ] Passes linting
- [ ] Tested locally

---

## Questions?

### Architecture Questions
- See IMPLEMENTATION_GUIDE.md

### Setup Questions
- See README.md

### Code Questions
- Check comments in code
- Review similar existing code
- Ask team lead

### Standards Questions
- Read Guidelines.md
- Review IMPLEMENTATION_GUIDE.md

---

## Quick Reference

### API Response Format
```javascript
// Success
new ApiResponse(200, { id: 1, name: "John" }, "User retrieved")
// → { success: true, message: "User retrieved", data: {...}, statusCode: 200 }

// Error
throw new ApiError(400, "Invalid email format")
// → { success: false, message: "Invalid email format", statusCode: 400 }
```

### Create New Endpoint
```javascript
// 1. routes/feature.routes.js
router.get('/feature/:id', getFeature);

// 2. controllers/featureController.js
export const getFeature = asyncHandler(async (req, res) => {
  const feature = await featureService.getFeatureById(req.params.id);
  return res.json(new ApiResponse(200, feature, "Feature retrieved"));
});

// 3. services/featureService.js
export const featureService = {
  getFeatureById: async (id) => {
    const feature = await Feature.findById(id);
    if (!feature) throw new ApiError(404, "Feature not found");
    return feature;
  }
};
```

---

## Status

**Phase 01**: ✅ COMPLETE

Ready for Phase 02 - Authentication Module

All documentation complete and up to date.

---

*Last Updated: July 31, 2026*
*Version: 1.0*
*Status: Production Ready*
