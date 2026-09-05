export const __types = true

export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  provider: 'local' | 'google'
  isEmailVerified: boolean
  country?: string
  preferredCurrency: string
  timeZone: string
  preferences: {
    language: string
    theme: 'light' | 'dark' | 'system'
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
    notifications: { email: boolean; push: boolean }
  }
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  statusCode?: number
}

export type TransactionType =
  | 'income'
  | 'expense'
  | 'asset'
  | 'liability'
  | 'Debit'
  | 'Credit'
  | 'Income'
  | 'Expense'
  | 'Asset'
  | 'Liability'

export type PaymentMethod =
  | 'cash'
  | 'upi'
  | 'debit_card'
  | 'credit_card'
  | 'bank_transfer'
  | 'net_banking'
  | 'cheque'
  | 'wallet'
  | 'other'

export interface Transaction {
  _id: string
  user: string
  statementId: string | null
  date: string
  amount: number
  type: TransactionType
  paymentMethod?: PaymentMethod
  merchant: string
  description: string
  category: string
  notes: string
  currency: string | null
  source: 'manual' | 'statement'
  isEdited: boolean
  editedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionInput {
  date: string
  amount: number
  type: TransactionType
  merchant?: string
  category: string
  paymentMethod?: PaymentMethod
  description?: string
  notes?: string
  currency?: string
}

export interface Statement {
  _id: string
  user: string
  originalFileName: string
  fileType: 'PDF' | 'CSV' | 'XLSX'
  fileSize: number
  status: 'Uploaded' | 'Processing' | 'Completed' | 'Failed' | 'Password Required'
  transactionCount: number
  currency: string | null
  uploadedAt: string
  processedAt?: string | null
  failureReason?: string | null
}

export interface DashboardOverview {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  netWorth: {
    totalAssets: number
    totalLiabilities: number
    netWorth: number
  }
  activeLoans: number
  monthlyEmi: number
  recentTransactions: {
    _id: string
    date: string
    amount: number
    currency?: string
    type: TransactionType
    paymentMethod?: PaymentMethod
    merchant: string
    category: string
    source?: string
  }[]
  topSpendingCategories: { _id: string; total: number }[]
}

export interface SpendingAnalysis {
  byCategory: { _id: string; total: number; count: number }[]
  categoryComparison: {
    category: string
    currentAmount: number
    previousAmount: number
    change: number
    changePercent: number
  }[]
  monthlyTrend: { year: number; month: number; total: number }[]
  incomeVsExpense: { income: number; expenses: number; savings: number }
  topMerchants: { _id: string; count: number; total: number }[]
  highestExpenses: { date: string; amount: number; merchant: string; category: string }[]
  highestIncome: { date: string; amount: number; merchant: string; category: string }[]
}

export interface MonthlyComparison {
  currentMonth: {
    label: string
    income: number
    expenses: number
    savings: number
  }
  previousMonth: {
    label: string
    income: number
    expenses: number
    savings: number
  }
  comparison: {
    incomeDiff: number
    incomeChangePercent: number
    expenseDiff: number
    expenseChangePercent: number
    savingsDiff: number
    savingsChangePercent: number
  }
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

export type CategoryType =
  | 'income'
  | 'expense'
  | 'asset'
  | 'liability'
  | 'Expense'
  | 'Income'
  | 'Asset'
  | 'Liability'

export interface Category {
  _id: string
  user: string
  name: string
  type: CategoryType
  color?: string
  icon?: string
  description?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryInput {
  name: string
  type?: CategoryType
  color?: string
  icon?: string
  description?: string
}

export interface UpdateCategoryInput {
  name?: string
  type?: CategoryType
  color?: string
  icon?: string
  description?: string
}
