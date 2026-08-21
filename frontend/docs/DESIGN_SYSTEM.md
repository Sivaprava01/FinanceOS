# FinanceOS Design System

## Overview

The FinanceOS Design System provides a consistent, reusable component library and design tokens for building the UI.

**Updated**: August 19, 2026 (Phase 04 Priority 1)

---

## Color System

### Semantic Colors

All colors are defined as CSS variables in `globals.css` and exposed as Tailwind utilities.

#### Light Mode
```
Primary:      Electric Blue (HSL: 217 100% 52%)  → bg-primary, text-primary
Success:      Green (HSL: 120 100% 40%)          → bg-success, text-success
Warning:      Yellow/Orange (HSL: 38 92% 50%)    → bg-warning, text-warning
Info:         Blue (HSL: 217 100% 52%)           → bg-info, text-info
Destructive:  Red (HSL: 0 84.2% 60.2%)          → bg-destructive, text-destructive
```

#### Background Variants
All semantic colors support `/10` opacity for backgrounds:
```
bg-success/10    → 10% opacity background
text-success     → Full opacity text color
```

### Usage Examples

```typescript
// Badge with semantic colors
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Failed</Badge>

// Status displays
<div className="text-destructive">Error</div>
<div className="text-success">Completed</div>
<div className="text-warning">Processing</div>

// Backgrounds
<div className="bg-success/10 text-success">Success message</div>
<div className="bg-destructive/10 text-destructive">Error message</div>
```

---

## Typography

### Heading Hierarchy

Use the `Heading` component for consistent typography:

```typescript
import { Heading } from '@components/typography'

// Page titles
<Heading level="h1">Dashboard</Heading>

// Section headers
<Heading level="h2">Recent Transactions</Heading>

// Subsection headers
<Heading level="h3">This Month</Heading>
```

### Letter Spacing

- **H1, H2**: `tracking-tighter` (-0.05em) - Very tight for impact
- **H3, H4**: `tracking-tight` (-0.025em) - Tight for hierarchy
- **H5, H6**: Standard spacing
- **Body**: Leading 1.65 for readability

### Micro Labels

Use `MicroLabel` for small, uppercase labels:

```typescript
import { MicroLabel } from '@components/typography'

<MicroLabel>MICRO LABEL</MicroLabel>
// Output: 13px, uppercase, with wide letter-spacing
```

---

## Layout Components

### Container

Wraps content with max-width and responsive padding:

```typescript
import { Container } from '@components/layout'

<Container maxWidth="xl">
  <h1>Page Title</h1>
  {/* Content is centered with max-width 1280px */}
</Container>
```

**Max-width Options**: sm, md, lg, xl, 2xl

### Section

Groups content with consistent vertical spacing:

```typescript
import { Section } from '@components/layout'

<Section spacing="lg">
  <h2>Section Title</h2>
  {/* Content has 64px vertical padding */}
</Section>
```

**Spacing Options**: sm (32px), md (48px), lg (64px), xl (80px)

---

## UI Components

### Badge

Display status, tags, or labels:

```typescript
import { Badge } from '@components/ui'

<Badge variant="success" size="md">Active</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
<Badge variant="destructive" size="lg">Failed</Badge>
```

**Variants**: default, success, warning, destructive, info, secondary  
**Sizes**: sm, md, lg

### EmptyState

Display when no data is available:

```typescript
import { EmptyState } from '@components/ui'
import { FileX } from 'lucide-react'

<EmptyState
  icon={FileX}
  title="No Transactions"
  description="Upload a statement to get started"
  action={{
    label: "Upload Statement",
    onClick: () => handleUpload()
  }}
/>
```

### SkeletonLoader

Show loading placeholders:

```typescript
import { SkeletonLoader } from '@components/ui'

{isLoading && <SkeletonLoader type="card" count={3} />}
{isLoading && <SkeletonLoader type="row" count={5} />}
{isLoading && <SkeletonLoader type="chart" />}
```

**Types**: card, row, text, line, circle, chart  
**Props**: type, count, height, width, className

### ErrorState

Display error messages with retry option:

```typescript
import { ErrorState } from '@components/ui'

{error && (
  <ErrorState
    title="Failed to Load"
    message="Could not fetch transactions. Please try again."
    onRetry={() => refetch()}
  />
)}
```

### SuccessMessage

Display success feedback:

```typescript
import { SuccessMessage } from '@components/ui'

{success && (
  <SuccessMessage
    message="Transaction created successfully!"
    onDismiss={() => setSuccess(false)}
    autoHide={true}
    duration={3000}
  />
)}
```

---

## Component Integration Pattern

### Before (Ad-hoc)
```typescript
// Scattered hardcoded colors and states
{isLoading && <div className="h-8 animate-pulse rounded" />}
{error && <p className="text-sm text-red-600">Error: {error}</p>}
{empty && <div>No data available</div>}
{success && <p className="bg-green-50 text-green-700">Success!</p>}
```

### After (Consistent)
```typescript
import { SkeletonLoader, ErrorState, EmptyState, SuccessMessage } from '@components/ui'

{isLoading && <SkeletonLoader type="row" count={3} />}
{error && <ErrorState message={error} onRetry={refetch} />}
{empty && <EmptyState title="No Data" />}
{success && <SuccessMessage message="Success!" />}
```

---

## Tailwind Semantic Classes

### Colors

```css
/* Primary color variants */
bg-primary           /* Electric Blue background */
text-primary         /* Electric Blue text */
bg-primary/10        /* 10% opacity background */

/* Success color variants */
bg-success           /* Green background */
text-success         /* Green text */
bg-success/10        /* 10% opacity background */

/* Warning color variants */
bg-warning           /* Yellow/Orange background */
text-warning         /* Yellow/Orange text */
bg-warning/10        /* 10% opacity background */

/* Info color variants */
bg-info              /* Blue background */
text-info            /* Blue text */
bg-info/10           /* 10% opacity background */

/* Destructive color variants */
bg-destructive       /* Red background */
text-destructive     /* Red text */
bg-destructive/10    /* 10% opacity background */
```

### Typography

```css
/* Headings with proper spacing */
text-4xl tracking-tighter    /* H1 */
text-3xl tracking-tighter    /* H2 */
text-2xl tracking-tight      /* H3 */
text-xl tracking-tight       /* H4 */

/* Body text */
leading-[1.65]              /* Standard body line-height */

/* Micro labels */
text-xs font-semibold uppercase tracking-wider
```

---

## Best Practices

### 1. Use Semantic Colors Over Hardcoded
❌ Bad:
```typescript
<div className="text-green-600">Success</div>
```

✅ Good:
```typescript
<div className="text-success">Success</div>
```

### 2. Use Components Over Raw HTML
❌ Bad:
```typescript
{isLoading && <div className="h-8 animate-pulse rounded" />}
```

✅ Good:
```typescript
{isLoading && <SkeletonLoader type="card" />}
```

### 3. Group Related Spacing with Sections
❌ Bad:
```typescript
<div className="py-12">Content</div>
```

✅ Good:
```typescript
<Section spacing="lg">Content</Section>
```

### 4. Use Headings for Hierarchy
❌ Bad:
```typescript
<h2 className="text-2xl font-bold">Title</h2>
```

✅ Good:
```typescript
<Heading level="h2">Title</Heading>
```

---

## Accessibility

### Color Contrast
All semantic colors meet WCAG 2.1 AA standards (4.5:1 minimum contrast for normal text):
- Success: Green on white ✅
- Warning: Orange on white ✅
- Destructive: Red on white ✅
- Info: Blue on white ✅

### Component Patterns
- **Badge**: Use with descriptive text, not color alone
- **EmptyState**: Always provide title and description
- **ErrorState**: Always include user-friendly error message
- **SuccessMessage**: Use alongside other feedback (e.g., data refresh)

### ARIA Labels
Components include proper ARIA attributes:
```typescript
<SuccessMessage message="Saved" /> // Has aria-label internally
<EmptyState icon={X} title="No Data" /> // Icon has aria-hidden
```

---

## Migration Guide

### Migrating Existing Pages

1. **Find hardcoded colors**:
   ```bash
   grep -r "bg-green-\|text-red-\|bg-blue-" src/pages/
   ```

2. **Replace with semantic**:
   ```
   bg-green-50/text-green-700 → bg-success/10 text-success
   text-red-600 → text-destructive
   text-blue-600 → text-info
   ```

3. **Integrate components**:
   ```typescript
   // Before
   {isLoading && <div className="h-8 animate-pulse" />}
   
   // After
   {isLoading && <SkeletonLoader type="row" />}
   ```

### Pages Completed (Priority 1)
- ✅ Statements
- ✅ Settings
- ✅ Search
- ✅ Profile
- ✅ HowItWorks
- ✅ FamilyFinance
- ✅ Dashboard
- ✅ Categories
- ✅ Analytics

### Pages Remaining (Priority 2+)
- ⏳ Transactions (full integration needed)
- ⏳ Onboarding (animation + components)
- ⏳ Other minor pages

---

## Resources

- **Design Specification**: `frontend/docs/ui.md`
- **Phase 04 Plan**: `frontend/kirofiles/PHASE_04_PLAN.md`
- **Phase 04 Progress**: `frontend/kirofiles/PHASE_04_PROGRESS.md`
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/

---

## Questions?

Refer to the component files directly:
- `frontend/src/components/ui/`
- `frontend/src/components/typography/`
- `frontend/src/components/layout/`

