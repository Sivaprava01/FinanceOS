# Phase 01 – Frontend Foundation: Installation & Setup Guide

**Last Updated**: August 6, 2026  
**Status**: Ready for Installation

---

## Prerequisites

Before installing, ensure you have:

- ✅ Node.js 18+ installed ([Download](https://nodejs.org/))
- ✅ npm or yarn package manager
- ✅ Git installed
- ✅ A code editor (VS Code recommended)
- ✅ Backend running on `http://localhost:8000` (optional for Phase 01)

### Verify Prerequisites

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check git
git --version
```

---

## Step 1: Navigate to Frontend Directory

```bash
cd c:\Users\sivap\Desktop\Projects\FinanceOS\frontend
```

Or on macOS/Linux:
```bash
cd ~/FinanceOS/frontend
```

---

## Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This will install ~200 packages (~500MB)
# Takes 2-5 minutes depending on internet speed
```

**What's being installed:**
- React 19 and React DOM
- React Router v6
- Tailwind CSS v4
- TypeScript
- Vite
- ESLint & Prettier
- All other dependencies from package.json

---

## Step 3: Create Environment Configuration

```bash
# Copy .env.example to .env
cp .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env

# On Windows (Command Prompt):
copy .env.example .env
```

### Update .env (Optional)

Edit `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=FinanceOS
```

Leave as default if backend is on port 8000.

---

## Step 4: Verify Installation

### Check Node Modules

```bash
# Verify all dependencies installed
ls node_modules | wc -l

# Should show ~200+ packages
```

### Verify Configuration Files

Check these files exist:
- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ `vite.config.ts`
- ✅ `tailwind.config.ts`
- ✅ `.eslintrc.cjs`
- ✅ `.prettierrc`
- ✅ `.env`

### Run Linting Check

```bash
# Run ESLint to verify code quality
npm run lint

# Should complete with no errors (only warnings allowed)
```

### Run Prettier Check

```bash
# Check code formatting
npm run format

# This will format and report any issues
```

---

## Step 5: Start Development Server

```bash
# Start the development server
npm run dev

# Output should show:
# ✓ built in Xs
# ➜  Local:   http://localhost:3000/
# ➜  press h to show help

# Browser should automatically open to http://localhost:3000
```

**If browser doesn't open:**
- Manually open: `http://localhost:3000`
- Check terminal for any errors
- Ensure no other process is using port 3000

---

## Step 6: Verify Frontend Loads

### Check Homepage

1. Open browser to `http://localhost:3000`
2. Should redirect to `http://localhost:3000/login` (public route)
3. Should see **Login** page with:
   - FinanceOS branding
   - Email input
   - Password input
   - Sign In button
   - "Sign up" link
   - "Forgot password" link

### Check Theme Toggle

1. Look for icon in top-right corner (Sun/Moon/Monitor)
2. Click to open theme dropdown
3. Verify 3 options: Light, Dark, System
4. Click "Dark" – page should switch to dark theme
5. Refresh page – theme should persist (saved in localStorage)

### Check Sidebar Navigation

1. On desktop: Sidebar should be visible on left
2. On mobile: Click hamburger menu (☰) to show sidebar
3. Sidebar should show navigation items:
   - Dashboard
   - Transactions
   - Statements
   - Analytics
   - Family Finance
   - Categories
   - How It Works
   - Profile
   - Settings
   - Logout button

---

## Step 7: Test Routing

Navigate to these routes to verify they work:

**Public Routes (no sidebar):**
- `http://localhost:3000/login` – Login page ✅
- `http://localhost:3000/register` – Register page ✅
- `http://localhost:3000/forgot-password` – Forgot password page ✅
- `http://localhost:3000/reset-password/test-token` – Reset password page ✅

**Protected Routes (with sidebar):**
- `http://localhost:3000/dashboard` – Dashboard ✅
- `http://localhost:3000/transactions` – Transactions ✅
- `http://localhost:3000/statements` – Statements ✅
- `http://localhost:3000/analytics` – Analytics ✅
- `http://localhost:3000/family` – Family Finance ✅
- `http://localhost:3000/categories` – Categories ✅
- `http://localhost:3000/how-it-works` – How It Works ✅
- `http://localhost:3000/profile` – Profile ✅
- `http://localhost:3000/settings` – Settings ✅

**Error Routes:**
- `http://localhost:3000/invalid-route` – Should show 404 page ✅
- `http://localhost:3000/this-does-not-exist` – Should show 404 page ✅

---

## Step 8: Test Dark Mode

1. Click theme toggle (Sun/Moon icon) in top-right
2. Select "Dark" – page should turn dark
3. Check these elements:
   - Background should be dark navy
   - Text should be light gray
   - Cards should have dark background
   - Buttons should have appropriate colors
4. Refresh page – dark mode should persist
5. Select "Light" – page should turn light
6. Select "System" – should match OS theme preference

---

## Step 9: Test Responsiveness

### On Desktop
1. Sidebar visible on left
2. Content area on right
3. Top navigation bar visible
4. All text readable
5. All buttons clickable

### On Tablet (Safari DevTools)
1. Press F12 to open DevTools
2. Click device toolbar icon (mobile icon)
3. Select "iPad" or 768px width
4. Verify:
   - Sidebar appears on toggle
   - Navigation is accessible
   - Content is readable
   - All buttons work

### On Mobile (Safari DevTools)
1. Select iPhone 12 (390px width)
2. Verify:
   - Sidebar hidden by default
   - Hamburger menu visible
   - Click hamburger to show sidebar
   - All content readable
   - All buttons tappable

---

## Step 10: Test Console & Linting

### Open Browser DevTools

1. Press **F12** to open DevTools
2. Click **Console** tab
3. Should see NO red errors
4. May see some warnings (acceptable)
5. Check for these common issues:
   - ❌ "Cannot find module" errors
   - ❌ "React version mismatch" errors
   - ❌ "Cannot read property" errors
   - ✅ "Deprecation warnings" (acceptable)

### Run ESLint

```bash
npm run lint

# Output should show:
# 0 error and 0 warnings in X files
```

If errors appear:
```bash
# These files are being checked:
# - src/**/*.{ts,tsx}
# - Check for unused variables
# - Check for missing imports
# - Check for React hooks rules
```

---

## Step 11: Verify Components & Pages

### Navigate to Each Page

**Login Page** (`/login`):
- [ ] Email input field visible
- [ ] Password input field visible
- [ ] Sign In button visible
- [ ] "Sign up" link works (navigate to /register)
- [ ] "Forgot password" link works (navigate to /forgot-password)
- [ ] Form has placeholder text
- [ ] Page is centered and styled nicely

**Register Page** (`/register`):
- [ ] Name input field visible
- [ ] Email input field visible
- [ ] Password input field visible
- [ ] Create Account button visible
- [ ] "Sign in" link works (navigate to /login)
- [ ] Form has placeholder text
- [ ] Page styling matches Login page

**Forgot Password** (`/forgot-password`):
- [ ] Email input field visible
- [ ] Send Reset Link button visible
- [ ] After submit, shows "Check your email" message
- [ ] "Back to Login" link works

**Reset Password** (`/reset-password/:token`):
- [ ] New Password input visible
- [ ] Confirm Password input visible
- [ ] Reset Password button visible
- [ ] Form fields have placeholder text

**Dashboard** (`/dashboard`):
- [ ] Page title "Dashboard" visible
- [ ] 4 metric cards displayed
- [ ] Each card shows placeholder data
- [ ] Sidebar navigation visible

**404 Page** (`/invalid-route`):
- [ ] Shows "404" heading
- [ ] Shows "Page not found" message
- [ ] "Back to Dashboard" button visible and works

---

## Step 12: Verify Styling & Design

### Check Light Theme
- [ ] Background is white
- [ ] Text is dark gray/black
- [ ] Primary color is emerald green
- [ ] Buttons have proper emerald color
- [ ] Spacing looks consistent
- [ ] Shadows are subtle

### Check Dark Theme
- [ ] Background is dark navy
- [ ] Text is light gray/white
- [ ] Primary color is purple
- [ ] Buttons have proper purple color
- [ ] Spacing looks consistent
- [ ] Text is readable (good contrast)

### Check Typography
- [ ] Headings are bold and prominent
- [ ] Body text is readable
- [ ] Font sizes are appropriate
- [ ] Line heights are comfortable
- [ ] Spacing between elements is even

### Check Components
- [ ] Buttons have proper hover states
- [ ] Buttons show loading spinner when isLoading=true
- [ ] Input fields have focus states
- [ ] Cards have subtle shadows
- [ ] Sidebar is floating and elevated
- [ ] All elements are properly aligned

---

## Step 13: Build for Production

```bash
# Create production build
npm run build

# Output should show:
# ✓ X modules transformed
# built in Xs

# Check dist/ folder was created
ls dist/

# Should contain:
# - index.html
# - assets/ (CSS, JS files)
```

### Preview Production Build

```bash
# Preview the production build locally
npm run preview

# Should show:
# ➜  Local:   http://localhost:4173/
```

Navigate to `http://localhost:4173` and verify:
- [ ] All pages work
- [ ] All routes work
- [ ] Theme switching works
- [ ] No console errors
- [ ] Performance is fast

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (macOS/Linux)
kill -9 <PID>

# Or change dev port in vite.config.ts:
# server: { port: 3001 }
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Module Not Found Error

```bash
# Make sure all imports use correct paths:
# ✅ import Button from '@components/ui/Button'
# ❌ import Button from './components/Button'

# Check that path aliases are correct in tsconfig.json
```

### Theme Not Switching

```bash
# Check browser console for errors
# Verify localStorage is enabled
# Try clearing browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Hot Module Replacement Not Working

```bash
# Restart development server
# Stop: Ctrl+C in terminal
# Start: npm run dev
```

### TypeScript Errors

```bash
# Check for type errors
npx tsc --noEmit

# If errors appear, verify:
# - All imports are correct
# - All types are defined
# - No implicit 'any' types
```

---

## Development Commands

### Regular Development

```bash
# Start dev server (with HMR)
npm run dev

# Format code
npm run format

# Check linting
npm run lint

# Build production
npm run build

# Preview production build
npm run preview
```

---

## Quick Checklist: Installation Complete?

- [ ] Node.js 18+ installed
- [ ] npm dependencies installed (no errors)
- [ ] .env file created
- [ ] Development server starts without errors
- [ ] Browser opens to http://localhost:3000
- [ ] Login page displays correctly
- [ ] Theme toggle works
- [ ] Sidebar navigation visible
- [ ] All routes accessible
- [ ] Dark mode switches correctly
- [ ] ESLint passes (npm run lint)
- [ ] No red errors in browser console
- [ ] Production build completes (npm run build)

---

## Next Steps

✅ **Installation complete!**

Now proceed to: **PHASE_01_TESTING.md** for comprehensive testing checklist

---

## Support

If you encounter issues:

1. Check error message in terminal or browser console
2. Refer to Troubleshooting section above
3. Verify all prerequisites are installed
4. Try clearing cache: `npm cache clean --force`
5. Reinstall: `rm -rf node_modules && npm install`

---

**Installation Guide Complete – Ready to test Phase 01!**
