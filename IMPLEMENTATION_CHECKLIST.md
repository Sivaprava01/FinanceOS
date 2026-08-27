# FinanceOS Transaction System Implementation Checklist

**Project Goal**: Restructure transaction types from Banking model (Debit/Credit) to Accounting model (Income/Expense/Asset/Liability) with Payment Method support.

**Current State Analysis**:
- **Transaction Type Field**: Currently uses `Debit` | `Credit` (banking terminology)
- **Category Type Field**: Already supports `Expense` | `Income` | `Asset` | `Liability` (accounting terminology)
- **Payment Methods**: NOT YET IMPLEMENTED - needs to be added
- **Backward Compatibility**: Existing transactions use Debit/Credit; migration needed for historical data

---

## 1. TYPE MAPPING REFERENCE

### Current → New Type Mapping

```json
{
  "Current Banking Model": {
    "Debit": "Money going OUT (spending/asset decrease)",
    "Credit": "Money coming IN (income/asset increase)"
  },
  
  "New Accounting Model": {
    "Income": "Money coming IN (Credit substitute)",
    "Expense": "Money going OUT (Debit substitute)",
    "Asset": "Resource increase/addition",
    "Liability": "Obligation increase/addition"
  },

  "Mapping Rules": {
    "Current Debit → New": "Usually Expense, but context-dependent (could be Asset/Liability payment)",
    "Current Credit → New": "Usually Income, but context-dependent (could be Asset sale/Liability reduction)",
    "Best Practice": "Use category context to determine: category.type should match transaction.type"
  },

  "Payment Method Applicability": {
    "Income": ["Salary", "Freelance", "Investment", "Bonus", "Refund", "Other"],
    "Expense": ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "UPI", "Cheque", "Other"],
    "Asset": ["Cash Deposit", "Bank Transfer", "Investment Purchase", "Other"],
    "Liability": ["Loan Disbursement", "Credit Card Opening", "Other"]
  }
}
```

---

## 2. BACKEND CHANGES REQUIRED

### 2.1 Database Models

#### Transaction Model
**File**: `backend/src/models/transaction.model.js`

```json
{
  "Change Type": "MODIFY",
  "Priority": "CRITICAL",
  "Current Field": {
    "type": {
      "description": "Debit or Credit",
      "enum": ["Debit", "Credit"],
      "required": true
    }
  },
  "New Field": {
    "type": {
      "description": "Transaction type in accounting terms",
      "enum": ["Income", "Expense", "Asset", "Liability"],
      "required": true,
      "default": "Expense"
    },
    "paymentMethod": {
      "description": "How the transaction was made",
      "type": "String",
      "enum": ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "UPI", "Cheque", "Salary", "Freelance", "Investment", "Bonus", "Refund", "Other"],
      "default": "Other"
    },
    "bankingType": {
      "description": "DEPRECATED: Original banking term (Debit/Credit) for backward compatibility",
      "type": "String",
      "enum": ["Debit", "Credit"],
      "default": null
    }
  },
  "Migration Strategy": "Add new 'type' and 'paymentMethod' fields as optional first. Keep 'bankingType' to preserve old data.",
  "Add Indexes": [
    "{ user: 1, type: 1 }",
    "{ user: 1, paymentMethod: 1 }"
  ]
}
```

#### Category Model
**File**: `backend/src/models/category.model.js`

```json
{
  "Change Type": "NO CHANGE",
  "Priority": "INFO",
  "Current State": {
    "description": "Already implements correct type field",
    "type": {
      "enum": ["Expense", "Income", "Asset", "Liability"],
      "required": true
    }
  },
  "Note": "Category model is already correctly structured. No changes needed."
}
```

#### New Payment Method Model (Optional)
**File**: `backend/src/models/payment-method.model.js` (CREATE IF NEEDED)

```json
{
  "Change Type": "CREATE (Optional)",
  "Priority": "LOW",
  "Rationale": "Only if you want to track available payment methods per user",
  "Fields": {
    "user": "ObjectId (User reference)",
    "name": "String (unique per user)",
    "type": "String (Enum: ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'])",
    "isActive": "Boolean",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

### 2.2 Validation Layer

#### Transaction Validation
**File**: `backend/src/validations/transaction.validation.js`

```json
{
  "Change Type": "MODIFY",
  "Priority": "CRITICAL",
  "Changes": {
    "validateCreateTransaction": {
      "description": "Update type field validation",
      "from": "body('type').isIn(['Debit', 'Credit'])",
      "to": "body('type').isIn(['Income', 'Expense', 'Asset', 'Liability'])",
      "add": "body('paymentMethod').optional().isString().isIn([...PAYMENT_METHODS_ENUM])"
    },
    "validateUpdateTransaction": {
      "description": "Allow updating type and paymentMethod",
      "add": [
        "body('type').optional().isIn(['Income', 'Expense', 'Asset', 'Liability'])",
        "body('paymentMethod').optional().isString().isIn([...PAYMENT_METHODS_ENUM])"
      ]
    }
  },
  "New Validation Rules": {
    "type": "Must be one of [Income, Expense, Asset, Liability]",
    "paymentMethod": "Must match type (e.g., Expense can't use 'Salary')",
    "category": "Must match transaction type (transaction.type == category.type)"
  }
}
```

#### Add Payment Methods Constants
**File**: `backend/src/constants/index.js`

```json
{
  "Change Type": "ADD",
  "Priority": "HIGH",
  "New Constants": {
    "TRANSACTION_TYPES": ["Income", "Expense", "Asset", "Liability"],
    "PAYMENT_METHODS": {
      "Income": ["Salary", "Freelance", "Investment", "Bonus", "Refund", "Other"],
      "Expense": ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "UPI", "Cheque", "Other"],
      "Asset": ["Cash Deposit", "Bank Transfer", "Investment Purchase", "Other"],
      "Liability": ["Loan Disbursement", "Credit Card Opening", "Other"]
    },
    "ALL_PAYMENT_METHODS": ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "UPI", "Cheque", "Salary", "Freelance", "Investment", "Bonus", "Refund", "Loan Disbursement", "Credit Card Opening", "Cash Deposit", "Investment Purchase", "Other"]
  }
}
```

### 2.3 Service Layer

#### Transaction Service
**File**: `backend/src/services/transaction.service.js`

```json
{
  "Change Type": "MODIFY",
  "Priority": "CRITICAL",
  "Functions to Update": {
    "createTransaction": {
      "description": "Add paymentMethod to transaction creation",
      "updates": [
        "Accept paymentMethod in transactionData",
        "Validate paymentMethod matches transaction type",
        "Store paymentMethod in database"
      ]
    },
    "updateTransaction": {
      "description": "Allow updating transaction type and paymentMethod",
      "updates": [
        "Add 'type' and 'paymentMethod' to allowedFields",
        "When type changes, validate paymentMethod is appropriate for new type",
        "Update category if needed when type changes"
      ]
    },
    "importTransactions": {
      "description": "Handle type conversion during import",
      "updates": [
        "Accept new accounting type from frontend",
        "Map old Debit/Credit to new type if coming from statement parser",
        "Store banking type in bankingType field for reference"
      ]
    },
    "getUserTransactions": {
      "description": "Support filtering by new type and paymentMethod",
      "updates": [
        "Support type filter: ['Income', 'Expense', 'Asset', 'Liability']",
        "Support paymentMethod filter",
        "Remove 'Debit'/'Credit' type filter (use new types instead)"
      ]
    }
  },
  "New Helper Functions": {
    "validatePaymentMethodForType": {
      "description": "Ensures payment method is valid for transaction type",
      "signature": "(type: string, paymentMethod: string) => boolean"
    },
    "mapBankingTypeToCategoryType": {
      "description": "Converts old Debit/Credit to new type based on category",
      "signature": "(bankingType: string, category: Category) => string",
      "logic": "Debit with Expense category = Expense type; Credit with Income category = Income type"
    }
  }
}
```

#### Category Service
**File**: `backend/src/services/category.service.js`

```json
{
  "Change Type": "NO CHANGE",
  "Priority": "INFO",
  "Current State": "Already correctly typed",
  "Verification": "Check getCategories() returns categories with correct type"
}
```

### 2.4 Controllers

#### Transaction Controller
**File**: `backend/src/controllers/transaction.controller.js`

```json
{
  "Change Type": "MODIFY",
  "Priority": "HIGH",
  "Updates": {
    "createTransaction": "Handle paymentMethod in request body",
    "updateTransaction": "Allow updating type and paymentMethod",
    "importTransactions": "Pass new type format to service"
  }
}
```

### 2.5 API Routes

#### Transaction Routes
**File**: `backend/src/routes/transaction.routes.js`

```json
{
  "Change Type": "NO CHANGE (Documentation only)",
  "Priority": "MEDIUM",
  "Updates": {
    "POST /api/v1/transactions": "Update docs to show new type enum",
    "PUT /api/v1/transactions/:id": "Update docs to allow type and paymentMethod updates",
    "GET /api/v1/transactions": "Update docs for query param: type (new enum) and paymentMethod"
  }
}
```

### 2.6 Database Migration

**File**: `backend/src/db/migrations/001-transaction-types.js` (CREATE NEW)

```json
{
  "Change Type": "CREATE",
  "Priority": "CRITICAL",
  "Timing": "Must run AFTER model schema changes but BEFORE new code deploys",
  "Script Purpose": "Convert existing Debit/Credit transactions to new type system",
  "Migration Steps": [
    "1. For each transaction where type='Debit': Set new type to category.type (usually Expense)",
    "2. For each transaction where type='Credit': Set new type to category.type (usually Income)",
    "3. Store original Debit/Credit value in bankingType field",
    "4. Set paymentMethod based on category and rules (Expense defaults to 'Other')",
    "5. Verify all transactions have new type field populated"
  ],
  "Rollback Plan": "Keep bankingType field so original values can be recovered if needed"
}
```

---

## 3. FRONTEND CHANGES REQUIRED

### 3.1 Type Definitions

#### Update Types
**File**: `frontend/src/types/index.ts`

```json
{
  "Change Type": "MODIFY",
  "Priority": "CRITICAL",
  "Changes": {
    "Transaction interface": {
      "from": "type: 'Debit' | 'Credit'",
      "to": "type: 'Income' | 'Expense' | 'Asset' | 'Liability'",
      "add": "paymentMethod?: string"
    },
    "CreateTransactionInput interface": {
      "from": "type: 'Debit' | 'Credit'",
      "to": "type: 'Income' | 'Expense' | 'Asset' | 'Liability'",
      "add": "paymentMethod?: string"
    },
    "New Type": {
      "PaymentMethod": "enum of available payment methods",
      "TransactionTypeOption": "{ value: string; label: string; description: string }"
    }
  }
}
```

### 3.2 Components

#### Transaction Form Component
**File**: `frontend/src/pages/Transactions.tsx`

```json
{
  "Change Type": "MODIFY",
  "Priority": "CRITICAL",
  "Location": "Lines ~170-300 (Form section)",
  "Changes": {
    "Type Dropdown": {
      "from": [
        "<option value='Debit'>Expense (Debit)</option>",
        "<option value='Credit'>Income (Credit)</option>"
      ],
      "to": [
        "<option value='Income'>Income</option>",
        "<option value='Expense'>Expense</option>",
        "<option value='Asset'>Asset</option>",
        "<option value='Liability'>Liability</option>"
      ]
    },
    "Add Payment Method Field": {
      "description": "New select field after type",
      "position": "After type dropdown",
      "logic": "Show available payment methods based on selected type",
      "options": "Dynamically filtered from PAYMENT_METHODS[selectedType]"
    },
    "Category Dropdown Logic": {
      "change": "Only show categories matching selected transaction type",
      "filter": "categories.filter(c => c.type === formData.type)"
    },
    "Form Data Structure": {
      "add": "paymentMethod: '' to emptyForm()"
    }
  }
}
```

#### Update Filters
**File**: `frontend/src/pages/Transactions.tsx`

```json
{
  "Change Type": "MODIFY",
  "Priority": "HIGH",
  "Location": "Lines ~300-450 (Filter section)",
  "Changes": {
    "Type Filter": {
      "from": [
        "<option value='Debit'>Expense</option>",
        "<option value='Credit'>Income</option>"
      ],
      "to": [
        "<option value='Income'>Income</option>",
        "<option value='Expense'>Expense</option>",
        "<option value='Asset'>Asset</option>",
        "<option value='Liability'>Liability</option>"
      ]
    },
    "Add Payment Method Filter": {
      "description": "New filter for payment method",
      "position": "After type filter",
      "type": "Select dropdown"
    }
  }
}
```

#### Transaction Row Display
**File**: `frontend/src/components/transactions/TransactionRow.tsx`

```json
{
  "Change Type": "MODIFY",
  "Priority": "MEDIUM",
  "Changes": {
    "Type Display": {
      "from": "Shows 'Debit' or 'Credit'",
      "to": "Shows 'Income', 'Expense', 'Asset', or 'Liability'",
      "with": "Appropriate icon/color for each type"
    },
    "Add Payment Method": {
      "description": "Display paymentMethod as additional info",
      "position": "Next to or below type"
    }
  }
}
```

### 3.3 Hooks

#### Transaction Hook
**File**: `frontend/src/hooks/useTransactions.ts`

```json
{
  "Change Type": "MODIFY",
  "Priority": "HIGH",
  "Changes": {
    "useTransactions": {
      "description": "Update type in filter params",
      "from": "type: 'Debit' | 'Credit'",
      "to": "type: 'Income' | 'Expense' | 'Asset' | 'Liability'"
    },
    "createTransaction": {
      "description": "Accept and pass paymentMethod",
      "add": "Include paymentMethod in POST request body"
    },
    "updateTransaction": {
      "description": "Allow updating type and paymentMethod",
      "add": "Include type and paymentMethod in PUT request"
    }
  }
}
```

### 3.4 Services

#### Transaction Service
**File**: `frontend/src/services/transaction.service.ts`

```json
{
  "Change Type": "MODIFY",
  "Priority": "HIGH",
  "Changes": {
    "CreateTransactionInput interface": {
      "update": "type: 'Income' | 'Expense' | 'Asset' | 'Liability'",
      "add": "paymentMethod?: string"
    },
    "UpdateTransactionInput interface": {
      "add": "type?: string",
      "add": "paymentMethod?: string"
    },
    "getTransactions params": {
      "update": "type filter to new enum values"
    }
  }
}
```

### 3.5 New Constants/Utils

#### Create Payment Methods Configuration
**File**: `frontend/src/lib/payment-methods.ts` (CREATE NEW)

```json
{
  "Change Type": "CREATE",
  "Priority": "MEDIUM",
  "Content": {
    "TRANSACTION_TYPES": ["Income", "Expense", "Asset", "Liability"],
    "PAYMENT_METHODS_BY_TYPE": {
      "Income": ["Salary", "Freelance", "Investment", "Bonus", "Refund", "Other"],
      "Expense": ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "UPI", "Cheque", "Other"],
      "Asset": ["Cash Deposit", "Bank Transfer", "Investment Purchase", "Other"],
      "Liability": ["Loan Disbursement", "Credit Card Opening", "Other"]
    },
    "TYPE_LABELS": {
      "Income": { label: "Income", color: "text-success", bgColor: "bg-success/10" },
      "Expense": { label: "Expense", color: "text-destructive", bgColor: "bg-destructive/10" },
      "Asset": { label: "Asset", color: "text-blue-500", bgColor: "bg-blue-500/10" },
      "Liability": { label: "Liability", color: "text-amber-500", bgColor: "bg-amber-500/10" }
    }
  }
}
```

---

## 4. DATABASE MIGRATION STRATEGY

### 4.1 Migration Plan

```json
{
  "Approach": "Two-phase migration with backward compatibility",
  "Phase 1": {
    "description": "Add new fields as optional",
    "when": "Initial deployment",
    "steps": [
      "Add 'type' field (optional) to Transaction model",
      "Add 'paymentMethod' field (optional) to Transaction model",
      "Add 'bankingType' field (optional) to Transaction model",
      "Keep existing 'type' field as 'legacyType' (rename internally)"
    ]
  },
  "Phase 2": {
    "description": "Migrate existing data",
    "when": "After backend supports both",
    "steps": [
      "Run migration script to populate new 'type' field from category.type",
      "Run migration script to populate 'bankingType' from old type",
      "Run migration script to populate 'paymentMethod' with defaults",
      "Verify all transactions have new type populated",
      "Update queries to use new 'type' field"
    ]
  },
  "Rollback": "If issues found, old data is preserved in 'bankingType' field"
}
```

### 4.2 Backward Compatibility

```json
{
  "How to Maintain": {
    "Store Both": "Keep bankingType field with original Debit/Credit value",
    "Read New": "All new queries use 'type' field",
    "Convert Old": "If old type is read, convert to new type using category"
  },
  "Timeline to Remove Old": "After 1-2 months of successful operation, consider removing bankingType field"
}
```

---

## 5. FILES REQUIRING MODIFICATION

### 5.1 Backend Files

```json
{
  "Models": [
    {
      "file": "backend/src/models/transaction.model.js",
      "action": "MODIFY",
      "changes": "Add type (new enum), paymentMethod, bankingType fields"
    },
    {
      "file": "backend/src/models/category.model.js",
      "action": "VERIFY",
      "changes": "No changes needed - already correct"
    }
  ],
  "Validations": [
    {
      "file": "backend/src/validations/transaction.validation.js",
      "action": "MODIFY",
      "changes": "Update type enum, add paymentMethod validation"
    },
    {
      "file": "backend/src/validations/category.validation.js",
      "action": "VERIFY",
      "changes": "No changes needed"
    }
  ],
  "Services": [
    {
      "file": "backend/src/services/transaction.service.js",
      "action": "MODIFY",
      "changes": "Update create/update/import functions for new type system"
    },
    {
      "file": "backend/src/services/category.service.js",
      "action": "VERIFY",
      "changes": "No changes needed"
    }
  ],
  "Controllers": [
    {
      "file": "backend/src/controllers/transaction.controller.js",
      "action": "MODIFY",
      "changes": "Handle paymentMethod in requests"
    }
  ],
  "Routes": [
    {
      "file": "backend/src/routes/transaction.routes.js",
      "action": "UPDATE_DOCS",
      "changes": "Update API documentation for new type enum"
    }
  ],
  "Constants": [
    {
      "file": "backend/src/constants/index.js",
      "action": "ADD",
      "changes": "Add TRANSACTION_TYPES, PAYMENT_METHODS constants"
    }
  ],
  "Migrations": [
    {
      "file": "backend/src/db/migrations/001-transaction-types.js",
      "action": "CREATE",
      "changes": "Create migration script to convert existing data"
    }
  ]
}
```

### 5.2 Frontend Files

```json
{
  "Types": [
    {
      "file": "frontend/src/types/index.ts",
      "action": "MODIFY",
      "changes": "Update Transaction type enum, add paymentMethod"
    }
  ],
  "Components": [
    {
      "file": "frontend/src/pages/Transactions.tsx",
      "action": "MODIFY",
      "changes": "Update form type dropdown, add payment method field, update filters"
    },
    {
      "file": "frontend/src/components/transactions/TransactionRow.tsx",
      "action": "MODIFY",
      "changes": "Update type display, show payment method"
    }
  ],
  "Hooks": [
    {
      "file": "frontend/src/hooks/useTransactions.ts",
      "action": "MODIFY",
      "changes": "Update type filter, add paymentMethod to requests"
    },
    {
      "file": "frontend/src/hooks/useCategories.ts",
      "action": "VERIFY",
      "changes": "Should work as-is (already returns correct type)"
    }
  ],
  "Services": [
    {
      "file": "frontend/src/services/transaction.service.ts",
      "action": "MODIFY",
      "changes": "Update Transaction types, add paymentMethod parameter"
    }
  ],
  "Utilities": [
    {
      "file": "frontend/src/lib/payment-methods.ts",
      "action": "CREATE",
      "changes": "New file with payment method constants and mappings"
    }
  ]
}
```

---

## 6. IMPLEMENTATION SEQUENCE

### Step 1: Setup & Constants (No Breaking Changes)
```
1. backend/src/constants/index.js - Add new constants
2. frontend/src/lib/payment-methods.ts - Create new file
3. frontend/src/types/index.ts - Add new types (keep old for now)
```

### Step 2: Backend Data Model Changes
```
1. backend/src/models/transaction.model.js - Add new fields (optional)
2. backend/src/models/transaction.model.js - Add indexes
3. backend/src/validations/transaction.validation.js - Add new validation rules
```

### Step 3: Backend Business Logic Updates
```
1. backend/src/services/transaction.service.js - Update functions
2. backend/src/controllers/transaction.controller.js - Handle new fields
3. backend/src/routes/transaction.routes.js - Update docs
```

### Step 4: Data Migration
```
1. Create backend/src/db/migrations/001-transaction-types.js
2. Test migration script on development database
3. Run migration script (after deploying backend changes)
```

### Step 5: Frontend UI Updates
```
1. frontend/src/pages/Transactions.tsx - Update form and filters
2. frontend/src/components/transactions/TransactionRow.tsx - Update display
3. frontend/src/hooks/useTransactions.ts - Update hooks
4. frontend/src/services/transaction.service.ts - Update service calls
```

### Step 6: Testing & Cleanup
```
1. Test all transaction CRUD operations
2. Test category filtering
3. Test backward compatibility with old data
4. Verify statistics and reports use new type
```

---

## 7. VALIDATION CHECKLIST

### Before Deployment

- [ ] All new type enums are consistent across backend and frontend
- [ ] Payment method options are correct for each type
- [ ] Category type filtering works correctly
- [ ] Migration script tested on development data
- [ ] Old Debit/Credit values preserved in bankingType field
- [ ] All API responses use new type format
- [ ] Frontend form shows appropriate payment methods for selected type
- [ ] Filters work with new type enum
- [ ] Existing transactions display correctly after migration
- [ ] Type and payment method validation prevents invalid combinations

### After Migration

- [ ] Query all existing transactions - verify type field is populated
- [ ] Check no transactions have null type field
- [ ] Verify bankingType field contains original Debit/Credit
- [ ] Test creating new transactions with new type system
- [ ] Test updating transaction types
- [ ] Test filtering by new type values
- [ ] Test bulk operations with mixed types

---

## 8. QUICK REFERENCE: KEY CONSTANTS

```javascript
// Backend - constants/index.js
export const TRANSACTION_TYPES = ["Income", "Expense", "Asset", "Liability"];

export const PAYMENT_METHODS = {
  Income: ["Salary", "Freelance", "Investment", "Bonus", "Refund", "Other"],
  Expense: ["Credit Card", "Debit Card", "Cash", "Bank Transfer", "UPI", "Cheque", "Other"],
  Asset: ["Cash Deposit", "Bank Transfer", "Investment Purchase", "Other"],
  Liability: ["Loan Disbursement", "Credit Card Opening", "Other"]
};

// Frontend - lib/payment-methods.ts
export const PAYMENT_METHODS_BY_TYPE = { ... };
export const TYPE_LABELS = {
  Income: { label: "Income", color: "text-success", bgColor: "bg-success/10" },
  Expense: { label: "Expense", color: "text-destructive", bgColor: "bg-destructive/10" },
  Asset: { label: "Asset", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  Liability: { label: "Liability", color: "text-amber-500", bgColor: "bg-amber-500/10" }
};
```

---

## 9. GOTCHAS & EDGE CASES

```json
{
  "Edge Cases to Handle": [
    {
      "Issue": "Existing transactions have Debit/Credit, not new types",
      "Solution": "Use category.type to infer new type; store original in bankingType"
    },
    {
      "Issue": "User selects Expense type but Category type is Income",
      "Solution": "Validate transaction.type == category.type; show error if mismatch"
    },
    {
      "Issue": "Payment method doesn't match transaction type",
      "Solution": "Only show valid payment methods for selected type in dropdown"
    },
    {
      "Issue": "Bulk update changes transaction type but category doesn't match",
      "Solution": "Either update category too or prevent bulk type changes"
    },
    {
      "Issue": "Statistics/reports filtered by old Debit/Credit",
      "Solution": "Convert queries to use new type field"
    },
    {
      "Issue": "Import statement parser still outputs Debit/Credit",
      "Solution": "Convert in importTransactions() using category context"
    }
  ]
}
```

---

## 10. ROLLBACK PLAN

If issues arise after deployment:

1. **Immediate**: Keep new type optional, mark as experimental
2. **Read Old**: Queries can still read bankingType if type is missing
3. **Keep Data**: Don't delete old Debit/Credit values
4. **Revert UI**: Switch frontend form back to old type enum
5. **Investigate**: Fix issues before enabling new type in production

---

## Summary Stats

| Aspect | Count | Time Estimate |
|--------|-------|--------------|
| Backend Files to Modify | 6 | 4-6 hours |
| Frontend Files to Modify | 5 | 3-4 hours |
| New Files to Create | 2 | 1-2 hours |
| Tests to Write | 15-20 | 2-3 hours |
| **Total Effort** | - | **10-15 hours** |
| Database Migration | 1 script | 0.5-1 hour |
| **Total with Testing** | - | **12-18 hours** |

