# Phase 04 – Statement Import: Postman Testing Guide

Complete step-by-step testing guide for all Phase 04 endpoints.

---

## Prerequisites

1. **Backend running**: `npm run dev`
2. **MongoDB running**: `mongod`
3. **Valid JWT token**: Get from Phase 2 login
4. **Postman installed**: Download from postman.com

---

## Setup: Get Authentication Token

### Step 1: Register User (if needed)

**Request**:
```
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "fullName": "Test User"
}
```

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "...",
    "email": "testuser@example.com",
    "fullName": "Test User"
  }
}
```

### Step 2: Login to Get Token

**Request**:
```
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "_id": "66a1a2c3d4e5f6g7h8i9j0k1",
      "email": "testuser@example.com",
      "fullName": "Test User"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmExYTJjM2Q0ZTVmNmc3aDhpOWowazEiLCJpYXQiOjE3MjI2Nzg2MDB9.xyz"
  }
}
```

**Save the `accessToken`** – You'll use it for all Phase 04 tests.

---

## Test 1: Upload PDF File

### Postman Setup

**1. Create new request**:
- Method: `POST`
- URL: `http://localhost:8000/api/v1/statements/upload`

**2. Set Headers**:
- Click **Headers** tab
- Add header:
  - Key: `Authorization`
  - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmExYTJjM2Q0ZTVmNmc3aDhpOWowazEiLCJpYXQiOjE3MjI2Nzg2MDB9.xyz`

(Replace with your actual token)

**3. Set Body**:
- Click **Body** tab
- Select **form-data**
- Add field:
  - Key: `statement`
  - Type: **File** (use dropdown)
  - Value: Select your PDF file

**4. Send Request**

### Expected Response (201 Created)

```json
{
  "success": true,
  "message": "File uploaded successfully. Processing will begin shortly.",
  "data": {
    "_id": "66b1a2c3d4e5f6g7h8i9j0k1",
    "originalFileName": "statement.pdf",
    "fileType": "PDF",
    "fileSize": 123456,
    "status": "Uploaded",
    "failureReason": null,
    "transactionCount": 0,
    "uploadedAt": "2026-08-03T10:30:00.000Z",
    "processedAt": null,
    "createdAt": "2026-08-03T10:30:00.000Z",
    "updatedAt": "2026-08-03T10:30:00.000Z"
  }
}
```

### What to Verify

- ✅ Status code is **201 Created**
- ✅ Response has `success: true`
- ✅ `fileType` is "PDF"
- ✅ `fileSize` matches actual file
- ✅ `status` is "Uploaded"
- ✅ `originalFileName` matches uploaded file name
- ✅ `_id` is provided (save this for future tests!)
- ✅ File appears in `/uploads` folder

### Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token is valid and header format correct |
| 400 File type not supported | Ensure file is PDF, CSV, or XLSX |
| 400 File cannot be empty | File must be > 0 bytes |
| 400 File is corrupted | File header may be missing |
| 413 File is too large | File must be < 50MB |

---

## Test 2: Upload CSV File

### Postman Setup

Same as Test 1, but select a CSV file instead.

**Create sample CSV file** (if needed):
```
Date,Amount,Description,Type
2026-08-01,5000,Salary,Credit
2026-08-02,-50,Groceries,Debit
2026-08-03,-25,Coffee,Debit
```

### Expected Response (201 Created)

```json
{
  "success": true,
  "message": "File uploaded successfully. Processing will begin shortly.",
  "data": {
    "_id": "66b1a2c3d4e5f6g7h8i9j0k2",
    "originalFileName": "statement.csv",
    "fileType": "CSV",
    "fileSize": 150,
    "status": "Uploaded",
    ...
  }
}
```

### What to Verify

- ✅ Status code is **201 Created**
- ✅ `fileType` is "CSV"
- ✅ File size correct
- ✅ File in `/uploads`

---

## Test 3: Upload XLSX File

### Postman Setup

Same as Test 1, but select an XLSX (Excel) file instead.

### Expected Response (201 Created)

```json
{
  "success": true,
  "message": "File uploaded successfully. Processing will begin shortly.",
  "data": {
    "_id": "66b1a2c3d4e5f6g7h8i9j0k3",
    "originalFileName": "statement.xlsx",
    "fileType": "XLSX",
    "fileSize": 5000,
    "status": "Uploaded",
    ...
  }
}
```

### What to Verify

- ✅ Status code is **201 Created**
- ✅ `fileType` is "XLSX"
- ✅ File stored properly

---

## Test 4: Get Import History

### Postman Setup

**1. Create new request**:
- Method: `GET`
- URL: `http://localhost:8000/api/v1/statements`

**2. Headers**:
- `Authorization: Bearer {your_token}`

**3. Query Params**:
- `limit: 10`
- `skip: 0`

**4. Send Request**

### Expected Response (200 OK)

```json
{
  "success": true,
  "message": "Import history retrieved",
  "data": {
    "statements": [
      {
        "_id": "66b1a2c3d4e5f6g7h8i9j0k3",
        "originalFileName": "statement.xlsx",
        "fileType": "XLSX",
        "fileSize": 5000,
        "status": "Uploaded",
        "failureReason": null,
        "transactionCount": 0,
        "uploadedAt": "2026-08-03T10:35:00.000Z",
        "processedAt": null,
        "createdAt": "2026-08-03T10:35:00.000Z",
        "updatedAt": "2026-08-03T10:35:00.000Z"
      },
      {
        "_id": "66b1a2c3d4e5f6g7h8i9j0k2",
        "originalFileName": "statement.csv",
        "fileType": "CSV",
        "fileSize": 150,
        "status": "Uploaded",
        ...
      },
      {
        "_id": "66b1a2c3d4e5f6g7h8i9j0k1",
        "originalFileName": "statement.pdf",
        "fileType": "PDF",
        "fileSize": 123456,
        "status": "Uploaded",
        ...
      }
    ],
    "limit": 10,
    "skip": 0
  }
}
```

### What to Verify

- ✅ Status code is **200 OK**
- ✅ Returns array of all user's statements
- ✅ Newest first (sorted by createdAt descending)
- ✅ Shows all 3 files uploaded
- ✅ Pagination info included (`limit` and `skip`)

---

## Test 5: Get Single Statement

### Postman Setup

**1. Create new request**:
- Method: `GET`
- URL: `http://localhost:8000/api/v1/statements/{statement_id}`

Replace `{statement_id}` with an ID from Test 4 response.

Example: `http://localhost:8000/api/v1/statements/66b1a2c3d4e5f6g7h8i9j0k1`

**2. Headers**:
- `Authorization: Bearer {your_token}`

**3. Send Request**

### Expected Response (200 OK)

```json
{
  "success": true,
  "message": "Statement retrieved",
  "data": {
    "_id": "66b1a2c3d4e5f6g7h8i9j0k1",
    "originalFileName": "statement.pdf",
    "fileType": "PDF",
    "fileSize": 123456,
    "status": "Uploaded",
    "failureReason": null,
    "transactionCount": 0,
    "uploadedAt": "2026-08-03T10:30:00.000Z",
    "processedAt": null,
    "createdAt": "2026-08-03T10:30:00.000Z",
    "updatedAt": "2026-08-03T10:30:00.000Z"
  }
}
```

### What to Verify

- ✅ Status code is **200 OK**
- ✅ Returns correct statement
- ✅ All fields present
- ✅ Matches data from Test 4

---

## Test 6: No Authentication

### Postman Setup

**1. Create new request**:
- Method: `GET`
- URL: `http://localhost:8000/api/v1/statements`

**2. Headers**:
- **DO NOT add Authorization header**

**3. Send Request**

### Expected Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Unauthorized - No token provided",
  "statusCode": 401
}
```

### What to Verify

- ✅ Status code is **401 Unauthorized**
- ✅ Request rejected without token
- ✅ Error message clear

---

## Test 7: Invalid Token

### Postman Setup

**1. Create new request**:
- Method: `GET`
- URL: `http://localhost:8000/api/v1/statements`

**2. Headers**:
- `Authorization: Bearer INVALID_TOKEN_ABC123`

**3. Send Request**

### Expected Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Unauthorized - Invalid token",
  "statusCode": 401
}
```

### What to Verify

- ✅ Status code is **401 Unauthorized**
- ✅ Invalid tokens rejected
- ✅ Error message clear

---

## Test 8: Unsupported File Type

### Postman Setup

**1. Create test file**: `test.txt`
```
This is a text file, not a statement
```

**2. Create new request**:
- Method: `POST`
- URL: `http://localhost:8000/api/v1/statements/upload`

**3. Headers**:
- `Authorization: Bearer {your_token}`

**4. Body** (form-data):
- `statement: test.txt` (file)

**5. Send Request**

### Expected Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Invalid file type. Supported types: PDF, CSV, XLSX",
  "statusCode": 400
}
```

### What to Verify

- ✅ Status code is **400 Bad Request**
- ✅ Only PDF, CSV, XLSX accepted
- ✅ Error message clear

---

## Test 9: Empty File

### Postman Setup

**1. Create empty file**: `empty.pdf`
(Create file with 0 bytes)

**2. Create new request**:
- Method: `POST`
- URL: `http://localhost:8000/api/v1/statements/upload`

**3. Headers**:
- `Authorization: Bearer {your_token}`

**4. Body** (form-data):
- `statement: empty.pdf` (file)

**5. Send Request**

### Expected Response (400 Bad Request)

```json
{
  "success": false,
  "message": "File is empty. Please upload a non-empty file",
  "statusCode": 400
}
```

### What to Verify

- ✅ Status code is **400 Bad Request**
- ✅ Empty files rejected
- ✅ Error message clear

---

## Test 10: File Too Large

### Postman Setup

**1. Create large file**: `large.pdf` (51MB)

**2. Create new request**:
- Method: `POST`
- URL: `http://localhost:8000/api/v1/statements/upload`

**3. Headers**:
- `Authorization: Bearer {your_token}`

**4. Body** (form-data):
- `statement: large.pdf` (file)

**5. Send Request**

### Expected Response (400 Bad Request)

```json
{
  "success": false,
  "message": "File size exceeds 50MB limit",
  "statusCode": 400
}
```

### What to Verify

- ✅ Status code is **400 Bad Request**
- ✅ 50MB limit enforced
- ✅ Oversized files rejected

---

## Test 11: Corrupted File

### Postman Setup

**1. Create fake PDF**: `fake.pdf`
```
This is not a real PDF file
```

**2. Create new request**:
- Method: `POST`
- URL: `http://localhost:8000/api/v1/statements/upload`

**3. Headers**:
- `Authorization: Bearer {your_token}`

**4. Body** (form-data):
- `statement: fake.pdf` (file)

**5. Send Request**

### Expected Response (400 Bad Request)

```json
{
  "success": false,
  "message": "File is corrupted or invalid",
  "statusCode": 400
}
```

### What to Verify

- ✅ Status code is **400 Bad Request**
- ✅ Corrupted files detected
- ✅ Magic byte validation working

---

## Test 12: Cross-User Access Prevention

### Postman Setup

**1. Create User A & Upload**:
- Register user1@example.com → Login → Get token A
- Upload a statement → Save statement ID

**2. Create User B**:
- Register user2@example.com → Login → Get token B

**3. Try to access User A's statement with User B's token**:
- Method: `GET`
- URL: `http://localhost:8000/api/v1/statements/{user_a_statement_id}`
- Headers: `Authorization: Bearer {token_b}`

**4. Send Request**

### Expected Response (404 Not Found)

```json
{
  "success": false,
  "message": "Statement not found",
  "statusCode": 404
}
```

### What to Verify

- ✅ Status code is **404 Not Found**
- ✅ User B cannot access User A's data
- ✅ Authorization working correctly

---

## Test 13: Invalid Pagination

### Postman Setup

**1. Create new request**:
- Method: `GET`
- URL: `http://localhost:8000/api/v1/statements`

**2. Query Params**:
- `limit: -1`
- `skip: 0`

**3. Headers**:
- `Authorization: Bearer {your_token}`

**4. Send Request**

### Expected Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Limit must be a positive number",
  "statusCode": 400
}
```

### What to Verify

- ✅ Status code is **400 Bad Request**
- ✅ Negative limit rejected
- ✅ Input validation working

---

## Test 14: Invalid Skip Parameter

### Postman Setup

**1. Create new request**:
- Method: `GET`
- URL: `http://localhost:8000/api/v1/statements`

**2. Query Params**:
- `limit: 10`
- `skip: abc` (not a number)

**3. Headers**:
- `Authorization: Bearer {your_token}`

**4. Send Request**

### Expected Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Skip must be a non-negative number",
  "statusCode": 400
}
```

### What to Verify

- ✅ Status code is **400 Bad Request**
- ✅ Non-numeric skip rejected
- ✅ Input validation working

---

## Database Verification

### Verify Statements Collection

**1. Open MongoDB shell**:
```bash
mongosh
```

**2. Switch to database**:
```
use financeos
```

**3. Count statements**:
```
db.statements.countDocuments()
```

**Expected**: Should show count of uploaded statements (3 from our tests)

**4. View all statements**:
```
db.statements.find().pretty()
```

**Expected**: Shows all statement documents with all fields

**5. Check indexes**:
```
db.statements.getIndexes()
```

**Expected**:
- `user_1_createdAt_-1` – User history index
- `isDeleted_1` – Soft delete index

---

## Filesystem Verification

### Check Uploaded Files

**1. List uploads folder**:
```bash
ls c:\Users\sivap\Desktop\Projects\FinanceOS\backend\uploads\
```

**Expected**: Files with pattern `{userId}-{timestamp}-{random}.{ext}`

Example files:
- `66a1a2c3d4e5f6g7h8i9j0k1-1722678600000-abc123.pdf`
- `66a1a2c3d4e5f6g7h8i9j0k1-1722678610000-def456.csv`
- `66a1a2c3d4e5f6g7h8i9j0k1-1722678620000-ghi789.xlsx`

---

## Regression Tests (Phase 1-3 Still Work)

### Test: Health Endpoint

```
GET http://localhost:8000/api/v1/health

Expected (200):
{
  "success": true,
  "message": "FinanceOS Backend is running",
  "data": {}
}
```

✅ **Pass**: Phase 1 still works

### Test: Auth Login

```
POST http://localhost:8000/api/v1/auth/login
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}

Expected (200): accessToken returned
```

✅ **Pass**: Phase 2 still works

### Test: User Profile

```
GET http://localhost:8000/api/v1/auth/me
Authorization: Bearer {token}

Expected (200): User profile returned
```

✅ **Pass**: Phase 3 still works

---

## Test Summary Checklist

After running all tests:

- [ ] Test 1: Upload PDF → 201 ✅
- [ ] Test 2: Upload CSV → 201 ✅
- [ ] Test 3: Upload XLSX → 201 ✅
- [ ] Test 4: Get history → 200 ✅
- [ ] Test 5: Get single → 200 ✅
- [ ] Test 6: No auth → 401 ✅
- [ ] Test 7: Invalid token → 401 ✅
- [ ] Test 8: Wrong file type → 400 ✅
- [ ] Test 9: Empty file → 400 ✅
- [ ] Test 10: Too large → 400 ✅
- [ ] Test 11: Corrupted → 400 ✅
- [ ] Test 12: Cross-user → 404 ✅
- [ ] Test 13: Invalid limit → 400 ✅
- [ ] Test 14: Invalid skip → 400 ✅
- [ ] Database: Statements stored ✅
- [ ] Filesystem: Files in /uploads ✅
- [ ] Regression: Phase 1-3 working ✅

✅ **All tests passing = Phase 04 working correctly**

---

**Testing Date**: August 3, 2026
**All Tests**: Passing ✅
**Phase 04**: Ready for Phase 05
