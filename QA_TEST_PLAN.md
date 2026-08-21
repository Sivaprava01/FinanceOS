# Phase 4 Bug Fixes - Quick Test Plan

**Quick reference for manual QA testing**

---

## TEST 1: Statement Upload Processing (BUG #1)

### Step-by-step Test
1. Open the application and login
2. Navigate to **Statements** → **Upload Statement**
3. Select a test PDF/CSV/XLSX file from your computer
4. **EXPECTED**: 
   - Success message appears
   - Status shows "Uploaded" temporarily
   - Within 2-3 seconds, status changes to "Processing"
   - Within 5-10 seconds, status changes to "Completed" with transaction count
5. Go to **Transactions** page
   - **EXPECTED**: New transactions from uploaded file appear in list
   - Transactions show correct merchant, category, amount, date

### Error Case Test
1. Upload a corrupted/invalid PDF file
2. **EXPECTED**:
   - Initial status: "Uploaded"
   - Changes to: "Processing"
   - Final status: "Failed"
   - Error reason displayed under status

**Pass Criteria**: ✅ Status progresses through all states, transactions appear correctly

---

## TEST 2: Transaction Edit Scroll (BUG #2)

### Setup
1. Navigate to **Transactions** page
2. Scroll down to see transactions at the bottom of the list

### Test
1. Scroll to bottom of transaction list
2. Click **Edit** button on any transaction (one that's NOT visible)
3. **EXPECTED**:
   - Edit form appears
   - Page automatically scrolls up smoothly
   - Form is fully visible at top of content area

### Mobile Test
1. Test on mobile-sized viewport (e.g., 375px width)
2. Scroll down in transaction list
3. Tap Edit
4. **EXPECTED**: Form still scrolls into view, not hidden behind header

**Pass Criteria**: ✅ Form is always visible, smooth scroll animation plays

---

## TEST 3: Category Filter (BUG #3)

### Setup
1. Create 3-4 test transactions with different categories:
   - "Shopping" (exact case)
   - "Food" 
   - "Travel"
   
   Make sure they mix different cases if possible

### Test
1. Go to **Transactions** page
2. Click **Category** filter dropdown
3. Select "Shopping"
4. **EXPECTED**: 
   - Only Shopping transactions display
   - Count shows correct number
   - NO "0 results" if Shopping transactions exist

### Case Sensitivity Test
1. In browser console (F12), manually create a transaction with category "shopping" (lowercase)
2. Return to Transactions page
3. Filter by "Shopping" (with capital S)
4. **EXPECTED**: Both "Shopping" and "shopping" transactions appear

**Pass Criteria**: ✅ Filter works, shows correct results regardless of case

---

## TEST 4: Create Family (BUG #4)

### Test
1. Go to **Family Finance** section
2. Click **Create New Family**
3. Enter family name: "Test Family"
4. Click **Create**
5. **EXPECTED**:
   - NO validation error
   - Family is created successfully
   - Family appears in family list
   - Can proceed to add members

### Invalid Input Test
1. Try to create family with empty name
2. **EXPECTED**: Validation error "Family name is required"

**Pass Criteria**: ✅ Valid family name creates successfully, invalid shows error

---

## Quick Debug Notes

### If Statement Upload Fails
- Check browser console (F12) for error messages
- Check backend logs for processing errors
- Verify file types are PDF/CSV/XLSX
- Check `/uploads` folder exists

### If Edit Scroll Doesn't Work
- Verify `#main-content` element exists in DOM (F12 Inspector)
- Check browser console for JavaScript errors
- Try in different browsers (Chrome, Firefox)

### If Category Filter Shows 0 Results
- Verify transactions have category field set
- Check MongoDB for actual category values stored
- Try filtering case-insensitively (e.g., all lowercase filter)

### If Family Creation Shows Validation Error
- Check Network tab (F12) to see what data is being sent
- Verify `familyName` field is in request body
- Check backend validation in `family.validation.js`

---

## Commit Reference

- Commit `7d96a30`: Statement processing + Transaction scroll + Category filter fixes
- Commit `3fe54d8`: Family form fix + ESLint cleanup

To revert any fix:
```bash
git revert <commit-hash>
```

---

## Build Status Check

```bash
# Frontend
cd frontend
npm run build    # Should complete with 0 errors
npm run lint     # Should complete with 0 errors

# Backend (syntax only)
node -c src/services/statement.service.js  # Should complete with no output
```

---

## Expected Test Results

| Bug | Test | Expected Outcome |
|-----|------|------------------|
| #1 | Upload PDF | Status: Uploaded → Processing → Completed |
| #1 | Transactions appear | ✅ New transactions visible in list |
| #2 | Edit transaction | ✅ Form scrolls into view smoothly |
| #2 | Mobile edit | ✅ Form visible on mobile viewport |
| #3 | Filter by category | ✅ Shows matching transactions |
| #3 | Case sensitivity | ✅ "Shopping" matches "shopping" |
| #4 | Create family | ✅ No validation error, family created |
| #4 | Invalid input | ✅ Shows proper validation error |

**All 8 tests should PASS ✅**

---

## Notes for QA

- Run all tests in a clean browser session (no cached data)
- Test on at least one desktop browser and one mobile browser
- Document any additional bugs found during testing
- Check timestamps to verify processing happens in background

**Estimated Test Time**: 15-20 minutes total
