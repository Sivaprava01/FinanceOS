# Phase 05 – Transaction Processing: Postman Testing Guide (Fresh)

Complete step-by-step testing guide for all Phase 05 endpoints.

**Updated**: Cleaned for fresh testing run. Start here.

---

## Prerequisites

1. **Backend running**: `npm run dev`
2. **MongoDB running**: `mongod`
3. **Postman installed**: postman.com
4. **Test PDF file**: Download or create a valid bank statement PDF

---

## SETUP: Complete These First

### Step 0a: Clear Old Data (Fresh Start)

**Terminal**:
```bash
mongosh
use financeos
db.statements.deleteMany({})
db.transactions.deleteMany({})
db.merchantmapping.deleteMany({})
```

Exit mongosh and confirm:
```bash
db.statements.countDocuments()  # Should show 0
```

### Step 0b: Register & Login (If Needed)

**Register**:
```
POST http://localhost:8000/api/v1/auth/register
{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "fullName": "Test User"
}
```

**Login**:
```
POST http://localhost:8000/api/v1/auth/login
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Save the JWT token** — Use in all requests below.

### Step 0c: Prepare Test PDF

Create a simple bank statement PDF (or use a real one) with clear formatting.

**Best format for testing**:
```
STATEMENT: July 1, 2026 - July 31, 2026

Date        Description              Amount       Type
01/07/2026  Salary Deposit          5000.00      Credit
02/07/2026  Amazon Purchase          -50.00      Debit
03/07/2026  Coffee Shop              -5.50       Debit
05/07/2026  ATM Withdrawal           -500.00     Debit
10/07/2026  Freelance Payment        1200.00     Credit
```

---

## Test 1: Upload Statement (Phase 04)

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/statements/upload`

**Headers**:
```
Authorization: Bearer {your_token}
```

**Body**: form-data
- Key: `statement`
- Type: **File**
- Value: Select your PDF file

### Send & Verify

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "File uploaded successfully. Processing will begin shortly.",
  "data": {
    "_id": "YOUR_STATEMENT_ID",
    "originalFileName": "statement.pdf",
    "filePath": "/uploads/YOUR_USERID-TIMESTAMP-RANDOM.pdf",
    "fileType": "PDF",
    "status": "Uploaded"
  }
}
```

**Save**:
- `_id` → use as `statementId` in next tests
- `filePath` → shows actual file location

✅ **Confirm**: File appears in `/backend/uploads/` folder

---

## Test 2: Extract Transactions from Statement

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/transactions/extract`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body (raw JSON)** — Use statementId from Test 1:
```json
{
  "statementId": "YOUR_STATEMENT_ID"
}
```

### Send & Verify

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Transactions extracted successfully",
  "data": {
    "statementId": "YOUR_STATEMENT_ID",
    "transactionCount": 5,
    "transactions": [
      {
        "date": "2026-07-01T00:00:00Z",
        "amount": 5000,
        "type": "Credit",
        "merchant": "Salary Deposit",
        "description": "Salary Deposit",
        "originalDate": "2026-07-01T00:00:00Z",
        "originalAmount": 5000,
        "originalType": "Credit",
        "originalMerchant": "Salary Deposit"
      },
      // ... more transactions
    ],
    "nextStep": "Review transactions and make any corrections, then import"
  }
}
```

**What to verify**:
- ✅ Status is 200 OK
- ✅ transactionCount matches number of transactions extracted
- ✅ Each transaction has all fields
- ✅ Dates are ISO format
- ✅ Types are "Debit" or "Credit"
- ✅ Amounts are positive numbers

**If it fails**:
- ❌ "File not found" → Check filePath is stored correctly in DB
- ❌ "No transactions found" → PDF format not recognized by parser
- ❌ "404 Statement not found" → Check statementId is correct

**Save the transactions array** — Use in import test

---

## Test 3: Get Transactions Ready for Review

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/review/YOUR_STATEMENT_ID`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send & Verify

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Ready for transaction review",
  "data": {
    "statementId": "YOUR_STATEMENT_ID",
    "originalFileName": "statement.pdf",
    "fileType": "PDF",
    "status": "ready_for_review"
  }
}
```

✅ Confirms statement is ready

---

## Test 4: Update Transaction (Optional Correction)

### Postman Setup

**Method**: `PUT`  
**URL**: `http://localhost:8000/api/v1/transactions/{transaction_id}`

Get `transaction_id` from Test 5 (list all) **after** importing.

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body (raw JSON)** — Update any fields:
```json
{
  "merchant": "Amazon.com",
  "description": "Online shopping",
  "category": "Shopping",
  "amount": 49.99
}
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    "_id": "transaction_id",
    "merchant": "Amazon.com",
    "isEdited": true,
    "editedAt": "2026-08-05T10:30:00Z"
  }
}
```

✅ Transaction updated with corrections

---

## Test 5: Learn Merchant Mapping (Optional)

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/transactions/learn-merchant`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body**:
```json
{
  "originalMerchant": "AMAZON *MKTPLC",
  "correctedMerchant": "Amazon"
}
```

**Expected Response (201)**:
```json
{
  "success": true,
  "message": "Merchant mapping learned successfully",
  "data": {
    "extractedName": "amazon *mktplc",
    "correctedName": "Amazon",
    "count": 1
  }
}
```

✅ Merchant mapping saved

---

## Test 6: Import Transactions (MAIN TEST)

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/transactions/import`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body** — Use the transactions array from Test 2:
```json
{
  "statementId": "YOUR_STATEMENT_ID",
  "transactions": [
    {
      "date": "2026-07-01T00:00:00Z",
      "amount": 5000,
      "type": "Credit",
      "merchant": "Salary Deposit",
      "description": "Salary Deposit",
      "originalDate": "2026-07-01T00:00:00Z",
      "originalAmount": 5000,
      "originalType": "Credit",
      "originalMerchant": "Salary Deposit"
    },
    {
      "date": "2026-07-02T00:00:00Z",
      "amount": 50,
      "type": "Debit",
      "merchant": "Amazon",
      "description": "Amazon Purchase",
      "originalDate": "2026-07-02T00:00:00Z",
      "originalAmount": 50,
      "originalType": "Debit",
      "originalMerchant": "Amazon"
    }
  ]
}
```

### Send & Verify

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Successfully imported 5 transactions",
  "data": {
    "statementId": "YOUR_STATEMENT_ID",
    "transactionCount": 5,
    "success": true
  }
}
```

**Side Effects to Verify**:

1️⃣ **File Deleted** (Privacy):
```bash
ls ./uploads/
# File should be GONE
```

2️⃣ **Statement Status Updated**:
```bash
mongosh
db.statements.findOne({ _id: ObjectId("YOUR_STATEMENT_ID") })
# Should show:
# status: "Completed"
# transactionCount: 5
# processedAt: (current date)
```

3️⃣ **Transactions Saved**:
```bash
db.transactions.countDocuments()  # Should show: 5
db.transactions.find().pretty()    # View all transactions
```

✅ All checks pass = Import successful

---

## Test 7: Get All Transactions (Verify Import)

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions?limit=50&skip=0`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send & Verify

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "_id": "txn_id",
        "date": "2026-07-01T00:00:00Z",
        "amount": 5000,
        "type": "Credit",
        "merchant": "Salary Deposit",
        "isEdited": false
      },
      // ... more transactions
    ],
    "count": 5
  }
}
```

✅ All transactions retrieved

---

## Test 8: Get Single Transaction

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/{transaction_id}`

Get ID from Test 7.

**Headers**:
```
Authorization: Bearer {your_token}
```

### Expected Response (200)

```json
{
  "success": true,
  "message": "Transaction retrieved successfully",
  "data": {
    "_id": "txn_id",
    "date": "2026-07-01T00:00:00Z",
    "amount": 5000,
    "type": "Credit",
    "merchant": "Salary Deposit"
  }
}
```

✅ Single transaction retrieved

---

## Security Tests

### Test 9: No Authentication

```
GET http://localhost:8000/api/v1/transactions
(NO Authorization header)

Expected (401): Unauthorized - No token provided
```

### Test 10: Invalid Token

```
GET http://localhost:8000/api/v1/transactions
Authorization: Bearer INVALID_TOKEN

Expected (401): Unauthorized - Invalid token
```

---

## Test Summary Checklist

- [ ] Test 1: Upload → 201 ✅
- [ ] Test 2: Extract → 200 ✅
- [ ] Test 3: Review → 200 ✅
- [ ] Test 4: Update → 200 ✅
- [ ] Test 5: Learn merchant → 201 ✅
- [ ] Test 6: Import → 200 ✅
- [ ] Test 7: List transactions → 200 ✅
- [ ] Test 8: Get single → 200 ✅
- [ ] Test 9: No auth → 401 ✅
- [ ] Test 10: Invalid token → 401 ✅
- [ ] File deleted after import ✅
- [ ] Statement status "Completed" ✅
- [ ] Transactions in DB ✅

✅ **All tests pass = Phase 05 working**

---

**Last Updated**: August 5, 2026  
**Status**: Ready for Fresh Testing
