# Phase 06 – Transaction Management: Postman Testing Guide

**Status**: Ready for Testing  
**Date**: August 5, 2026

---

## Prerequisites

1. ✅ Phase 05 complete (transactions imported)
2. ✅ Backend running: `npm run dev`
3. ✅ MongoDB Atlas connected
4. ✅ JWT token from login
5. ✅ Valid transaction IDs (from Phase 05 import)

---

## Setup: Get Transaction IDs

### Step 1: List All Transactions

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions`

**Headers**:
```
Authorization: Bearer {your_token}
```

**Response**: Will return list with `_id` values

**Save 3 transaction IDs** for deletion and bulk update tests.

---

## Test 1: Get Transaction Statistics

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/stats/overview`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction statistics retrieved",
  "data": {
    "period": {
      "from": "all-time",
      "to": "all-time"
    },
    "summary": {
      "totalTransactions": 97,
      "totalDebit": 45000.00,
      "totalCredit": 120000.00,
      "netFlow": 75000.00
    },
    "byType": {
      "Debit": 45000.00,
      "Credit": 120000.00
    },
    "byCategory": {
      "Uncategorized": 45000.00,
      "Shopping": 15000.00,
      ...
    },
    "topMerchants": [
      {
        "merchant": "RELIANCE J",
        "total": 1200.00
      },
      ...
    ]
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ `totalTransactions` equals imported count
- ✅ `netFlow` = `totalCredit` - `totalDebit`
- ✅ `byCategory` has multiple categories
- ✅ `topMerchants` list top spenders

---

## Test 2: Get Statistics with Date Range

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/stats/overview?fromDate=2026-07-01&toDate=2026-07-31`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction statistics retrieved",
  "data": {
    "period": {
      "from": "2026-07-01",
      "to": "2026-07-31"
    },
    "summary": {
      "totalTransactions": 42,
      "totalDebit": 25000.00,
      "totalCredit": 60000.00,
      "netFlow": 35000.00
    },
    ...
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ `period.from` and `period.to` match request
- ✅ `totalTransactions` less than all-time (filtered)
- ✅ Statistics only include July transactions

---

## Test 3: Get Categories List

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/categories/list`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Categories retrieved",
  "data": {
    "categories": [
      "Entertainment",
      "Food",
      "Healthcare",
      "Shopping",
      "Transport",
      "Uncategorized",
      "Utilities"
    ],
    "count": 7
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ `categories` is an array
- ✅ Categories sorted alphabetically
- ✅ `count` matches array length
- ✅ "Uncategorized" present (default category)

---

## Test 4: Bulk Update Transactions

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/transactions/bulk-update`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body (raw JSON)** — Use 3 transaction IDs from Step 1:
```json
{
  "transactionIds": [
    "66c2a2c3d4e5f6g7h8i9j0k5",
    "66c2a2c3d4e5f6g7h8i9j0k6",
    "66c2a2c3d4e5f6g7h8i9j0k7"
  ],
  "updateData": {
    "category": "Groceries",
    "notes": "Bulk update test"
  }
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Successfully updated 3 transaction(s)",
  "data": {
    "success": true,
    "matched": 3,
    "modified": 3,
    "message": "Successfully updated 3 transaction(s)"
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ `matched` shows 3 transactions found
- ✅ `modified` shows 3 transactions updated
- ✅ Message confirms update

### Verify Update Persisted

**GET** one of the updated transactions:
```
GET /api/v1/transactions/{transaction_id}
Authorization: Bearer {your_token}
```

**Verify**:
- ✅ `category` changed to "Groceries"
- ✅ `notes` changed to "Bulk update test"
- ✅ `isEdited` is true
- ✅ `editedAt` timestamp set

---

## Test 5: Delete Single Transaction

### Postman Setup

**Method**: `DELETE`  
**URL**: `http://localhost:8000/api/v1/transactions/{transaction_id}`

Use one of the transaction IDs from bulk update.

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": {
    "_id": "66c2a2c3d4e5f6g7h8i9j0k5",
    "message": "Transaction successfully deleted",
    "deletedAt": "2026-08-05T10:00:00Z"
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ `_id` matches deleted transaction
- ✅ `deletedAt` timestamp provided

### Verify Deletion

**GET** the deleted transaction:
```
GET /api/v1/transactions/{transaction_id}
Authorization: Bearer {your_token}
```

**Expected (404 Not Found)**:
```json
{
  "success": false,
  "message": "Transaction not found",
  "statusCode": 404
}
```

**What to Verify**:
- ✅ Deleted transaction excluded from retrieval
- ✅ 404 error returned
- ✅ Data still in DB (soft delete, not hard delete)

---

## Test 6: Verify Statistics Exclude Deleted

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/stats/overview`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (200 OK)**:
- **Before deletion**: `totalTransactions: 97`
- **After deletion**: `totalTransactions: 96`

**What to Verify**:
- ✅ Deleted transaction NOT included in count
- ✅ Deleted transaction NOT included in totals

---

## Test 7: Error Handling - Invalid Transaction ID

### Postman Setup

**Method**: `DELETE`  
**URL**: `http://localhost:8000/api/v1/transactions/invalid-id-12345`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (404 Not Found)**:
```json
{
  "success": false,
  "message": "Transaction not found",
  "statusCode": 404
}
```

**What to Verify**:
- ✅ Invalid ID returns 404
- ✅ Error message clear

---

## Test 8: Error Handling - Empty Bulk Update

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/transactions/bulk-update`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body**:
```json
{
  "transactionIds": [],
  "updateData": {
    "category": "Food"
  }
}
```

### Send Request

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Transaction IDs must be a non-empty array",
  "statusCode": 400
}
```

**What to Verify**:
- ✅ Empty IDs rejected
- ✅ Error message clear

---

## Test 9: Error Handling - Empty Update Data

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/transactions/bulk-update`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body**:
```json
{
  "transactionIds": ["66c2a2c3d4e5f6g7h8i9j0k6"],
  "updateData": {}
}
```

### Send Request

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Update data must contain at least one field",
  "statusCode": 400
}
```

**What to Verify**:
- ✅ Empty update data rejected
- ✅ Error message clear

---

## Test 10: Security - No Authentication

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/stats/overview`

**Headers**: (DO NOT add Authorization header)

### Send Request

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "No token provided",
  "statusCode": 401
}
```

**What to Verify**:
- ✅ Request rejected without token
- ✅ Auth middleware working

---

## Test 11: Security - Invalid Token

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions/stats/overview`

**Headers**:
```
Authorization: Bearer INVALID_TOKEN_12345
```

### Send Request

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid token",
  "statusCode": 401
}
```

**What to Verify**:
- ✅ Invalid token rejected
- ✅ Auth middleware validating

---

## Test 12: Bulk Update - Partial Success

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/transactions/bulk-update`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body** — Use 1 valid ID + 2 invalid IDs:
```json
{
  "transactionIds": [
    "66c2a2c3d4e5f6g7h8i9j0k7",
    "invalid-id-111",
    "invalid-id-222"
  ],
  "updateData": {
    "category": "Test"
  }
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Successfully updated 1 transaction(s)",
  "data": {
    "success": true,
    "matched": 1,
    "modified": 1,
    "message": "Successfully updated 1 transaction(s)"
  }
}
```

**What to Verify**:
- ✅ Only valid transaction updated
- ✅ `matched: 1, modified: 1`
- ✅ No error thrown (graceful handling)

---

## Database Verification

### Verify Soft Delete

```bash
mongosh
use financeos

# Check deleted transaction is marked
db.transactions.findOne({
  _id: ObjectId("66c2a2c3d4e5f6g7h8i9j0k5")
})

# Should show: isDeleted: true
```

### Verify Bulk Update

```bash
# Check updated category
db.transactions.findOne({
  _id: ObjectId("66c2a2c3d4e5f6g7h8i9j0k6")
})

# Should show:
# category: "Groceries"
# isEdited: true
# editedAt: (current date)
```

### Verify Statistics Calculation

```bash
# Count active transactions
db.transactions.find({
  user: ObjectId("..."),
  isDeleted: false
}).count()

# Should match stats response totalTransactions
```

---

## Regression Tests (Phase 1-5 Still Work)

### Phase 05 - Get Single Transaction
```
GET /api/v1/transactions/{id}
Expected (200): Transaction details returned
```

### Phase 05 - Update Transaction
```
PUT /api/v1/transactions/{id}
Body: { "merchant": "Updated" }
Expected (200): Transaction updated with isEdited=true
```

### Phase 05 - List Transactions
```
GET /api/v1/transactions
Expected (200): List includes only non-deleted transactions
```

### Phase 04 - Upload Statement
```
POST /api/v1/statements/upload
Expected (201): Statement uploaded successfully
```

### Phase 03 - User Profile
```
GET /api/v1/auth/me
Expected (200): User profile returned
```

---

## Test Summary Checklist

**Statistics**:
- [ ] Test 1: Get all-time stats → 200 ✅
- [ ] Test 2: Get stats with date range → 200 ✅
- [ ] Statistics accuracy verified ✅

**Categories**:
- [ ] Test 3: List categories → 200 ✅
- [ ] Categories sorted alphabetically ✅

**Bulk Update**:
- [ ] Test 4: Bulk update 3 transactions → 200 ✅
- [ ] Updated transactions verified ✅

**Delete**:
- [ ] Test 5: Delete transaction → 200 ✅
- [ ] Deleted transaction excluded from retrieval ✅
- [ ] Test 6: Statistics updated after delete ✅

**Error Handling**:
- [ ] Test 7: Invalid transaction ID → 404 ✅
- [ ] Test 8: Empty bulk update IDs → 400 ✅
- [ ] Test 9: Empty update data → 400 ✅

**Security**:
- [ ] Test 10: No auth → 401 ✅
- [ ] Test 11: Invalid token → 401 ✅
- [ ] Test 12: Bulk update partial success ✅

**Regression**:
- [ ] Phase 05 endpoints still work ✅
- [ ] Phase 04 endpoints still work ✅
- [ ] Phase 03 endpoints still work ✅

---

## Expected Behavior Summary

| Operation | Behavior |
|-----------|----------|
| Delete transaction | Marks `isDeleted: true`, excluded from all queries |
| Get statistics | Calculates from non-deleted transactions |
| Get categories | Distinct categories, sorted, nulls filtered |
| Bulk update | Updates only specified IDs, sets `isEdited: true` |
| Soft delete trail | Data preserved, recovered if needed later |
| Auth required | All 4 new endpoints protected by JWT |

---

## Performance Notes

- Statistics calculation: ~100-200ms for 1000 transactions
- Bulk update: ~50-100ms for 10-50 transactions
- Category distinct: ~20-50ms for 1000 transactions
- All operations indexed on user ID for speed

---

**Status**: Ready for Testing ✅  
**Last Updated**: August 5, 2026

