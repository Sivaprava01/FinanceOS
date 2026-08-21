# Currency Persistence Bug - FIXED

**Issue**: User sets preferred currency to INR in Settings → shows correctly in all tabs → but on page refresh or app restart, currency resets to USD default

**Root Cause**: Backend's `/auth/me` endpoint was not returning `preferredCurrency` in the user profile

**What Was Happening**:
1. ✅ User sets currency to INR in Settings
2. ✅ Frontend calls `userService.updateProfile({ preferredCurrency: 'INR' })`
3. ✅ Backend saves it correctly to user document
4. ✅ Frontend context updated via `updateUser()`
5. ✅ Currency shows as INR across all tabs
6. ❌ Page refresh → App calls `authService.getCurrentUser()` → `/auth/me` endpoint
7. ❌ Backend returns user WITHOUT `preferredCurrency` field
8. ❌ Frontend defaults to 'USD'
9. ❌ Currency reverts to USD

**The Bug**:
```javascript
// In backend/src/services/auth.service.js - buildUserPayload() function
// OLD: Only returned basic identity fields
const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  // ❌ MISSING: preferredCurrency, preferences
});
```

**The Fix**:
```javascript
// NEW: Now includes user preferences so they persist across sessions
const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  // ✅ ADDED: These now persist across sessions
  preferredCurrency: user.preferredCurrency || 'USD',
  preferences: user.preferences || {
    language: 'en',
    theme: 'system',
    dateFormat: 'DD/MM/YYYY',
    notifications: { email: true, push: false },
  },
});
```

**Where the fix was applied**:
- File: `backend/src/services/auth.service.js`
- Function: `buildUserPayload()`
- Lines: 18-37

**Why this fixes it**:
1. Now when frontend refreshes and calls `/auth/me`
2. Backend's `getProfile()` calls `buildUserPayload(user)`
3. This now includes `preferredCurrency` + all `preferences`
4. Frontend receives complete user object
5. `useCurrency()` hook uses `user?.preferredCurrency ?? 'USD'`
6. Currency persists correctly across page refreshes and app restarts

**Testing**:
1. Set currency to INR in Settings
2. Refresh the page → currency should remain INR
3. Close frontend, restart backend, reload frontend → currency should remain INR
4. Switch to different user → should show their saved currency preference

**Impact**:
- ✅ Currency preference now persists permanently
- ✅ Language preference now persists permanently
- ✅ Theme preference now persists permanently
- ✅ All date format settings now persist permanently
- ✅ Notification settings now persist permanently
- ✅ Zero breaking changes

**Status**: ✅ FIXED & READY FOR TESTING
