# Phase 05 – Transaction Processing: Implementation Details

## Status: ✅ COMPLETE

---

## What Was Built

A complete transaction processing pipeline that extracts transactions from uploaded bank statements (PDF, CSV, XLSX), allows users to review and edit them, learns merchant name corrections, and imports them to the database with automatic file cleanup.

---

## Files Created (7)

### 1. `src/models/transaction.model.js` (130 lines)
**Purpose**: Defines transaction database schema.

**Core Fields**:
- `user` (ObjectId, required, indexed) – User who owns transaction
- `statementId` (ObjectId, optional) – Statement transaction came from (null if manual)

**Corrected Values** (what user sees):
- `date` (Date, required, indexed) – Transaction date (user can correct)
- `amount` (Number, required, min 0.01) – Transaction amount (always positive)
- `type` (Enum: Debit/Credit) – Direction of transaction
- `merchant` (String, required, trimmed) – Merchant/vendor name
- `description` (String) – Transaction description
- `category` (String) – User-assigned category

**Original Extracted Values** (preserved for transparency):
- `originalDate`, `originalAmount`, `originalType`, `originalMerchant`, `originalDescription`
- Never shown to user, used only for audit trail

**Metadata**:
- `isEdited` (Boolean) – Whether user corrected this
- `editedAt` (Date) – When edited
- `notes` (String) – User notes
- `isDeleted` (Boolean) – Soft delete flag

**Indexes**:
- `{ user: 1, date: -1 }` – Fast user transaction queries
- `{ user: 1, merchant: 1 }` – Merchant learning lookups
- `{ isDeleted: 1 }` – Soft delete filtering
- `{ statementId: 1 }` – Find transactions from statement

**Key Decisions**:
- Both original + corrected values stored (transparency)
- User can edit all financial fields
- Soft delete for data retention

---

### 2. `src/models/merchant-mapping.model.js` (80 lines)
**Purpose**: Store learned merchant name mappings.

**Fields**:
- `user` (ObjectId, required, indexed) – User who learned this
- `extractedName` (String, lowercase) – How bank stated it ("AMAZON *MKTPLC")
- `correctedName` (String) – How user knows it ("Amazon")
- `count` (Number) – Times this mapping used
- `lastUsedAt` (Date) – When last applied
- `isActive` (Boolean) – Whether mapping enabled

**Unique Constraint**:
- `{ user: 1, extractedName: 1 }` – One mapping per extracted name per user

**Key Decisions**:
- Lowercase extraction name for case-insensitive matching
- Track usage count for analytics
- Can disable mappings without deleting

---

### 3. `src/services/parser.service.js` (400 lines)
**Purpose**: Extract and normalize transactions from files.

**PDF Parsing** (parsePDF function):
```javascript
const pdfData = await pdfParse(buffer)
const text = pdfData.text
```
- Uses `pdf-parse` for text extraction
- Works with digital PDFs (not scanned)
- Applies pattern matching to find transactions
- Returns normalized transaction array

**CSV Parsing** (parseCSV function):
```javascript
fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    // Normalize row to transaction
  })
```
- Uses `csv-parser` for parsing
- Finds columns with flexible matching
- Handles various decimal/thousands separators
- Returns normalized array

**Excel Parsing** (parseExcel function):
```javascript
const workbook = XLSX.readFile(filePath)
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[0])
```
- Uses `xlsx` to read Excel files
- Reads first sheet by default
- Converts rows to JSON
- Returns normalized array

**Normalization** (normalizeRow function):
- Finds date field (looks for "date" in column name)
- Finds amount field (looks for "amount" in column name)
- Determines type (Debit/Credit) from field or amount sign
- Finds merchant/description fields
- Returns structured object:
  ```javascript
  {
    date: Date,
    amount: number,
    type: "Debit" | "Credit",
    merchant: string,
    description: string,
    originalDate: Date,
    originalAmount: number,
    originalType: string,
    originalMerchant: string,
    originalDescription: string
  }
  ```

**Date Parsing** (parseDate function):
- Handles YYYY-MM-DD format
- Handles DD-MM-YYYY format
- Handles DD/MM/YY format
- Returns Date object or null

**Amount Parsing** (parseAmount function):
- Removes non-numeric characters
- Converts common separators
- Returns parsed number

**Key Decisions**:
- Flexible column detection (case-insensitive, contains matching)
- Multiple date formats supported
- Magic bytes NOT required (all formats attempted)
- Future: OCR can be added here without API changes

---

### 4. `src/services/transaction.service.js` (400 lines)
**Purpose**: Business logic for transaction operations.

**extractTransactions(filePath, fileType)**:
- Calls appropriate parser based on fileType
- Returns normalized transactions
- Throws ApiError if parsing fails

**getTransactionsForReview(statementId, userId)**:
- Returns statement metadata ready for review
- Verifies ownership
- Returns indication to extract and review

**createTransaction(userId, transactionData)**:
- Saves single transaction to database
- Links to user and optionally to statement
- Returns formatted response

**updateTransaction(transactionId, userId, updateData)**:
- Allows editing: merchant, description, category, notes, amount, date
- Verifies ownership
- Marks as edited with timestamp
- Detects merchant changes
- Returns merchantLearningOpportunity if merchant changed

**learnMerchantMapping(userId, originalMerchant, correctedMerchant)**:
- Creates new mapping or updates existing
- Normalizes extracted name to lowercase
- Increments count if exists
- Returns formatted mapping

**applyMerchantMappings(userId, transactions)**:
- Fetches all active mappings for user
- Creates lookup map
- Applies mappings to transaction merchants
- Returns updated transactions

**importTransactions(statementId, userId, transactions, filePath)**:
- Uses MongoDB session for transactional consistency
- Creates all transactions in batch
- Updates statement (status, count, processedAt)
- Commits transaction
- **Deletes uploaded file** (privacy-first)
- Returns summary

**getUserTransactions(userId, options)**:
- Filters by user, date range, merchant, category
- Supports pagination
- Returns sorted array

**Key Decisions**:
- MongoDB session ensures all-or-nothing import
- File deletion automatic (privacy-first)
- Merchant learning optional
- Original values always preserved

---

### 5. `src/controllers/transaction.controller.js` (150 lines)
**Purpose**: HTTP request handlers (thin layer).

**extractTransactions(req, res)**:
- `POST /api/v1/transactions/extract`
- Extracts user, filePath, fileType
- Calls service
- Returns transactions ready for review

**getTransactionsForReview(req, res)**:
- `GET /api/v1/transactions/review/:id`
- Extracts statementId
- Returns review readiness

**updateTransaction(req, res)**:
- `PUT /api/v1/transactions/:id`
- Extracts updateData
- Calls service
- Returns updated transaction

**learnMerchantMapping(req, res)**:
- `POST /api/v1/transactions/learn-merchant`
- Extracts original and corrected names
- Calls service
- Returns mapping with 201

**importTransactions(req, res)**:
- `POST /api/v1/transactions/import`
- Extracts statement, transactions, filePath
- Calls service
- Returns import summary with 200

**getUserTransactions(req, res)**:
- `GET /api/v1/transactions`
- Extracts pagination and filter params
- Calls service
- Returns transactions array

**getTransaction(req, res)**:
- `GET /api/v1/transactions/:id`
- Extracts transaction ID
- Queries database
- Returns single transaction

**Key Decisions**:
- Controllers are thin (no logic)
- All async wrapped with asyncHandler
- Consistent error handling

---

### 6. `src/routes/transaction.routes.js` (180 lines)
**Purpose**: API endpoint definitions with documentation.

**Routes**:
1. `POST /extract` – Extract from statement
2. `GET /review/:id` – Get for review
3. `POST /learn-merchant` – Learn mapping
4. `POST /import` – Import transactions
5. `GET /` – List all
6. `GET /:id` – Get single
7. `PUT /:id` – Update

**Documentation**: Each route documented with:
- Request body example
- Response structure
- Query parameters
- Path parameters
- Status codes

**Key Decisions**:
- protect middleware on all routes
- Consistent REST naming
- Comprehensive inline documentation

---

### 7. `src/validations/transaction.validation.js` (150 lines)
**Purpose**: Input validation chains using express-validator.

**validateExtractTransactions**:
- statementId: required, must be MongoDB ObjectId
- filePath: required, must be string
- fileType: required, must be PDF|CSV|XLSX

**validateUpdateTransaction**:
- id: must be MongoDB ObjectId
- merchant: optional, string
- description: optional, string
- category: optional, string
- notes: optional, string
- amount: optional, float > 0
- date: optional, ISO 8601

**validateLearnMerchant**:
- originalMerchant: required, non-empty string
- correctedMerchant: required, non-empty string

**validateImportTransactions**:
- statementId: required, ObjectId
- filePath: optional, string
- transactions: required, non-empty array
- Each transaction must have: date (ISO), amount (>0), type (Debit|Credit), merchant (string)

**validateGetTransactions**:
- limit: optional, 1-100
- skip: optional, >= 0
- fromDate: optional, ISO 8601
- toDate: optional, ISO 8601
- merchant: optional, string
- category: optional, string

**Key Decisions**:
- Express-validator patterns (consistent with Phase 1-4)
- Clear error messages
- Comprehensive validation

---

## Files Modified (2)

### 1. `src/routes/index.js`
**Change**: Import and register transaction routes.

```javascript
import transactionRoutes from "./transaction.routes.js"
router.use("/transactions", transactionRoutes)
```

### 2. `package.json`
**Change**: Add 3 parsing dependencies.

```json
{
  "pdf-parse": "^1.1.1",
  "csv-parser": "^3.0.0",
  "xlsx": "^0.18.5"
}
```

---

## Database Changes

### New Collections

**transactions**:
- Stores extracted and user-edited transactions
- Linked to users and statements
- Preserves original + corrected values
- Soft delete support

**merchantmapping**:
- Stores learned merchant mappings
- Per-user (user can teach their preferences)
- Unique on (user, extractedName)
- Tracks usage and timestamps

---

## API Endpoints

### POST /api/v1/transactions/extract
Extract transactions from uploaded statement.

**Request**:
```json
{
  "statementId": "66b1a2c3d4e5f6g7h8i9j0k1",
  "filePath": "/uploads/userid-timestamp-random.pdf",
  "fileType": "PDF"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Transactions extracted successfully",
  "data": {
    "statementId": "...",
    "transactionCount": 15,
    "transactions": [ ... ],
    "nextStep": "Review and import"
  }
}
```

### GET /api/v1/transactions/review/:statementId
Get transactions ready for review.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "statementId": "...",
    "status": "ready_for_review"
  }
}
```

### PUT /api/v1/transactions/:id
Update transaction with corrections.

**Request**:
```json
{
  "merchant": "Amazon",
  "category": "Shopping"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "merchant": "Amazon",
    "isEdited": true,
    "merchantLearningOpportunity": { ... }
  }
}
```

### POST /api/v1/transactions/learn-merchant
Save merchant mapping.

**Request**:
```json
{
  "originalMerchant": "AMAZON *MKTPLC",
  "correctedMerchant": "Amazon"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "extractedName": "amazon *mktplc",
    "correctedName": "Amazon",
    "count": 1
  }
}
```

### POST /api/v1/transactions/import
Import transactions to database.

**Request**:
```json
{
  "statementId": "...",
  "filePath": "/uploads/...",
  "transactions": [ ... ]
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Successfully imported 15 transactions",
  "data": {
    "transactionCount": 15,
    "success": true
  }
}
```

**Side Effect**: File deleted automatically

### GET /api/v1/transactions
List all user transactions.

**Query Params**: limit, skip, fromDate, toDate, merchant, category

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "transactions": [ ... ],
    "count": 15
  }
}
```

### GET /api/v1/transactions/:id
Get single transaction.

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "date": "...",
    "amount": 100,
    "type": "Debit",
    "merchant": "Amazon",
    "isEdited": true,
    "originalMerchant": "AMAZON *MKTPLC"
  }
}
```

---

## Workflow

```
1. Upload (Phase 04)
   ↓
2. Extract (Phase 05)
   POST /transactions/extract
   → Reads file → Parses → Applies mappings → Returns
   ↓
3. Review
   GET /transactions/review/:id
   → Shows ready status
   ↓
4. Edit (Optional)
   PUT /transactions/:id
   → User corrects fields → Detects merchant → Suggests learning
   ↓
5. Learn (Optional)
   POST /transactions/learn-merchant
   → Saves mapping
   ↓
6. Import
   POST /transactions/import
   → Saves transactions → Updates statement → Deletes file
   ↓
7. Access
   GET /transactions
   → User views their transactions
```

---

## Privacy Implementation

**Files**:
- Uploaded, stored temporarily in `/uploads`
- Processed immediately
- **Deleted automatically after successful import**

**Data**:
- Original values preserved (internal only)
- User corrections stored
- Metadata in database permanently
- Transactions retained (user's financial data)

---

## Backward Compatibility

✅ **No breaking changes**:
- Phase 1-4 endpoints unchanged
- No modifications to existing models
- All new code additive only
- Zero regression risk

---

**Implementation Date**: August 4, 2026
**Status**: Complete ✅
**Breaking Changes**: None
**Backward Compatible**: Yes
