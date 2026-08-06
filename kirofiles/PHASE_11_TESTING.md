# Phase 11 – Settings & Currency: Postman Testing Guide

**Status**: Ready for Testing  
**Date**: August 6, 2026

---

## Prerequisites

1. ✅ Phase 10 complete (family finance working)
2. ✅ Backend running: `npm run dev`
3. ✅ MongoDB Atlas connected
4. ✅ JWT token from login
5. ✅ Exchange rate API key (optional, uses demo key by default)

---

## Setup

### Install Dependencies

If not already done, install axios for currency conversion:

```bash
npm install axios@1.7.7
```

### Optional: Configure Exchange Rate API

Set in `.env`:
```
EXCHANGE_RATE_API_KEY=your_key_from_exchangerate_api_com
```

Without this, the service uses a "demo" key with limited rates.

---

## Test 1: Get My Profile

**Objective**: Fetch current user profile with all settings

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/users/me`

**Headers**:
```
Authorization: Bearer {your_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://avatar.url",
      "provider": "local",
      "isEmailVerified": true,
      "country": "IN",
      "preferredCurrency": "INR",
      "timeZone": "Asia/Kolkata",
      "preferences": {
        "language": "en",
        "theme": "dark",
        "notifications": {
          "email": true,
          "push": false
        }
      },
      "createdAt": "2026-08-05T10:00:00Z",
      "updatedAt": "2026-08-06T15:00:00Z"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ All profile fields present
- ✅ Preferences embedded
- ✅ Sensitive fields not exposed (password, refreshToken)

---

## Test 2: Update Preferred Currency

**Objective**: Change default currency for transactions

### Postman Setup

**Method**: `PATCH`  
**URL**: `http://localhost:8000/api/v1/users/profile`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body**:
```json
{
  "preferredCurrency": "USD"
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "preferredCurrency": "USD",
      "updatedAt": "2026-08-06T15:05:00Z"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ `preferredCurrency` changed to "USD"
- ✅ `updatedAt` timestamp updated

---

## Test 3: Update Preferences (Theme)

**Objective**: Change display theme

### Postman Setup

**Method**: `PATCH`  
**URL**: `http://localhost:8000/api/v1/users/preferences`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body**:
```json
{
  "theme": "light"
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "preferences": {
        "theme": "light",
        "language": "en",
        "notifications": {
          "email": true,
          "push": false
        }
      }
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Theme changed to "light"
- ✅ Other preferences unchanged

---

## Test 4: Update Notifications

**Objective**: Toggle email notifications

### Postman Setup

**Method**: `PATCH`  
**URL**: `http://localhost:8000/api/v1/users/preferences`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body**:
```json
{
  "notifications": {
    "email": false,
    "push": true
  }
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "user": {
      "preferences": {
        "notifications": {
          "email": false,
          "push": true
        }
      }
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Email notifications disabled
- ✅ Push notifications enabled

---

## Test 5: Change Password (Local Auth Only)

**Objective**: Update password for local auth users

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/users/change-password`

**Headers**:
```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body**:
```json
{
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword456!"
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "john@example.com"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Password changed (verify by logging in with new password)
- ✅ No sensitive data in response

---

## Test 6: Get Supported Currencies

**Objective**: List all supported currencies for conversion

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/currencies`

**Headers**:
```
Content-Type: application/json
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Supported currencies retrieved",
  "data": {
    "currencies": [
      "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "INR",
      ... (150+ currencies)
    ],
    "count": 150
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Array contains major currencies (USD, EUR, GBP, INR, etc.)
- ✅ `count` matches array length

---

## Test 7: Get Exchange Rate

**Objective**: Fetch current exchange rate between two currencies

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/currencies/rate?from=USD&to=INR`

**Headers**:
```
Content-Type: application/json
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Exchange rate retrieved",
  "data": {
    "rate": {
      "fromCurrency": "USD",
      "toCurrency": "INR",
      "rate": 83.45,
      "lastUpdated": "2026-08-06T15:30:00Z"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Rate is a positive number
- ✅ `lastUpdated` is current timestamp
- ✅ Currencies match request

---

## Test 8: Convert Single Amount

**Objective**: Convert amount from one currency to another

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/currencies/convert`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "amount": 100,
  "from": "USD",
  "to": "INR"
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Currency converted successfully",
  "data": {
    "conversion": {
      "original": 100,
      "converted": 8345.00,
      "rate": 83.45,
      "fromCurrency": "USD",
      "toCurrency": "INR"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ `converted = original × rate`
- ✅ Values rounded to 2 decimal places
- ✅ `rate` rounded to 5 decimal places

---

## Test 9: Same Currency Conversion (No Change)

**Objective**: Verify same currency returns rate of 1

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/currencies/convert`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "amount": 500,
  "from": "EUR",
  "to": "EUR"
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Currency converted successfully",
  "data": {
    "conversion": {
      "original": 500,
      "converted": 500,
      "rate": 1,
      "fromCurrency": "EUR",
      "toCurrency": "EUR"
    }
  }
}
```

**What to Verify**:
- ✅ `converted` equals `original`
- ✅ `rate` is exactly 1

---

## Test 10: Convert Batch (Multiple Amounts)

**Objective**: Convert multiple transaction amounts in one request

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/currencies/convert-batch`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "amounts": [
    { "amount": 100, "currency": "USD" },
    { "amount": 50, "currency": "EUR" },
    { "amount": 2000, "currency": "INR" }
  ],
  "to": "USD"
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Currency converted successfully",
  "data": {
    "conversions": [
      {
        "original": 100,
        "converted": 100,
        "rate": 1,
        "fromCurrency": "USD",
        "toCurrency": "USD"
      },
      {
        "original": 50,
        "converted": 52.50,
        "rate": 1.05,
        "fromCurrency": "EUR",
        "toCurrency": "USD"
      },
      {
        "original": 2000,
        "converted": 23.98,
        "rate": 0.01199,
        "fromCurrency": "INR",
        "toCurrency": "USD"
      }
    ]
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ All amounts converted
- ✅ Each has correct rate applied
- ✅ Returns array with all conversions

---

## Error Tests

### Error Test E1: Invalid Currency Code

**Objective**: Attempt to convert using invalid currency

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/currencies/convert`

**Body**:
```json
{
  "amount": 100,
  "from": "XXX",
  "to": "USD"
}
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Invalid source currency: XXX",
  "statusCode": 400
}
```

✅ Invalid currencies rejected

---

### Error Test E2: Negative Amount

**Objective**: Attempt conversion with negative amount

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/currencies/convert`

**Body**:
```json
{
  "amount": -50,
  "from": "USD",
  "to": "EUR"
}
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Amount must be a positive number",
  "statusCode": 400
}
```

✅ Negative amounts rejected

---

### Error Test E3: Missing Required Fields

**Objective**: Attempt conversion without amount

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/currencies/convert`

**Body**:
```json
{
  "from": "USD",
  "to": "EUR"
}
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Amount is required",
  "statusCode": 400
}
```

✅ Missing fields caught

---

### Error Test E4: Wrong Password

**Objective**: Attempt password change with incorrect current password

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/users/change-password`

**Headers**:
```
Authorization: Bearer {your_token}
```

**Body**:
```json
{
  "oldPassword": "WrongPassword123",
  "newPassword": "NewPassword456!"
}
```

**Expected Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "statusCode": 401
}
```

✅ Incorrect password rejected

---

## Regression Tests

### Regression Test 1: Dashboard Still Works

Verify Phase 09 dashboard still accessible:

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/overview`

**Headers**:
```
Authorization: Bearer {your_token}
```

**Expected**: 200 OK with dashboard data

---

### Regression Test 2: Family Finance Still Works

Verify Phase 10 family endpoints still accessible:

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families`

**Headers**:
```
Authorization: Bearer {your_token}
```

**Expected**: 200 OK with families list

---

### Regression Test 3: Transactions Still Work

Verify Phase 05/06 transactions still accessible:

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions`

**Headers**:
```
Authorization: Bearer {your_token}
```

**Expected**: 200 OK with transactions list

---

## Testing Checklist

**Account Settings**:
- [ ] Test 1: Get Profile ✅
- [ ] Test 2: Update Currency ✅
- [ ] Test 5: Change Password ✅

**Preferences**:
- [ ] Test 3: Update Theme ✅
- [ ] Test 4: Update Notifications ✅

**Currency**:
- [ ] Test 6: List Currencies ✅
- [ ] Test 7: Get Exchange Rate ✅
- [ ] Test 8: Convert Single ✅
- [ ] Test 9: Same Currency ✅
- [ ] Test 10: Batch Convert ✅

**Errors**:
- [ ] Error Test E1: Invalid Currency ✅
- [ ] Error Test E2: Negative Amount ✅
- [ ] Error Test E3: Missing Fields ✅
- [ ] Error Test E4: Wrong Password ✅

**Regression**:
- [ ] Regression Test 1: Dashboard ✅
- [ ] Regression Test 2: Family ✅
- [ ] Regression Test 3: Transactions ✅

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 on password change | Make sure to send correct old password first |
| Exchange rate returns 0 | Demo API key has limited rates; set EXCHANGE_RATE_API_KEY in .env |
| "Service unavailable" on conversion | Exchange rate API might be down; check demo key limit |
| Currency code not recognized | Must be 3-letter ISO 4217 code; check SUPPORTED_CURRENCIES list |
| Batch convert returns partial results | Check each amount has positive value and valid currency |

---

## Notes

- Exchange rates are always fetched fresh, never cached permanently
- Original transaction amounts are never modified
- All conversion rates are rounded to 5 decimal places
- Converted amounts rounded to 2 decimal places
- Password changes invalidate current session (user must log in again)
- Settings changes take effect immediately

