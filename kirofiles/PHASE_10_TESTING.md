# Phase 10 – Family Finance: Postman Testing Guide

**Status**: Ready for Testing  
**Date**: August 6, 2026

---

## Prerequisites

1. ✅ Phase 09 complete (dashboard working)
2. ✅ Backend running: `npm run dev`
3. ✅ MongoDB Atlas connected
4. ✅ JWT token from login (User A)
5. ✅ Second user account created (User B) for family sharing tests

---

## Setup: Prepare Test Accounts

You need TWO user accounts to test family features. If you only have one, create another:

### Create User B (Optional if not done)

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/auth/register`

**Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "country": "IN",
  "preferredCurrency": "INR",
  "timeZone": "Asia/Kolkata"
}
```

**Save the new JWT token for User B**.

---

## Test 1: Create Family

**Objective**: User A creates a family and becomes the head

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/families`

**Headers**:
```
Authorization: Bearer {User_A_token}
Content-Type: application/json
```

**Body**:
```json
{
  "familyName": "Smith Family",
  "description": "Our family budget tracker"
}
```

### Send Request

**Expected Response (201 Created)**:
```json
{
  "success": true,
  "message": "Family created successfully",
  "data": {
    "family": {
      "_id": "family_id_123",
      "familyHead": "user_a_id",
      "familyName": "Smith Family",
      "description": "Our family budget tracker",
      "members": [
        {
          "_id": "member_id_1",
          "user": "user_a_id",
          "role": "Family Head",
          "joinedAt": "2026-08-06T10:00:00Z"
        }
      ],
      "createdAt": "2026-08-06T10:00:00Z",
      "updatedAt": "2026-08-06T10:00:00Z"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 201
- ✅ User A is listed as Family Head
- ✅ Members array has 1 member (the head)
- ✅ `_id` is stored (save for later tests)

**Save Response**: Copy the `family._id` and `family.members[0]._id`

---

## Test 2: Get Family Details

**Objective**: Fetch the family just created

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Family fetched successfully",
  "data": {
    "family": {
      "_id": "family_id_123",
      "familyHead": {
        "_id": "user_a_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "familyName": "Smith Family",
      "members": [...]
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Family details are returned correctly
- ✅ `familyHead` is User A

---

## Test 3: Send Family Invitation

**Objective**: User A invites User B to join the family

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/invitations`

**Headers**:
```
Authorization: Bearer {User_A_token}
Content-Type: application/json
```

**Body**:
```json
{
  "invitedEmail": "jane@example.com"
}
```

### Send Request

**Expected Response (201 Created)**:
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "data": {
    "invitation": {
      "_id": "invitation_id_123",
      "family": "family_id_123",
      "invitedBy": "user_a_id",
      "invitedEmail": "jane@example.com",
      "status": "Pending",
      "expiresAt": "2026-08-13T10:00:00Z",
      "createdAt": "2026-08-06T10:00:00Z"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 201
- ✅ Invitation status is "Pending"
- ✅ `expiresAt` is 7 days from now
- ✅ Invitation created successfully

**Save Response**: Copy the `invitation._id`

---

## Test 4: List Pending Invitations (User B)

**Objective**: User B checks pending invitations

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families/invitations/pending`

**Headers**:
```
Authorization: Bearer {User_B_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Invitations fetched successfully",
  "data": {
    "invitations": [
      {
        "_id": "invitation_id_123",
        "family": {
          "_id": "family_id_123",
          "familyName": "Smith Family"
        },
        "invitedBy": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "invitedEmail": "jane@example.com",
        "status": "Pending",
        "expiresAt": "2026-08-13T10:00:00Z"
      }
    ],
    "count": 1
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ User B sees the invitation from User A
- ✅ Invitation details are complete

---

## Test 5: Accept Invitation (User B)

**Objective**: User B accepts the invitation and joins the family

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/families/invitations/{invitation_id}/accept`

**Headers**:
```
Authorization: Bearer {User_B_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "success": true,
    "message": "Invitation accepted"
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Invitation accepted successfully

---

## Test 6: List Family Members

**Objective**: Verify User B is now a member

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/members`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Family members fetched successfully",
  "data": {
    "members": [
      {
        "_id": "member_id_1",
        "user": {
          "_id": "user_a_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "role": "Family Head",
        "joinedAt": "2026-08-06T10:00:00Z"
      },
      {
        "_id": "member_id_2",
        "user": {
          "_id": "user_b_id",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "role": "Family Member",
        "joinedAt": "2026-08-06T10:05:00Z"
      }
    ],
    "count": 2
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Family has 2 members
- ✅ User A is "Family Head", User B is "Family Member"
- ✅ `joinedAt` timestamps are present

**Save Response**: Copy User B's `member._id` for removal tests

---

## Test 7: Update Sharing Preferences (User B)

**Objective**: User B chooses what to share with the family

### Postman Setup

**Method**: `PUT`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/sharing`

**Headers**:
```
Authorization: Bearer {User_B_token}
Content-Type: application/json
```

**Body**:
```json
{
  "shareTransactions": true,
  "shareAssets": false,
  "shareLoans": true,
  "shareNetWorth": false
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Sharing preferences updated successfully",
  "data": {
    "sharing": {
      "_id": "sharing_id_123",
      "family": "family_id_123",
      "user": "user_b_id",
      "shareTransactions": true,
      "shareAssets": false,
      "shareLoans": true,
      "shareNetWorth": false,
      "shareEverything": false,
      "lastUpdatedAt": "2026-08-06T10:10:00Z"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Only requested preferences are set to `true`
- ✅ `lastUpdatedAt` is current timestamp
- ✅ `shareEverything` is `false` (not all enabled)

---

## Test 8: Update Sharing – Share Everything

**Objective**: User B quickly enables all sharing

### Postman Setup

**Method**: `PUT`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/sharing`

**Headers**:
```
Authorization: Bearer {User_B_token}
Content-Type: application/json
```

**Body**:
```json
{
  "shareEverything": true
}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Sharing preferences updated successfully",
  "data": {
    "sharing": {
      "shareTransactions": true,
      "shareAssets": true,
      "shareLoans": true,
      "shareNetWorth": true,
      "shareEverything": true
    }
  }
}
```

**What to Verify**:
- ✅ All sharing preferences are now `true`
- ✅ `shareEverything` is `true`

---

## Test 9: Get My Sharing Preferences

**Objective**: User B views their own sharing settings

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/sharing`

**Headers**:
```
Authorization: Bearer {User_B_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Sharing preferences fetched successfully",
  "data": {
    "sharing": {
      "_id": "sharing_id_123",
      "family": "family_id_123",
      "user": "user_b_id",
      "shareTransactions": true,
      "shareAssets": true,
      "shareLoans": true,
      "shareNetWorth": true,
      "shareEverything": true,
      "lastUpdatedAt": "2026-08-06T10:10:00Z"
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Shows User B's sharing preferences
- ✅ All sharing flags match the previous update

---

## Test 10: Get Family Dashboard

**Objective**: View combined family financial data

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/dashboard`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Family dashboard fetched successfully",
  "data": {
    "dashboard": {
      "familyName": "Smith Family",
      "memberCount": 2,
      "sharedCombined": {
        "totalAssets": 150000.00,
        "totalLiabilities": 50000.00,
        "netWorth": 100000.00
      },
      "sharedExpenses": 25000.00,
      "spendingByMember": [
        {
          "user": "user_b_id",
          "income": 120000.00,
          "expenses": 25000.00,
          "transactionCount": 97
        }
      ],
      "membersSharing": 1
    }
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Dashboard shows combined data
- ✅ Only members sharing data are included
- ✅ Financial calculations are correct

---

## Test 11: List User's Families

**Objective**: User A views all families they're part of

### Postman Setup

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Families fetched successfully",
  "data": {
    "families": [
      {
        "_id": "family_id_123",
        "familyName": "Smith Family",
        "familyHead": {...},
        "members": [...]
      }
    ],
    "count": 1
  }
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ User A's family is listed
- ✅ Count reflects number of families

---

## Test 12: Remove Member (Family Head Only)

**Objective**: User A removes User B from the family

### Postman Setup

**Method**: `DELETE`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/members/{member_b_id}`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Member removed message displayed

### Verification: List members again
- ✅ User B should no longer appear in members list

---

## Test 13: Leave Family (Non-Head Member)

**Objective**: Regular member leaves the family

### Setup (Re-add User B first)

Run Test 3 and Test 5 again to add User B back.

### Postman Setup

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/leave`

**Headers**:
```
Authorization: Bearer {User_B_token}
```

### Send Request

**Expected Response (200 OK)**:
```json
{
  "success": true,
  "message": "You have left the family successfully"
}
```

**What to Verify**:
- ✅ Status code is 200
- ✅ Leave successful

---

## Error Tests

### Test E1: Unauthorized Invitation (Non-Head)

**Objective**: User B tries to send invitation (should fail)

**Method**: `POST`  
**URL**: `http://localhost:8000/api/v1/families/{family_id}/invitations`

**Headers**:
```
Authorization: Bearer {User_B_token}
```

**Body**:
```json
{
  "invitedEmail": "test@example.com"
}
```

**Expected Response (403 Forbidden)**:
```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}
```

✅ Only family head can send invitations

---

### Test E2: Invalid ObjectId

**Objective**: Use invalid family ID format

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families/invalid_id`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

**Expected Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Invalid Family ID format",
  "statusCode": 400
}
```

✅ Invalid IDs are caught

---

### Test E3: Family Not Found

**Objective**: Use non-existent family ID

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/families/507f1f77bcf86cd799439011`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

**Expected Response (404 Not Found)**:
```json
{
  "success": false,
  "message": "Family not found",
  "statusCode": 404
}
```

✅ Non-existent families return 404

---

## Regression Tests

### Regression Test 1: Dashboard Still Works

Verify Phase 09 dashboard endpoints still work:

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/dashboard/overview`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

**Expected**: 200 OK with dashboard data

---

### Regression Test 2: Transactions Still Work

Verify Phase 05/06 transaction endpoints still work:

**Method**: `GET`  
**URL**: `http://localhost:8000/api/v1/transactions`

**Headers**:
```
Authorization: Bearer {User_A_token}
```

**Expected**: 200 OK with transaction list

---

## Testing Checklist

- [ ] Test 1: Create Family ✅
- [ ] Test 2: Get Family Details ✅
- [ ] Test 3: Send Invitation ✅
- [ ] Test 4: List Pending Invitations ✅
- [ ] Test 5: Accept Invitation ✅
- [ ] Test 6: List Members ✅
- [ ] Test 7: Update Sharing Preferences ✅
- [ ] Test 8: Share Everything ✅
- [ ] Test 9: Get Sharing Preferences ✅
- [ ] Test 10: Family Dashboard ✅
- [ ] Test 11: List Families ✅
- [ ] Test 12: Remove Member ✅
- [ ] Test 13: Leave Family ✅
- [ ] Error Test E1: Unauthorized ✅
- [ ] Error Test E2: Invalid ID ✅
- [ ] Error Test E3: Not Found ✅
- [ ] Regression Test 1: Dashboard ✅
- [ ] Regression Test 2: Transactions ✅

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Not found" on invitation | Verify invitation ID matches response from Test 3 |
| "Already member" error | User might already be in family; use different email |
| "Cannot remove head" | Family head cannot be removed; only members can be removed |
| "Forbidden" on sharing update | Must be a family member to update sharing |
| Dashboard shows no data | Verify User B shared transactions before fetching dashboard |

---

## Notes

- Invitations expire after 7 days
- Family head cannot be removed or leave the family
- Each member controls their own sharing preferences
- Family dashboard only shows shared data
- Removing a member also deletes their sharing preferences

