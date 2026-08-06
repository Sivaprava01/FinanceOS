# FinanceOS Complete Testing Checklist

**Purpose**: Step-by-step verification that all functionality is working correctly.

**How to Use**: 
1. Follow each section in order
2. Check off each item as you verify it
3. Record any failures for debugging

---

## PART 1: SETUP (Prerequisites)

- [ ] MongoDB running: `mongod` (separate terminal)
- [ ] Backend running: `npm run dev` in `/backend` folder
- [ ] Postman open: https://www.postman.com/downloads/
- [ ] Check backend is live:
  ```
  GET http://localhost:8000/api/v1/health
  Expected: { success: true, message: "FinanceOS running" }
  ```

---

## PART 2: AUTHENTICATION (Phase 02)

### Register New Test User

**Postman Request**:
```
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "fullName": "Test User"
}
```

**Expected Response**: `201 Created`
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

- [ ] Registration successful
- [ ] User ID received
- [ ] No errors

### Login to Get JWT Token

**Postman Request**:
```
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Expected Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": { "_id": "...", "email": "..." },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

- [ ] Login successful
- [ ] JWT token received
- [ ] Copy token to clipboard (use in all following requests)

### Test Auth Protection

**Postman Request** (without token):
```
GET http://localhost:8000/api/v1/statements
(NO Authorization header)
```

**Expected Response**: `401 Unauthorized`
```json
{
  "success": false,
  "message": "No token provided",
  "statusCode": 401
}
```

- [ ] Unauthorized request rejected (good security)

---

## PART 3: STATEMENT UPLOAD (Phase 04)

### Prepare Test File

- [ ] Download a sample bank statement PDF to your computer
  - Or use any PDF with financial data
  - Save as `statement.pdf` to `/Desktop` for easy access

### Upload PDF Statement

**Postman Setup**:
1. Method: `POST`
2. URL: `http://localhost:8000/api/v1/statements/upload`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
4. Body: **form-data**
   - Key: `statement`
   - Type: **File**
   - Value: Select your `statement.pdf`

**Send Request**

**Expected Response**: `201 Created`
```json
{
  "success": true,
  "message": "File uploaded successfully. Processing will begin shortly.",
  "data": {
    "_id": "66b1a2c3d4e5f6g7h8i9j0k1",
    "originalFileName": "statement.pdf",
    "fileType": "PDF",
    "status": "Uploaded",
    "uploadedAt": "2026-08-04T10:30:00Z"
  }
}
```

- [ ] Upload successful (201)
- [ ] Statement ID received: `_id`
- [ ] File stored on disk (visible in `/backend/uploads/` folder)
- [ ] File integrity validation passed
- [ ] Status shows "Uploaded"

**Save the statement ID** — Use for Phase 05 tests.

### Upload CSV Statement (Alternative)

**Create CSV file** at `/Desktop/statement.csv`:
```csv
Date,Description,Amount,Type
2026-08-01,Salary Deposit,5000,Credit
2026-08-02,Amazon Purchase,50,Debit
2026-08-03,Grocery Store,100,Debit
```

**Upload same way as PDF** (just use CSV file instead)

- [ ] CSV uploads successfully
- [ ] CSV validation passes
- [ ] CSV file stored

### List All Statements

**Postman Request**:
```
GET http://localhost:8000/api/v1/statements
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response**: `200 OK`
```json
{
  "success": true,
  "message": "Statements retrieved successfully",
  "data": {
    "statements": [
      {
        "_id": "66b1a2c3d4e5f6g7h8i9j0k1",
        "originalFileName": "statement.pdf",
        "fileType": "PDF",
        "status": "Uploaded",
        "uploadedAt": "2026-08-04T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

- [ ] List returns all uploaded statements
- [ ] Count is correct
- [ ] Each statement shows correct metadata

### Get Single Statement

**Postman Request**:
```
GET http://localhost:8000/api/v1/statements/66b1a2c3d4e5f6g7h8i9j0k1
Authorization: Bearer YOUR_JWT_TOKEN
```

(Replace `66b1a2c3d4e5f6g7h8i9j0k1` with your statement ID)

**Expected Response**: `200 OK`
```json
{
  "success": true,
  "message": "Statement retrieved successfully",
  "data": {
    "_id": "66b1a2c3d4e5f6g7h8i9j0k1",
    "originalFileName": "statement.pdf",
    "fileType": "PDF",
    "status": "Uploaded",
    "uploadedAt": "2026-08-04T10:30:00Z"
  }
}
```

- [ ] Single statement retrieval works
- [ ] Correct statement returned
- [ ] Metadata matches upload

### Verify File on Disk

**Terminal Command** (in `/backend` folder):
```bash
ls uploads/
```

**Expected**: File named something like `66a1a2c3d4e5f6g7h8i9j0k1-1722678600000-abc123.pdf`

- [ ] File exists in `/uploads/` folder
- [ ] Filename matches format

---

## PART 4: TRANSACTION EXTRACTION (Phase 05)

### Extract Transactions from PDF

**Postman Setup**:
1. Method: `POST`
2. URL: `http://localhost:8000/api/v1/transactions/extract`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
4. Body (raw JSON):

```json
{
  "statementId": "66b1a2c3d4e5f6g7h8i9j0k1",
  "filePath": "/uploads/66a1a2c3d4e5f6g7h8i9j0k1-1722678600000-abc123.pdf",
  "fileType": "PDF"
}
```

(Replace `statementId` and `filePath` with your actual values)

**Send Request**

**Expected Response**: `200 OK`
```json
{
  "success": true,
  "message": "Transactions extracted successfully",
  "data": {
    "statementId": "66b1a2c3d4e5f6g7h8i9j0k1",
    "transactionCount": 3,
    "transactions": [
      {
        "date": "2026-08-01T00:00:00Z",
        "amount": 5000,
        "type": "Credit",
        "merchant": "Salary Deposit",
        "description": "Monthly Salary",
        "originalMerchant": "EMPLOYER BANK TRANSFER",
        "originalAmount": 5000,
        "originalType": "Credit"
      },
      {
        "date": "2026-08-02T00:00:00Z",
        "amount": 50,
        "type": "Debit",
        "merchant": "Amazon",
        "description": "Online Purchase",
        "originalMerchant": "AMAZON *MKTPLC",
        "originalAmount": 50,
        "originalType": "Debit"
      }
    ]
  }
}
```

**What to verify**:
- [ ] Extraction successful (200 OK)
- [ ] Transactions extracted
- [ ] Transaction count matches expected
- [ ] Each transaction has:
  - [ ] date (ISO format)
  - [ ] amount (number)
  - [ ] type (Debit or Credit)
  - [ ] merchant (string)
  - [ ] description (string)
  - [ ] originalMerchant (original bank name)
  - [ ] originalAmount (original amount)

**Save transactions array** — You'll use this for import test.

---

## PART 5: TRANSACTION OPERATIONS (Phase 05)

### Get Transaction Ready for Review

**Postman Request**:
```
GET http://localhost:8000/api/v1/transactions/review/66b1a2c3d4e5f6g7h8i9j0k1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response**: `200 OK`

- [ ] Review endpoint returns status
- [ ] Status shows "ready_for_review" or similar

### Learn Merchant Mapping

**Postman Setup**:
1. Method: `POST`
2. URL: `http://localhost:8000/api/v1/transactions/learn-merchant`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
4. Body (raw JSON):

```json
{
  "originalMerchant": "AMAZON *MKTPLC",
  "correctedMerchant": "Amazon"
}
```

**Send Request**

**Expected Response**: `201 Created`

- [ ] Merchant mapping learned (201)
- [ ] originalMerchant stored (normalized to lowercase)
- [ ] correctedMerchant stored exactly as provided
- [ ] count starts at 1

---

## PART 6: TRANSACTION IMPORT (Phase 05 Main)

### Import All Transactions

**Postman Setup**:
1. Method: `POST`
2. URL: `http://localhost:8000/api/v1/transactions/import`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
4. Body (raw JSON): Use the transactions array from extraction test:

```json
{
  "statementId": "66b1a2c3d4e5f6g7h8i9j0k1",
  "filePath": "/uploads/66a1a2c3d4e5f6g7h8i9j0k1-1722678600000-abc123.pdf",
  "transactions": [
    {
      "date": "2026-08-01T00:00:00Z",
      "amount": 5000,
      "type": "Credit",
      "merchant": "Salary Deposit",
      "description": "Monthly Salary",
      "originalMerchant": "EMPLOYER BANK TRANSFER",
      "originalAmount": 5000,
      "originalType": "Credit"
    },
    {
      "date": "2026-08-02T00:00:00Z",
      "amount": 50,
      "type": "Debit",
      "merchant": "Amazon",
      "description": "Online Purchase",
      "originalMerchant": "AMAZON *MKTPLC",
      "originalAmount": 50,
      "originalType": "Debit"
    }
  ]
}
```

**Send Request**

**Expected Response**: `200 OK`
```json
{
  "success": true,
  "message": "Successfully imported 2 transactions",
  "data": {
    "statementId": "66b1a2c3d4e5f6g7h8i9j0k1",
    "transactionCount": 2,
    "success": true
  }
}
```

- [ ] Import successful (200 OK)
- [ ] Correct number of transactions imported
- [ ] Success flag set to true

### Verify Automatic File Deletion

**Terminal Command** (in `/backend` folder):
```bash
ls uploads/
```

**Expected**: File should be GONE (deleted after successful import)

- [ ] Uploaded file automatically deleted
- [ ] Temporary files cleaned up
- [ ] Privacy preserved

### Get All Transactions (Verify Import)

**Postman Request**:
```
GET http://localhost:8000/api/v1/transactions?limit=50&skip=0
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response**: `200 OK` with imported transactions

- [ ] Transactions list returns imported transactions
- [ ] Count matches number imported
- [ ] Each transaction has `_id` (database ID)
- [ ] Each transaction shows both original and corrected values

**Save a transaction ID** — Use for next test.

### Get Single Transaction

**Postman Request**:
```
GET http://localhost:8000/api/v1/transactions/66c2a2c3d4e5f6g7h8i9j0k5
Authorization: Bearer YOUR_JWT_TOKEN
```

(Replace `66c2a2c3d4e5f6g7h8i9j0k5` with actual transaction ID)

**Expected Response**: `200 OK`

- [ ] Single transaction retrieved
- [ ] All fields present
- [ ] Correct transaction returned

### Update Transaction (Correction)

**Postman Setup**:
1. Method: `PUT`
2. URL: `http://localhost:8000/api/v1/transactions/66c2a2c3d4e5f6g7h8i9j0k5`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
4. Body (raw JSON):

```json
{
  "merchant": "Amazon.com",
  "description": "Updated description",
  "category": "Shopping",
  "amount": 49.99
}
```

**Send Request**

**Expected Response**: `200 OK`

- [ ] Transaction updated (200)
- [ ] Updated fields show new values
- [ ] `isEdited` flag set to true
- [ ] `editedAt` timestamp updated
- [ ] Original values still preserved in response
- [ ] If merchant changed: `merchantLearningOpportunity` appears in response

---

## PART 7: DATABASE VERIFICATION

### Check Transactions Collection

**Open Terminal or MongoDB Compass**:

```bash
mongosh
use financeos
db.transactions.find({ user: ObjectId("YOUR_USER_ID") }).count()
```

**Expected**: Should show number of imported transactions

- [ ] Transactions exist in database
- [ ] User ID isolation working (only your transactions)

### Check Single Transaction Data

```bash
db.transactions.findOne()
```

**Expected**: Transaction document with fields

- [ ] _id
- [ ] user (your user ID)
- [ ] date
- [ ] amount
- [ ] type
- [ ] merchant
- [ ] originalMerchant
- [ ] originalAmount
- [ ] createdAt
- [ ] updatedAt

- [ ] All fields present

### Check Merchant Mappings

```bash
db.merchantmapping.find({ user: ObjectId("YOUR_USER_ID") })
```

**Expected**: Mappings if you did "Learn Merchant" test

- [ ] Merchant mappings exist (if learned)
- [ ] extractedName (lowercase)
- [ ] correctedName (exact format)

### Check Statement Status

```bash
db.statements.findOne({ _id: ObjectId("YOUR_STATEMENT_ID") })
```

**Expected**: Statement shows status "Completed" after import

- [ ] status changed from "Uploaded" to "Completed"
- [ ] transactionCount shows imported count
- [ ] processedAt timestamp set

- [ ] Database integrity verified

---

## PART 8: SECURITY TESTS

### Test 401 - No Token

**Postman Request** (NO Authorization header):
```
GET http://localhost:8000/api/v1/transactions
```

**Expected Response**: `401 Unauthorized`

- [ ] Request rejected without token

### Test 401 - Invalid Token

**Postman Request**:
```
GET http://localhost:8000/api/v1/transactions
Authorization: Bearer INVALID_TOKEN_12345
```

**Expected Response**: `401 Unauthorized`

- [ ] Request rejected with invalid token

### Test 404 - Cross-User Access

**Setup**: If you have another test user account:

1. Login as User A (get token A, import transactions)
2. Login as User B (get token B)
3. Try to access User A's transaction with User B's token:

```
GET http://localhost:8000/api/v1/transactions/USER_A_TRANSACTION_ID
Authorization: Bearer USER_B_TOKEN
```

**Expected Response**: `404 Not Found` or user isolation verified

- [ ] User B cannot see User A's transactions
- [ ] Data isolation working

---

## PART 9: VALIDATION TESTS

### Test 400 - Empty Transactions Array

**Postman Request**:
```
POST http://localhost:8000/api/v1/transactions/import
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "statementId": "...",
  "transactions": []
}
```

**Expected Response**: `400 Bad Request`

- [ ] Empty array rejected

### Test 400 - Invalid Date Format

**Postman Request**:
```
POST http://localhost:8000/api/v1/transactions/import
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "statementId": "...",
  "transactions": [
    {
      "date": "not-a-date",
      "amount": 50,
      "type": "Debit",
      "merchant": "Test"
    }
  ]
}
```

**Expected Response**: `400 Bad Request`

- [ ] Invalid date rejected

### Test 400 - Invalid Type

**Postman Request**:
```
POST http://localhost:8000/api/v1/transactions/import
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "statementId": "...",
  "transactions": [
    {
      "date": "2026-08-01T00:00:00Z",
      "amount": 50,
      "type": "InvalidType",
      "merchant": "Test"
    }
  ]
}
```

**Expected Response**: `400 Bad Request`

- [ ] Invalid type rejected

---

## PART 10: REGRESSION TESTS (Phases 1-4 Still Work)

### Health Check

```
GET http://localhost:8000/api/v1/health
```

**Expected**: `200 OK` with "FinanceOS running"

- [ ] Health endpoint working

### Auth Endpoints

```
GET http://localhost:8000/api/v1/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected**: `200 OK` with user profile

- [ ] Auth endpoints still work
- [ ] Profile endpoint functional

### Statement Endpoints (Phase 04)

```
GET http://localhost:8000/api/v1/statements
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected**: `200 OK` with list of statements

- [ ] Statement list still works
- [ ] Phase 04 endpoints not broken

---

## FINAL CHECKLIST

### All Tests Passed?

- [ ] Part 1 Setup ✅
- [ ] Part 2 Authentication ✅
- [ ] Part 3 Statement Upload ✅
- [ ] Part 4 Transaction Extraction ✅
- [ ] Part 5 Transaction Operations ✅
- [ ] Part 6 Transaction Import ✅
- [ ] Part 7 Database Verification ✅
- [ ] Part 8 Security Tests ✅
- [ ] Part 9 Validation Tests ✅
- [ ] Part 10 Regression Tests ✅

### Result

**If all checked**: ✅ **ALL SYSTEMS OPERATIONAL**

**If any unchecked**: ❌ Record issue below

---

## Issues Found (if any)

| Test | Expected | Actual | Severity |
|------|----------|--------|----------|
|      |          |        |          |
|      |          |        |          |
|      |          |        |          |

---

**Testing Date**: August 4, 2026  
**Tester**: Your Name  
**Status**: Ready for Phase 06 ✅

