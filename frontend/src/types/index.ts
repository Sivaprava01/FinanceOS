/**
 * Global Type Definitions
 * Central location for all TypeScript types and interfaces used across the application.
 */

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'local' | 'google';
  isEmailVerified: boolean;
  country?: string;
  preferredCurrency: string;
  timeZone: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
  };
}

// ─── API ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  statusCode?: number;
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Theme ──────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

// ─── Auth Context ──────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// ─── Common ─────────────────────────────────────────────────────────────────

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Transaction ────────────────────────────────────────────────────────────

export interface Transaction {
  _id: string;
  user: string;
  statementId?: string | null;
  date: string;
  originalDate: string | null;
  amount: number;
  originalAmount: number | null;
  type: 'Debit' | 'Credit';
  originalType?: string | null;
  merchant: string;
  originalMerchant: string | null;
  description: string;
  originalDescription: string | null;
  category: string;
  notes: string;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalTransactions: number;
    totalDebit: number;
    totalCredit: number;
    netFlow: number;
  };
  byType: {
    Debit: number;
    Credit: number;
  };
  byCategory: Record<string, number>;
  topMerchants: Array<{
    merchant: string;
    total: number;
  }>;
}

export interface MerchantMapping {
  _id: string;
  extractedName: string;
  correctedName: string;
  count: number;
  isActive: boolean;
}

// ─── Statement ──────────────────────────────────────────────────────────────

export interface Statement {
  _id: string;
  user: string;
  originalFileName: string;
  filePath: string;
  fileType: 'PDF' | 'CSV' | 'XLSX';
  fileSize: number;
  status: 'Uploaded' | 'Processing' | 'Completed' | 'Failed';
  failureReason: string | null;
  transactionCount: number;
  uploadedAt: string;
  processedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadStatementResponse {
  _id: string;
  originalFileName: string;
  fileType: 'PDF' | 'CSV' | 'XLSX';
  fileSize: number;
  status: 'Uploaded' | 'Processing' | 'Completed' | 'Failed';
  transactionCount: number;
  uploadedAt: string;
  filePath: string;
}

export interface ImportHistoryResponse {
  statements: Statement[];
  limit: number;
  skip: number;
}

export interface ExtractedTransaction {
  date: string;
  amount: number;
  type: 'Debit' | 'Credit';
  merchant: string;
  description: string;
  category: string;
  originalDate: string;
  originalAmount: number;
  originalMerchant: string;
  originalDescription: string;
  notes?: string;
}

export interface ExtractTransactionsResponse {
  statementId: string;
  transactionCount: number;
  transactions: ExtractedTransaction[];
  nextStep: string;
}

export interface TransactionsForReviewResponse {
  statementId: string;
  status: 'ready_for_review' | 'processing' | 'completed' | 'failed';
  originalFileName: string;
  fileType: 'PDF' | 'CSV' | 'XLSX';
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface RecentTransaction {
  _id: string;
  date: string;
  amount: number;
  type: 'Debit' | 'Credit';
  merchant: string;
  category: string;
}

export interface TopSpendingCategory {
  _id: string;
  total: number;
  count: number;
}

export interface NetWorth {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface DashboardOverview {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  netWorth: NetWorth;
  activeLoans: number;
  monthlyEmi: number;
  recentTransactions: RecentTransaction[];
  topSpendingCategories: TopSpendingCategory[];
}

export interface CategoryBreakdown {
  _id: string;
  total: number;
  count: number;
}

export interface CategoryComparison {
  category: string;
  currentAmount: number;
  previousAmount: number;
  change: number;
  changePercent: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  total: number;
}

export interface IncomeVsExpense {
  income: number;
  expenses: number;
  savings: number;
}

export interface TopMerchant {
  _id: string;
  count: number;
  total: number;
}

export interface HighestTransaction {
  date: string;
  amount: number;
  merchant: string;
  category: string;
}

export interface SpendingAnalysis {
  byCategory: CategoryBreakdown[];
  categoryComparison: CategoryComparison[];
  monthlyTrend: MonthlyTrend[];
  incomeVsExpense: IncomeVsExpense;
  topMerchants: TopMerchant[];
  highestExpenses: HighestTransaction[];
  highestIncome: HighestTransaction[];
}

export interface MonthInfo {
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface MonthlyComparison {
  currentMonth: MonthInfo;
  previousMonth: MonthInfo;
  comparison: {
    incomeDiff: number;
    incomeChangePercent: number;
    expenseDiff: number;
    expenseChangePercent: number;
    savingsDiff: number;
    savingsChangePercent: number;
  };
}

export interface HealthScoreBreakdown {
  savingsRate: {
    score: number;
    maxScore: number;
    value: string;
  };
  debtRatio: {
    score: number;
    maxScore: number;
    value: string;
  };
  spendingHabits: {
    score: number;
    maxScore: number;
    value: string;
  };
  incomeStability: {
    score: number;
    maxScore: number;
    value: string;
  };
}

export interface HealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: HealthScoreBreakdown;
}

export interface Insight {
  type: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'success';
}

export interface Insights {
  insights: Insight[];
  generatedAt: string;
  count: number;
}
