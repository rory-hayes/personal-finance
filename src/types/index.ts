export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  userId?: string;
  userName?: string;
  rejected?: boolean;
}

export interface User {
  id: string;
  name: string;
  monthlyIncome: number;
  color: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  value: number;
  userId?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
  status?: 'on-track' | 'behind' | 'ahead';
  requiredMonthlySavings?: number;
}

export interface Account {
  id: string;
  name: string;
  type: 'main' | 'savings' | 'investment' | 'retirement' | 'shares' | 'other';
  balance: number;
  userId?: string;
  color: string;
  lastUpdated: string;
}

export interface VestingSchedule {
  id: string;
  userId: string;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  description?: string;
  cliffAmount?: number;
  cliffPeriod?: number; // 6 or 12 months
}

export interface AccountAllocation {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FinancialInsight {
  type: 'spending' | 'income' | 'savings' | 'goal' | 'trend';
  title: string;
  description: string;
  value?: number;
  change?: number;
  isPositive?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  createdAt: string;
  updatedAt: string;
}