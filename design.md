# FinanceOS — Complete Frontend Design & System Specification (`design.md`)

> **Document Version:** 2.0.0  
> **Target Audience:** StitchMCP, UI/UX Designers, Frontend Engineers, AI Design Agents  
> **System Philosophy:** *Calm Financial Intelligence* — High-density, editorial financial typography, crisp data contrast, soothing warm-stone neutrals in light mode, and deep obsidian with vivid emerald accents in dark mode. Zero visual clutter, zero generic SaaS templates.

---

## 1. Executive Summary & Design Philosophy

**FinanceOS** is a private, privacy-first personal and family financial operating system. Unlike traditional budgeting apps that require bank logins or screen-scraping credentials, FinanceOS operates on **direct document parsing** (PDF statements, Excel spreadsheets, CSVs) and structured manual recording, augmented with intelligent categorisation, multi-currency valuations, and granular family data sharing.

### The Core Design Principles
1. **Calm Financial Clarity:** Financial data can cause cognitive overload. The UI uses warm stone backgrounds (`#F7F7F4`), hairline borders (`1px`), subtle surface elevations, and generous breathing room to induce focus and calm.
2. **Editorial Typography Meets Modern Monospace:** Headlines and primary financial totals use **Source Serif 4** for high-trust authority, body copy uses **DM Sans** for legible UI readability, and amounts/currencies use **JetBrains Mono** with `tabular-nums` for precision alignment.
3. **Data Contrast & Dual-Currency Visibility:** Every monetary figure is cleanly distinguishable (Income in Pine Green/Emerald, Expenses in Crisp Carbon/Muted, Liabilities in Warm Amber, Outflows in Ledger Crimson). Live currency conversion is displayed as clean dual-line values (e.g. `$1,250.00` with secondary `≈ ₹1,04,250.00`).
4. **Desktop Density with Mobile Fluidity:** Dense multi-column financial ledger grids on desktop collapse into touch-friendly cards with swipeable action pills on mobile.

---

## 2. Design Tokens, Themes & Foundations

### 2.1 Color Palettes

The design system is defined in HSL CSS variables and Tailwind utility tokens supporting seamless Light and Dark modes.

#### Light Mode: *"Calm Financial Intelligence"*
| Token | HSL Value | Hex Equivalent | Visual Role & Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `48 14% 97%` | `#F7F7F4` | Warm stone page background |
| `--foreground` | `150 5% 10%` | `#171918` | Deep carbon ink for primary text & headings |
| `--card` | `0 0% 100%` | `#FFFFFF` | Crisp white elevated card surface |
| `--card-foreground`| `150 5% 10%` | `#171918` | Text on card surfaces |
| `--primary` | `164 65% 26%` | `#176B52` | Pine Green — brand anchor, primary buttons, income |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary buttons and badges |
| `--secondary` | `42 16% 94%` | `#F2F2EE` | Soft stone secondary surface & table hover |
| `--secondary-foreground` | `150 5% 15%` | `#222624` | Text on secondary surfaces |
| `--muted` | `48 10% 93%` | `#EEEEEC` | Inactive tabs, placeholder backgrounds |
| `--muted-foreground` | `120 2% 42%` | `#696D69` | Secondary captions, timestamps, table headers |
| `--border` | `75 7% 89%` | `#E4E6E1` | Hairline 1px borders on cards and dividers |
| `--input` | `75 7% 89%` | `#E4E6E1` | Input field borders |
| `--ring` | `164 65% 26%` | `#176B52` | Focus ring color |
| `--destructive` | `0 45% 50%` | `#B84A4A` | Ledger Crimson — delete actions, negative trends |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Text on destructive buttons |
| `--success` | `164 65% 26%` | `#176B52` | Pine Green for positive confirmations |
| `--warning` | `40 40% 50%` | `#B28B38` | Gold-slate for pending statements & liabilities |
| `--info` | `164 65% 26%` | `#176B52` | System announcements & informational callouts |

#### Dark Mode: *"Deep Obsidian & Vivid Pine"*
| Token | HSL Value | Hex Equivalent | Visual Role & Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `222 47% 7%` | `#0B0F17` | Deep obsidian background |
| `--foreground` | `210 20% 98%` | `#F8FAFC` | Bright crisp foreground text |
| `--card` | `220 35% 12%` | `#131B28` | Obsidian card surface |
| `--card-foreground`| `210 20% 98%` | `#F8FAFC` | Card foreground text |
| `--primary` | `155 55% 48%` | `#32BA82` | Vivid Pine Emerald — high contrast brand glow |
| `--primary-foreground` | `222 47% 7%` | `#0B0F17` | Dark ink on emerald buttons |
| `--secondary` | `220 30% 16%` | `#1A2436` | Secondary surfaces, hover states |
| `--secondary-foreground` | `210 20% 98%` | `#F8FAFC` | Text on secondary elements |
| `--muted` | `220 30% 16%` | `#1A2436` | Muted backgrounds |
| `--muted-foreground` | `215 15% 65%` | `#94A3B8` | Subtle captions, timestamps |
| `--border` | `218 25% 20%` | `#243245` | Subtle dark slate border |
| `--input` | `218 25% 20%` | `#243245` | Dark input borders |
| `--ring` | `155 55% 48%` | `#32BA82` | Focus glow ring |
| `--destructive` | `0 65% 58%` | `#E05252` | Crimson alert |
| `--warning` | `40 50% 55%` | `#D4A343` | Amber indicator |

#### 8-Color Categorical Data Visualization Palette
Used across Area Charts, Donut Pies, and Category Badges:
1. `Color 1 (Pine Green):` `#176B52` / `#32BA82` (Income, Investments, Primary category)
2. `Color 2 (Sapphire Blue):` `#3B82F6` (Utilities, Tech, Bank transfers)
3. `Color 3 (Gold-Slate / Amber):` `#B28B38` / `#F59E0B` (Dining, Food, Liabilities)
4. `Color 4 (Ledger Crimson):` `#B84A4A` / `#E05252` (High-cost expenses, Debt)
5. `Color 5 (Cyan Teal):` `#06B6D4` (Travel, Transportation)
6. `Color 6 (Violet Purple):` `#8B5CF6` (Shopping, Entertainment, Subscriptions)
7. `Color 7 (Emerald Jade):` `#10B981` (Healthcare, Wellness)
8. `Color 8 (Rose Pink):` `#EC4899` (Family, Miscellaneous)

---

### 2.2 Typography Scale & Hierarchy

| Element | Font Family | Size | Weight | Line Height | Tracking | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `Source Serif 4` | `36px – 56px` | Normal / 400 | `1.15` | `-0.02em` | Landing & Hero Statements |
| **Page Header (H1)** | `Source Serif 4` | `24px – 28px` | Bold / 700 | `1.25` | `-0.02em` | Top-level page titles |
| **Section Title (H2)**| `Source Serif 4` | `20px – 22px` | Semibold / 600| `1.3` | `-0.01em` | Card group titles |
| **Card Header (H3)** | `Source Serif 4` | `16px – 18px` | Bold / 700 | `1.35` | `-0.01em` | Modal & Widget headers |
| **Subheading (H4)** | `DM Sans` | `14px – 15px` | Medium / 500 | `1.4` | `0` | Small card titles |
| **Overline / Badge** | `JetBrains Mono` | `10px – 11px` | Semibold / 600| `1.2` | `+0.05em` | Uppercase category tags |
| **Body (Default)** | `DM Sans` | `13px – 14px` | Regular / 400 | `1.5` | `0` | Paragraphs, table values |
| **Small / Caption** | `DM Sans` | `11px – 12px` | Regular / 400 | `1.4` | `0` | Timestamps, metadata |
| **Monospace / Num** | `JetBrains Mono` | `12px – 32px` | Bold / 700 | `1.2` | `0` | `tabular-nums` Currency amounts |

---

### 2.3 Layout, Spacing & Elevation Tokens

* **Base Unit:** 4px (8pt grid system: `4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px`)
* **Corner Radii:**
  * `--radius`: `0.5rem` (8px for Cards, Modals, Dropdowns)
  * Button / Input radius: `0.375rem` (6px)
  * Badge radius: `0.25rem` (4px)
  * Full pill radius: `9999px`
* **Card Elevation & Shadows:**
  * `shadow-2xs`: `0 1px 2px 0 rgb(0 0 0 / 0.03)`
  * `shadow-xs`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
  * `shadow-sm`: `0 2px 4px 0 rgb(0 0 0 / 0.06)`
  * `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.08)`
  * `shadow-2xl`: `0 25px 50px -12px rgb(0 0 0 / 0.25)` (Modals & Dialogs)
* **Breakpoints:**
  * `xs`: `< 640px` (Mobile portrait)
  * `sm`: `640px` (Mobile landscape / small tablet)
  * `md`: `768px` (Tablet / Collapsed Sidebar breakpoint)
  * `lg`: `1024px` (Small laptop / Expanded desktop layout)
  * `xl`: `1280px` (Standard desktop — `max-w-7xl`)

---

## 3. Global Navigation & Layout Chrome

```
+-----------------------------------------------------------------------------------------------+
| TOP NAVIGATION BAR (Sticky H: 56px)                                                          |
| [Logo] FinanceOS > [Breadcrumb: Dashboard]      [Q Search transactions... (/) ]  [Theme] [👤] |
+-----------------------+-----------------------------------------------------------------------+
| SIDEBAR (W: 240px)    | MAIN APPLICATION CONTENT VIEW (Scrollable, max-w-7xl)                 |
|                       |                                                                       |
| MAIN                  |  +-----------------------------------------------------------------+  |
|  [■] Dashboard        |  | PAGE HEADER & CONTEXT RIBBON                                    |  |
|  [💳] Transactions    |  | H1: Financial Overview               [+ Add Txn] [↑ Import Stmt] |  |
|  [📄] Statements      |  +-----------------------------------------------------------------+  |
|  [📊] Analytics       |                                                                       |
|                       |  +-----------------------------------------------------------------+  |
| COLLABORATION         |  | NET WORTH HERO SPLIT CARD (12 Cols)                             |  |
|  [👥] Family Finance  |  | Left: Net Worth & EMI        | Right: Assets & Liabilities      |  |
|                       |  +-----------------------------------------------------------------+  |
| ORGANIZE              |                                                                       |
|  [🏷] Categories      |  +-------------------+ +-------------------+ +---------------------+  |
|  [🔍] Search          |  | Income Card       | | Expenses Card     | | Net Savings Card    |  |
|                       |  +-------------------+ +-------------------+ +---------------------+  |
| SYSTEM / FOOTER       |                                                                       |
|  [?] How It Works     |  +---------------------------------+ +-----------------------------+  |
|  [👤] Profile         |  | 6-Month Spending Trends (Chart) | | Category Breakdown (Donut)  |  |
|  [⚙] Settings         |  +---------------------------------+ +-----------------------------+  |
|  [<| Collapse] [Exit] |                                                                       |
+-----------------------+-----------------------------------------------------------------------+
```

### 3.1 Sidebar Navigation (`Sidebar.tsx`)
* **Position:** Fixed left sidebar on desktop (`w-64` expanded, `w-16` collapsed); slide-over drawer on mobile (`z-50`).
* **Header:** Brand icon with green pine background (`w-8 h-8 rounded-md bg-primary text-white font-serif font-bold`) + title "FinanceOS" + subtitle "Personal Finance".
* **Navigation Groupings:**
  * **Main:**
    1. Dashboard (`/dashboard`, icon: `LayoutGrid`)
    2. Transactions (`/transactions`, icon: `Wallet`)
    3. Statements (`/statements`, icon: `FileText`)
    4. Analytics (`/analytics`, icon: `BarChart3`)
  * **Collaboration:**
    5. Family Finance (`/family`, icon: `Users`)
  * **Organize:**
    6. Categories (`/categories`, icon: `Tags`)
    7. Search (`/search`, icon: `Search`)
  * **Bottom Utilities:**
    8. How It Works (`/how-it-works`, icon: `HelpCircle`)
    9. Profile (`/profile`, icon: `User`)
    10. Settings (`/settings`, icon: `Settings`)
* **Footer Controls:**
  * Desktop Collapse Toggle Button (`ChevronLeft` / `ChevronRight`)
  * User Account Card with avatar initials, user full name, email, and Logout trigger (`LogOut` icon).

### 3.2 Top Navigation Bar (`TopNavigation.tsx`)
* **Height:** `56px` (`h-14`), sticky top with frosted glass backdrop (`bg-card/95 backdrop-blur-xs border-b border-border`).
* **Left Section:** Mobile hamburger button (`Menu`), dynamic route breadcrumb (e.g. `FinanceOS > Transactions`).
* **Center Section:** Quick omni-search input (`Search` icon, placeholder `"Search anything (press Enter)…"`, shortcut key `kbd: /`). Hidden on `/dashboard` where dedicated widgets exist.
* **Right Section:** Theme Toggle button (Sun/Moon icon with smooth color transition) + User circular avatar pill with initials.

### 3.3 Layout Shells
* **`ProtectedLayout.tsx`:** Renders authenticated shell with sidebar, top nav, accessible "Skip to Content" anchor, and global `<BackButton />`.
* **`PublicLayout.tsx`:** Centered single-column minimalist container (`max-w-sm`) for Auth and Public flows.

---

## 4. Shared Atomic Components & UI Tokens

### 4.1 Buttons (`Button.tsx`)
* **Variants:**
  * `primary` (default): Solid Pine Green background (`bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98]`).
  * `secondary`: Soft neutral stone background (`bg-secondary text-secondary-foreground hover:bg-secondary/80`).
  * `outline`: Hairline border with transparent background (`border border-border bg-transparent hover:bg-muted text-foreground`).
  * `ghost`: Completely transparent (`hover:bg-secondary hover:text-foreground`).
  * `destructive`: Ledger Crimson (`bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs`).
* **Sizes:**
  * `xs`: `h-7 px-2.5 text-[11px]`
  * `sm`: `h-8 px-3 text-xs`
  * `md` (default): `h-9 px-4 text-xs font-medium`
  * `lg`: `h-10 px-5 text-sm`
  * `icon-sm`: `h-8 w-8 p-0`

### 4.2 Form Inputs & Controls (`Input.tsx`)
* **Text / Number / Date Inputs:** `h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary`.
* **Dropdown Selects:** Native styling with custom arrow padding, border, and focus states.
* **Keyboard Shortcut Badges:** `<kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">`

### 4.3 Cards & Data Containers (`Card.tsx`)
* **Surface:** `rounded-xl border border-border bg-card shadow-xs`.
* **Sections:** `CardHeader` (padded with bottom border), `CardTitle` (`font-serif text-base font-bold`), `CardDescription` (`text-xs text-muted-foreground`), `CardContent` (`p-5`), `CardFooter` (`border-t p-4`).

### 4.4 Status Badges (`Badge.tsx`)
* `Income`: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`
* `Expense`: `bg-muted text-muted-foreground border border-border`
* `Asset`: `bg-primary/10 text-primary border border-primary/20`
* `Liability`: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`
* `Statement Statuses`:
  * `Uploaded`: Sky blue / clock
  * `Processing`: Spinning loader / sky blue
  * `Completed`: Emerald checkmark
  * `Password Required`: Amber lock / key
  * `Failed`: Crimson alert

---

## 5. Page-by-Page Detailed Blueprints

---

### Page 1: Public Landing Page (`/` -> `Landing.tsx`)

#### Purpose
High-conversion public introduction highlighting zero-bank-credential privacy, automated statement extraction, and family collaboration.

#### Visual Structure & Wireframe
1. **Top Announcement Banner:**
   * Left: Green pulse dot + text `"FinanceOS • Private personal finance & statement tracking"`.
   * Right: `"CURRENCIES: INR (₹) • USD ($) • EUR (€)"`.
2. **Main Header Navigation:**
   * Logo with Serif "F" mark + "FinanceOS".
   * Navigation links: `Overview`, `Features`, `Security & Privacy`.
   * Actions: Theme Toggle, `Sign In` (Ghost button), `Get Started` (Primary button).
3. **Hero Section:**
   * Pill Tag: `● Personal Finance • Zero Bank Credentials Required`.
   * Headline (H1 Serif): `"Take control of your personal finances. Clear, simple, and privacy-focused."` (Italic pine green accent).
   * Paragraph: `"FinanceOS turns your bank statements into organized transactions, clear spending insights, and shared family budgets—without connecting to third-party bank aggregators."`
   * Buttons: `Get Started Free (ArrowRight)` (Primary LG) + `Sign In` (Outline LG).
   * Format Badges: Checkmarks for `PDF Bank Statements`, `CSV & Excel Spreadsheets`, `Family & Household Groups`.
4. **Hero Live Sample Dashboard Card:**
   * Browser chrome frame (`app.financeos.com` bar + `SAMPLE OVERVIEW` badge).
   * Net worth metric: `₹42,85,600` (`+4.2% This Quarter`).
   * Total Assets: `₹58,12,400.00` (Bank Accounts + Investments).
   * Total Liabilities: `₹15,26,800.00` (Loans + Credit Cards).
5. **Capabilities 6-Card Grid:**
   1. *Automated Statement Parsing:* Multi-page PDF, CSV, XLS with password support.
   2. *Privacy-First Design:* Zero scraping, zero aggregator credential storage.
   3. *Family Finance Sharing:* Shared household budgets with role-based visibility.
   4. *Income & Expense Analytics:* Savings rates, debt ratios, net worth progress.
   5. *Smart Categorization:* Machine-learned categorization rules.
   6. *Multi-Currency Support:* Live conversion across 150+ ISO currencies.
6. **Security Callout Box:**
   * Dark stone container, Lock icon, `"Your Financial Data Stays Private"`, `"Get Started Free"` CTA.
7. **Editorial Footer:**
   * Copyright notice, links to `/how-it-works`, `/login`, `/register`.

---

### Page 2: Product Workflow Guide (`/how-it-works` -> `HowItWorks.tsx`)

#### Purpose
Step-by-step interactive visual explainer breaking down the FinanceOS processing pipeline.

#### Visual Structure & Sections
1. **Header:** Title `"How FinanceOS Works"`, subtitle `"A complete guide to importing statements, tracking net worth, and collaborating on family budgets."`
2. **6 Sequential Pipeline Cards:**
   * **Step 01: Upload Bank Statements** (Badge: `Input`, Icon: `UploadCloud`, Direct button: `"Go to Statements"`).
   * **Step 02: Automatic Extraction** (Badge: `Processing`, Icon: `Cpu`, Direct button: `"View Statements"`).
   * **Step 03: Review & Categorize** (Badge: `Organization`, Icon: `SlidersHorizontal`, Direct button: `"Manage Transactions"`).
   * **Step 04: Track Net Worth & KPIs** (Badge: `Overview`, Icon: `Wallet`, Direct button: `"Explore Dashboard"`).
   * **Step 05: Deep Analytics** (Badge: `Intelligence`, Icon: `TrendingUp`, Direct button: `"Open Analytics"`).
   * **Step 06: Family Collaboration** (Badge: `Sharing`, Icon: `Users`, Direct button: `"Family Settings"`).
3. **Architecture & Security Deep-Dive Cards:**
   * Column 1: *Privacy by Architecture* (Local-first processing, client encryption).
   * Column 2: *Bank Statement Compatibility* (List of supported Indian and International banks: HDFC, ICICI, SBI, Axis, Chase, Citi, Barclays).
4. **Bottom Sticky CTA Banner:** `"Ready to take control of your financial data?"` + `Get Started Free` button.

---

### Page 3: User Onboarding Walkthrough (`/onboarding` -> `Onboarding.tsx`)

#### Purpose
First-time user onboarding wizard explaining key features in 6 steps with a progress bar and local-storage completion toggle.

#### Visual Structure
* **Card Container:** Centered `max-w-lg` elevated card with progress indicator (`Step X of 6`).
* **Content Area:** Large animated icon + Serif step title + 2-line explanation.
* **Footer Actions:**
  * Checkbox: `"Never show this onboarding again"`.
  * Left: `Back` button (disabled on step 1).
  * Right: `Skip` (Ghost) + `Next` / `Get Started` (Primary button).

---

### Page 4: Authentication Suite (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`)

#### 4.1 Login (`Login.tsx`)
* **Headline:** `"Sign In"`, description `"Enter your credentials to access your account"`.
* **OAuth Button:** Full-width `"Continue with Google"` button with official 4-color Google G icon.
* **Divider:** `"Or continue with email"`.
* **Form Inputs:**
  * Email (`type="email"`, placeholder `"you@example.com"`).
  * Password (`type="password"`, placeholder `"••••••••"`).
  * Row: `"Remember me"` checkbox + `"Forgot password?"` link.
* **Submit Action:** Full-width Primary Button `"Sign In"`.
* **Footer:** `"Don't have an account? Create one"`.

#### 4.2 Register (`Register.tsx`)
* **Headline:** `"Create Account"`, description `"Start organizing your personal finances today"`.
* **Google OAuth Button:** `"Sign up with Google"`.
* **Form Inputs:**
  * Full Name (`type="text"`, placeholder `"John Doe"`).
  * Email Address (`type="email"`).
  * Password with strength validation hints (min 8 chars, 1 uppercase, 1 number).
  * Base Currency Dropdown (Default: `INR - Indian Rupee (₹)`, searchable list of 150+ currencies).
* **Submit Action:** `"Create Account"`.
* **Footer:** `"Already have an account? Sign In"`.

#### 4.3 Forgot & Reset Password
* **Forgot Password (`ForgotPassword.tsx`):** Email input + `"Send Reset Instructions"` button + `"Back to Sign In"`.
* **Reset Password (`ResetPassword.tsx`):** New password + Confirm password inputs + `"Update Password"` button.

---

### Page 5: Financial Overview Dashboard (`/dashboard` -> `Dashboard.tsx`)

#### Purpose
The primary financial command center displaying real-time net worth, multi-currency conversion, cash flow velocity, charts, and recent activity feed.

#### Visual Layout Blueprint
```
+----------------------------------------------------------------------------------------------------+
| CONTEXT RIBBON & ACTION BAR                                                                        |
| H1: Financial Overview                                          [+ Add Transaction] [↑ Import Stmt]|
| As of September 2026                                                                               |
+----------------------------------------------------------------------------------------------------+
| MULTI-CURRENCY CONVERSION NOTICE                                                                   |
| [🌐] All totals are converted to INR (₹) using live market rates (1 USD ≈ ₹83.95).                  |
+----------------------------------------------------------------------------------------------------+
| NET WORTH HERO MODULE (12-Column Grid)                                                             |
| +-----------------------------------------------+ +-----------------------------------------------+ |
| | NET WORTH DISPLAY (5 Cols)                    | | ASSETS & LIABILITIES SPLIT (7 Cols)           | |
| | [Net Worth]              [● Assets & Savings] | | [● TOTAL ASSETS]                  ₹58,12,400  | |
| | ₹42,85,600.00                                 | |  • Bank Balances                  ₹58,12,400  | |
| | ≈ $51,048.00 USD                              | |  • Synced Accounts                Active      | |
| | Calculated from accounts, assets & debts.     | |                                               | |
| |                                               | | [● TOTAL LIABILITIES]             ₹15,26,800  | |
| | [🏛 Monthly Loan & EMI Payments]    ₹34,500.00| |  • Outstanding Debts              ₹15,26,800  | |
| |    2 Active Loans / EMIs                      | |  • Debt-to-Asset Ratio            26.3%       | |
| +-----------------------------------------------+ +-----------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| 3-COLUMN CASHFLOW STRIP                                                                            |
| +-----------------------------+ +-----------------------------+ +--------------------------------+ |
| | MONTHLY INCOME        [↑]   | | MONTHLY EXPENSES      [↓]   | | NET SAVINGS              [💰]  | |
| | +₹1,45,000.00               | | -₹82,450.00                 | | +₹62,550.00                    | |
| | [████████████████████] 100% | | [███████████.........] 56.8%| | [█████████████.......] 43.1%   | |
| +-----------------------------+ +-----------------------------+ +--------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| VISUAL ANALYTICS 2-COLUMN GRID                                                                     |
| +-----------------------------------------------+ +-----------------------------------------------+ |
| | Spending Trends (6-Month Area Chart)          | | Spending by Category (Donut + Top 5 Rows)     | |
| | [ Area Chart: Apr May Jun Jul Aug Sep ]       | | [ Donut Pie ]  1. Housing         ₹35,000.00  | |
| |                                               | |                2. Food & Dining   ₹18,200.00  | |
| |                                               | |                3. Transport       ₹12,400.00  | |
| |                               [Analytics ->]  | |                                [Categories ->]| |
| +-----------------------------------------------+ +-----------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| RECENT TRANSACTIONS LEDGER                                                            [View All ->]|
| [N] Netflix Subscription     Entertainment · Today              -₹649.00                           |
| [S] Salary Deposit           Income · Sep 01                 +₹1,45,000.00                         |
| [A] Amazon India             Shopping · Aug 28                -₹3,499.00                           |
| [H] HDFC Home Loan EMI       Liability · Aug 25              -₹34,500.00                           |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Element Specifications
1. **Header Action Bar:**
   * Title: `Financial Overview` (H1 Source Serif 4).
   * Subtitle: `As of [Current Month Year]`.
   * Buttons: `+ Add Transaction` (Outline) + `Import Statement` (Primary).
2. **Net Worth Hero Module:**
   * Net worth metric rendered in `36px` serif with secondary dual-currency caption.
   * Monthly EMI bar card embedded with Landmark bank icon.
   * Total Assets pillar with live bank balances and status.
   * Total Liabilities pillar with outstanding debts and calculated `Debt-to-Asset Ratio %`.
3. **Cashflow Strip (3 Cards):**
   * *Monthly Income:* Pine green badge, total inflow amount, 100% baseline bar.
   * *Monthly Expenses:* Crimson badge, total outflow, expense-to-income percentage bar.
   * *Net Savings:* Wallet icon, net retained savings amount, savings rate progress bar.
4. **Charts & Analytics Grid:**
   * *Spending Trends Area Chart:* Recharts `<AreaChart />` with subtle Pine Green vertical gradient (`hsl(var(--primary))`), smooth monotone interpolation, custom dual-currency hover tooltip.
   * *Category Donut Chart:* Recharts `<PieChart />` with inner radius 48px, outer radius 72px, 8-color categorical palette, alongside top-5 category rows with color indicator dots.
5. **Recent Transactions Feed:**
   * 6 latest entries with avatar initials, normalized transaction type badge, category tag, date, and multi-currency converted amounts.

---

### Page 6: Transactions Ledger (`/transactions` -> `Transactions.tsx`)

#### Purpose
Comprehensive transaction ledger with full-text search, multi-faceted filtering, batch categorization, bulk deletion, inline editing, manual creation, and CSV export.

#### Visual Layout Blueprint
```
+----------------------------------------------------------------------------------------------------+
| 4-CARD TOP LEDGER VELOCITY METRICS                                                                 |
| +-------------------+ +-------------------+ +---------------------+ +----------------------------+ |
| | Total Income      | | Total Expenses    | | Net Savings         | | Total Transactions Count   | |
| | +₹1,45,000.00     | | -₹82,450.00       | | +₹62,550.00         | | 148 Records                | |
| | [● Income]        | | [● Expenses]      | | [43.1% savings rate]| | [● All Accounts]           | |
| +-------------------+ +-------------------+ +---------------------+ +----------------------------+ |
+----------------------------------------------------------------------------------------------------+
| HEADER & ACTIONS                                                                                   |
| H1: Transactions (148 recorded transactions • All accounts)                 [Export CSV] [+ Add Txn]|
+----------------------------------------------------------------------------------------------------+
| SEARCH & FILTER TOOLBAR                                                                            |
| [ 🔍 Search merchant, memo, category... (/) ]  [All] [Expense] [Income] [Asset] [Liability] [Filter]|
| Expanded: [Category: All v] [Source: All v] [From Date] [To Date] [Min Amount] [Reset Filters]     |
+----------------------------------------------------------------------------------------------------+
| BULK ACTION BAR (Conditional - when > 0 items checked)                                             |
| [● 4 records selected]                     [Category: Select v] [Bulk Categorize] [🗑 Delete] [X]   |
+----------------------------------------------------------------------------------------------------+
| TRANSACTIONS DATA TABLE                                                                            |
| [ ] | Date       | Merchant / Description             | Category        | Amount       | Actions   |
|-----+------------+------------------------------------+-----------------+--------------+-----------|
| [x] | 2026-09-12 | Apple Services (iCloud 2TB)        | Cloud & Tech    |    -₹749.00  | [Edit][🗑] |
| [ ] | 2026-09-10 | Google Pay Transfer (Grocery)      | Food & Groceries|  -₹2,450.00  | [Edit][🗑] |
| [ ] | 2026-09-01 | Employer Payroll Transfer          | Salary Income   |+₹1,45,000.00  | [Edit][🗑] |
|-----+------------+------------------------------------+-----------------+--------------+-----------|
| Showing 1 to 50 of 148 entries                                                  [● Up to date]     |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Component Specifications
1. **Top Ledger Velocity Metrics (4 KPI Cards):**
   * *Total Income:* `+formatPrimary(totalInflow)` with green trend icon.
   * *Total Expenses:* `-formatPrimary(totalOutflow)` with amber down icon.
   * *Net Savings:* Net retained amount + calculated `retentionRate%`.
   * *Total Count:* Total recorded rows with verification badge.
2. **Add / Edit Transaction Form Card (Collapsible drawer):**
   * Fields: `Date` (HTML5 date picker), `Merchant / Description` (Text), `Type` (Dropdown: Expense, Income, Asset, Liability), `Category` (Filtered dynamically by selected Type + `+ New` modal trigger), `Payment Method` (Shown for expenses: Cash, UPI, Debit Card, Credit Card, Bank Transfer, Net Banking, Cheque, Wallet, Other), `Amount` (Numeric step 0.01), `Memo / Notes` (Optional full-width input).
   * Actions: `Cancel` (Outline) + `Save Record` / `Update Record` (Primary).
3. **Filter Toolbar & Search Bar:**
   * Full-width search input with instant keyboard focus on `/`.
   * Quick filter pill tabs: `All`, `Expense`, `Income`, `Asset`, `Liability`.
   * `Filters` toggle button opening multi-parameter grid (Category, Source: Manual vs Statement, Date Range, Min/Max Amount).
4. **Bulk Action Floating Banner:**
   * Appears on row selection: Pulse indicator, selection count, Category selector dropdown, `Bulk Categorize` button, `Delete Selected` button, `Clear` button.
5. **Table & Mobile Card Views:**
   * Desktop: Sticky table header with master select-all checkbox, date, merchant, category badge, amount with foreign currency conversion subtitle, and actions.
   * Mobile: Responsive card list with checkbox, merchant name, category pill, payment method, formatted amount, and inline edit/delete links.
6. **Modals & Dialogs:**
   * `DeleteDialog`: Confirmation modal for single or bulk transaction deletions.
   * `CreateCategoryModal`: Embedded modal to define custom categories on the fly.

---

### Page 7: Statements & File Imports (`/statements` -> `Statements.tsx`)

#### Purpose
Upload, password-decrypt, parse, preview, and review bank statements (PDF, CSV, Excel) with automatic currency detection.

#### Visual Layout Blueprint
```
+----------------------------------------------------------------------------------------------------+
| HEADER & STATS                                                                                     |
| H1: Statement Imports (3 Statements • 142 Transactions Parsed)               [🗑 Clear Failed (1)]  |
+----------------------------------------------------------------------------------------------------+
| DRAG-AND-DROP UPLOAD DROPZONE                                                                      |
| +------------------------------------------------------------------------------------------------+ |
| |                                       [ ☁ ↑ Upload Icon ]                                      | |
| |                        Drop bank statement files here, or click to browse                       | |
| |                     Supports PDF (Password-protected), CSV, Excel (XLS, XLSX)                   | |
| |                                        Maximum file size: 15MB                                  | |
| |                                                                                                | |
| | Target Statement Currency: [ INR - Indian Rupee (₹) v ]                                        | |
| +------------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
| TABS: [ Active Statements (2) ]  [ Completed History (1) ]          [ 🔍 Search statements... ]    |
+----------------------------------------------------------------------------------------------------+
| STATEMENTS LIST TABLE                                                                              |
| File Name               | Date Uploaded | Size    | Status            | Parsed | Actions           |
|-------------------------+---------------+---------+-------------------+--------+-------------------|
| HDFC_Sept_2026.pdf      | Sep 12, 2026  | 1.2 MB  | [● Completed]     | 48 txns| [View Txns][🗑]   |
| ICICI_Statement_enc.pdf | Sep 12, 2026  | 840 KB  | [🔑 Password Req] | --     | [Unlock][Retry][🗑]|
| Chase_Checking.csv      | Sep 10, 2026  | 45 KB   | [● Completed]     | 94 txns| [View Txns][🗑]   |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Modals & Dialogs
1. **Statement Review & Import Confirmation Modal (`ImportPreviewDialog`):**
   * Triggered automatically upon statement parsing.
   * **Currency Detection Banner:** Shows detected currency (e.g. `USD`), confidence rating (`high`, `medium`, `low`), and source (e.g. `currency header symbol $`).
   * **Target Currency Selector:** Dropdown to override detected currency.
   * **15-Row Extracted Preview Table:** Date, Description, Type badge, Category, and Formatted Amount.
   * Actions: `Cancel` (deletes raw upload) + `Confirm & Import X Transactions` (Primary).
2. **Password Decryption Modal:**
   * Input for PDF password (with reveal toggle) + `Unlock & Parse` button.
3. **Delete Statement Dialog:**
   * Warns user that deleting the statement will remove all linked transactions.

---

### Page 8: Financial Analytics (`/analytics` -> `Analytics.tsx`)

#### Purpose
Deep-dive financial intelligence across 4 dedicated analytical views: Overview, Expense Analysis, Categories, and Cash Flow.

#### Tabs & Visual Structures
1. **Tab 1: Overview:**
   * **4 KPI Cards:** Total Income, Total Expenses, Net Savings, Savings Rate %.
   * **Income vs. Expense Monthly Comparison:** Grouped Dual-Bar Chart (`hsl(var(--primary))` vs `hsl(var(--destructive))`) over 6–12 months.
   * **Category Expense Distribution:** Donut Pie Chart with interactive legend.
2. **Tab 2: Expense Analysis:**
   * Daily Average Spending Metric (`₹2,748 / day`).
   * High-Value Outlier Transactions Table (> ₹10,000).
   * Payment Method Distribution Breakdown (UPI vs Credit Card vs Net Banking).
3. **Tab 3: Categories:**
   * Full category ranking table sorted by expenditure with percentage of total spend.
   * Month-over-month category trend line charts.
4. **Tab 4: Cash Flow:**
   * Cumulative Net Cash Flow Area Chart.
   * Monthly net balance surplus/deficit waterfall.

---

### Page 9: Family & Household Finance (`/family` -> `FamilyFinance.tsx`)

#### Purpose
Collaborative household finance management allowing family members to pool net worth, track combined expenses, and configure granular data sharing permissions.

#### Visual Layout Blueprint
```
+----------------------------------------------------------------------------------------------------+
| FAMILY SELECTOR & HEADER                                                                           |
| H1: Family Finance — "Sharma Household" (3 Members)           [+ Invite Member] [⚙ Family Settings]|
+----------------------------------------------------------------------------------------------------+
| TABS: [ Family Dashboard ]  [ Household Members (3) ]  [ Pending Invites (1) ]  [ Data Sharing ]    |
+----------------------------------------------------------------------------------------------------+
| TAB 1: CONSOLIDATED HOUSEHOLD COMMAND CENTER                                                       |
| +------------------------------------------------------------------------------------------------+ |
| | Combined Household Net Worth: ₹84,20,000.00            [● 3 Contributing Members]               | |
| | Monthly Shared Expenses: ₹1,12,000.00                                                          | |
| |                                                                                                | |
| | [Members Sharing: 3/3]   [Assets: ₹1.12 Cr]   [Liabilities: ₹27.8 L]   [Net Worth: ₹84.2 L]    | |
| +------------------------------------------------------------------------------------------------+ |
|                                                                                                    |
| +------------------------------------------------+ +---------------------------------------------+ |
| | Total Shared Expenses (This Cycle)             | | Member Spending Contributions               | |
| | ₹1,12,000.00                                   | |  1. Rahul Sharma (Self)   ₹58,000 (51.8%)   | |
| | Sum of shared grocery, utilities & rent.       | |  2. Priya Sharma (Admin)  ₹38,000 (33.9%)   | |
| |                                                | |  3. Amit Sharma (Member)  ₹16,000 (14.3%)   | |
| +------------------------------------------------+ +---------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Tabs Specifications
1. **Tab 1: Family Dashboard:**
   * Consolidated net worth headline + monthly shared expenses.
   * 4-metric sub-grid: Members Sharing, Combined Assets, Combined Liabilities, Household Net Worth.
   * Member spending contribution breakdown with proportional progress bars.
2. **Tab 2: Household Members:**
   * Member cards with avatar initials, role badge (`Owner`, `Admin`, `Member`), shared accounts status, and `Remove Member` / `Leave Family` actions.
3. **Tab 3: Pending Invitations:**
   * Send Invitation Form: Invitee Email input + Role selector (`Admin` vs `Member`) + `Send Invitation` button.
   * Sent invitations queue with `Revoke` action.
   * Received invitations queue with `Accept` and `Reject` buttons.
4. **Tab 4: Data Sharing & Privacy Settings:**
   * Granular toggle switches:
     * `Share Bank Account Balances` (ON/OFF)
     * `Share Monthly Income Totals` (ON/OFF)
     * `Share Expense Transactions` (ON/OFF)
     * `Share Investment Assets` (ON/OFF)
     * `Share Loan Liabilities` (ON/OFF)
   * Save Preferences Button (`"Update Sharing Permissions"`).

---

### Page 10: Category Management (`/categories` -> `Categories.tsx`)

#### Purpose
Configure system and custom transaction categories, color tags, and spending classifications.

#### Visual Structure
1. **Header:** Title `"Categories"`, subtitle `"Organize transactions into custom and system categories"`, Button `+ Create Category`.
2. **Default System Categories Section:**
   * Grid of locked system categories (`Salary`, `Food & Dining`, `Housing`, `Utilities`, `Transportation`, `Healthcare`, `Entertainment`, `Shopping`, `Investment`, `Loan/EMI`).
   * Displays category icon, color dot, type badge, and Lock icon.
3. **Custom User Categories Section:**
   * Grid of user-created categories with color swatches, transaction count badge, and `Delete` action with confirmation modal.
4. **Create Category Modal (`CreateCategoryModal.tsx`):**
   * Category Name input.
   * Category Type selector (`Expense`, `Income`, `Asset`, `Liability`).
   * Color Palette picker (10 curated hex presets).
   * Icon selector (Lucide financial icons).
   * Submit Button `"Create Category"`.

---

### Page 11: Transaction Search Engine (`/search` -> `Search.tsx`)

#### Purpose
Dedicated full-page fuzzy search interface for cross-account querying with highlighted terms and date-range bounds.

#### Visual Structure
* **Header:** Title `"Transaction Search"`, active filter count badge, `Clear Filters` button.
* **Search Controls Card:**
  * Omni-search input with instant debounced query execution and clear `X` button.
  * Secondary filter row: Category dropdown, From Date, To Date.
* **Results Area:**
  * Matching transaction count (`"Found 14 matching transactions"`).
  * Transaction rows with highlighted query matches, source badge (Manual vs Statement), and multi-currency conversion.

---

### Page 12: User Profile (`/profile` -> `Profile.tsx`)

#### Purpose
Manage personal credentials, avatar, default preferred currency, and security credentials.

#### Visual Structure
1. **Personal Information Card:**
   * Full Name input.
   * Avatar URL input (with live fallback initials avatar preview).
   * Default Preferred Currency dropdown (150+ ISO currencies).
   * Time Zone selector.
   * Action: `Save Profile Changes`.
2. **Change Password Card:**
   * Current Password, New Password (with complexity rules), Confirm Password.
   * Action: `Update Password`.
3. **Account Metadata Card:**
   * Email (read-only with verified checkmark), Account creation timestamp, Active Family memberships.

---

### Page 13: Settings & Preferences (`/settings` -> `Settings.tsx`)

#### Purpose
System preferences, theme switching, date format customization, notification toggles, and data export/deletion.

#### Visual Structure
1. **Application Preferences Card:**
   * Display Language dropdown (English, etc.).
   * Theme Selector: Radio group (`Light`, `Dark`, `System Default`).
   * Date Format: Radio group (`DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`).
   * Default Currency Selector.
   * Notification Toggles: Email summaries (ON/OFF), Push alerts (ON/OFF).
2. **Data Export & Danger Zone:**
   * `Export All Financial Data (JSON / CSV)` button.
   * `Delete Account & Purge Data` button (Destructive modal with required confirmation phrase).

---

### Page 14: 404 Not Found (`/404` -> `NotFound.tsx`)

#### Purpose
Clean, friendly error page when navigating to non-existent routes.

#### Visual Structure
* Centered card: Large Serif `404`, `"Page Not Found"`, `"The page you are looking for does not exist or has been moved."`
* Buttons: `Return to Dashboard` (Primary) + `Go to Home` (Outline).

---

## 6. Modal, Dialog & Overlay System

All dialogs in FinanceOS adhere to a standardized overlay design specification:

1. **Backdrop:** Fixed inset `0`, `z-50`, `bg-black/50 backdrop-blur-sm`, smooth `animate-in fade-in duration-200`.
2. **Container Card:** Max width `max-w-md` (confirmation dialogs) or `max-w-2xl` (data review dialogs), `rounded-xl border border-border bg-card shadow-2xl overflow-hidden`.
3. **Header:** Light stone header `bg-muted/20 border-b border-border p-5 flex items-center justify-between`. Title in `font-serif text-lg font-bold`.
4. **Body:** Scrollable `max-h-[80vh] overflow-y-auto p-5 space-y-4`.
5. **Footer:** Action bar `border-t border-border p-4 bg-muted/20 flex items-center justify-end gap-2.5`.
   * Standard ordering: `Cancel` (Outline) on the left, `Confirm / Save / Delete` (Primary or Destructive) on the right.

---

## 7. StitchMCP / AI Redesign Prompting Guidelines

When providing this document to **Stitch** or executing redesign workflows via **StitchMCP**, follow these guidelines:

### 7.1 Stitch Project Initialization
Use `StitchMCP:create_design_system_from_design_md` or `StitchMCP:create_project` with the following parameters:
* **Project Name:** `FinanceOS`
* **Theme Name:** `Calm Financial Intelligence`
* **Primary Font:** `Source Serif 4`
* **Body Font:** `DM Sans`
* **Mono Font:** `JetBrains Mono`
* **Primary Color:** `#176B52` (Pine Green)
* **Dark Primary Color:** `#32BA82` (Vivid Pine)
* **Background Light:** `#F7F7F4`
* **Background Dark:** `#0B0F17`

### 7.2 Generation Best Practices for Stitch
1. **Always Enforce Dual-Currency:** When generating financial cards, always include the primary formatted amount alongside the secondary approximation (e.g., `₹42,85,600` + `≈ $51,048 USD`).
2. **Dense Financial Tables:** In table generations, ensure tabular numeral alignment (`tabular-nums font-mono text-right`) for amounts, clear type pills, and full-bleed border dividers.
3. **Maintain High Visual Depth:** Use subtle linear gradient card fills (e.g. `bg-gradient-to-br from-card via-card to-secondary/30`), frosted glass top navigation (`backdrop-blur-xs`), and hairline borders (`border-border/80`).
4. **Mobile Responsive States:** Generate mobile drawer alternatives for complex modals and switch desktop tables to card-list layouts below 768px.

---
*End of Design Specification (`design.md`)*
