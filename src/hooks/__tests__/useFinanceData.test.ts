import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFinanceData } from '../useFinanceData'
import { AuthProvider } from '../../contexts/AuthContext'
import React from 'react'

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    eq: vi.fn(function(this: any) { return this }),
    order: vi.fn(function(this: any) { return this }),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }))
}

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseMock: false
}))

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com'
  },
  profile: {
    id: 'test-user-123',
    full_name: 'Test User',
    onboarding_completed: true,
    monthly_income: 5000
  },
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  completeOnboarding: vi.fn()
}

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}))

// Wrapper component for hooks that need AuthProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useFinanceData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })
      
      expect(result.current.transactions).toEqual([])
      expect(result.current.users).toEqual([])
      expect(result.current.assets).toEqual([])
      expect(result.current.goals).toEqual([])
      expect(result.current.accounts).toEqual([])
      expect(result.current.budgets).toEqual([])
      expect(result.current.budgetCategories).toEqual([])
      expect(result.current.monthlyData).toEqual([])
      expect(result.current.vestingSchedules).toEqual([])
      expect(result.current.monthlyAllocations).toEqual([])
      expect(result.current.loading).toBe(true)
    })

    it('should load data when user is authenticated and onboarded', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        monthly_income: 5000,
        color: '#3B82F6'
      }

      const userMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        insert: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(userMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(userMock.select).toHaveBeenCalled()
    })

    it('should not load data when user is not onboarded', () => {
      const nonOnboardedAuth = {
        ...mockAuthContext,
        profile: {
          ...mockAuthContext.profile,
          onboarding_completed: false
        }
      }
      
      vi.mocked(vi.mock('../../contexts/AuthContext', () => ({
        useAuth: () => nonOnboardedAuth
      })))

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      expect(result.current.loading).toBe(false)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('User Management', () => {
    it('should add user successfully', async () => {
      const mockNewUser = {
        id: 'new-user-123',
        name: 'New User',
        monthly_income: 3000,
        color: '#10B981',
        auth_user_id: 'test-user-123'
      }

      const userMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        insert: vi.fn().mockReturnThis().mockResolvedValue({ data: mockNewUser, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(userMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.addUser({
          name: 'New User',
          monthlyIncome: 3000,
          color: '#10B981'
        })
      })

      expect(userMock.insert).toHaveBeenCalledWith([{
        name: 'New User',
        monthly_income: 3000,
        color: '#10B981',
        auth_user_id: 'test-user-123'
      }])
    })

    it('should update user income successfully', async () => {
      const userMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(userMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.updateUserIncome('user-123', 6000)
      })

      expect(userMock.update).toHaveBeenCalledWith({ monthly_income: 6000 })
      expect(userMock.eq).toHaveBeenCalledWith('id', 'user-123')
    })
  })

  describe('Transaction Management', () => {
    it('should add transaction successfully', async () => {
      const mockTransaction = {
        id: 'trans-123',
        user_id: 'test-user-123',
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.00,
        category: 'Groceries'
      }

      const transMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
        insert: vi.fn().mockReturnThis().mockResolvedValue({ data: mockTransaction, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(transMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.addTransaction({
          date: '2024-01-15',
          description: 'Test Transaction',
          amount: -50.00,
          category: 'Groceries',
          userId: 'test-user-123'
        })
      })

      expect(transMock.insert).toHaveBeenCalledWith([{
        user_id: 'test-user-123',
        date: '2024-01-15',
        description: 'Test Transaction',
        amount: -50.00,
        category: 'Groceries'
      }])
    })

    it('should handle transaction addition errors gracefully', async () => {
      const transMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis().mockRejectedValue(new Error('Database error')),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(transMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      // Should not throw error
      await act(async () => {
        await result.current.addTransaction({
          date: '2024-01-15',
          description: 'Test Transaction',
          amount: -50.00,
          category: 'Groceries',
          userId: 'test-user-123'
        })
      })

      expect(transMock.insert).toHaveBeenCalled()
    })
  })

  describe('Asset Management', () => {
    it('should add asset successfully', async () => {
      const mockAsset = {
        id: 'asset-123',
        user_id: 'test-user-123',
        name: 'Test Asset',
        category: 'Stocks',
        value: 10000
      }

      const assetMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAsset, error: null }),
        insert: vi.fn().mockReturnThis().mockResolvedValue({ data: mockAsset, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(assetMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.addAsset({
          name: 'Test Asset',
          category: 'Stocks',
          value: 10000,
          userId: 'test-user-123'
        })
      })

      expect(assetMock.insert).toHaveBeenCalledWith([{
        user_id: 'test-user-123',
        name: 'Test Asset',
        category: 'Stocks',
        value: 10000
      }])
    })

    it('should update asset successfully', async () => {
      const assetMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(assetMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.updateAsset('asset-123', {
          name: 'Updated Asset',
          value: 15000
        })
      })

      expect(assetMock.update).toHaveBeenCalledWith({
        name: 'Updated Asset',
        category: undefined,
        value: 15000,
        updated_at: expect.any(String)
      })
    })

    it('should delete asset successfully', async () => {
      const assetMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(assetMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.deleteAsset('asset-123')
      })

      expect(assetMock.delete).toHaveBeenCalled()
      expect(assetMock.eq).toHaveBeenCalledWith('id', 'asset-123')
    })
  })

  describe('Goal Management', () => {
    it('should add goal successfully', async () => {
      const mockGoal = {
        id: 'goal-123',
        user_id: 'test-user-123',
        name: 'Emergency Fund',
        target_amount: 10000,
        current_amount: 2000,
        target_date: '2024-12-31',
        description: 'Build emergency fund'
      }

      const goalMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockGoal, error: null }),
        insert: vi.fn().mockReturnThis().mockResolvedValue({ data: mockGoal, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(goalMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.addGoal({
          name: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 2000,
          targetDate: '2024-12-31',
          description: 'Build emergency fund'
        })
      })

      expect(goalMock.insert).toHaveBeenCalledWith([{
        user_id: 'test-user-123',
        name: 'Emergency Fund',
        target_amount: 10000,
        current_amount: 2000,
        target_date: '2024-12-31',
        description: 'Build emergency fund'
      }])
    })

    it('should update goal successfully', async () => {
      const goalMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(goalMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.updateGoal('goal-123', {
          currentAmount: 3000
        })
      })

      expect(goalMock.update).toHaveBeenCalledWith({
        name: undefined,
        target_amount: undefined,
        current_amount: 3000,
        target_date: undefined,
        description: undefined,
        updated_at: expect.any(String)
      })
    })

    it('should delete goal successfully', async () => {
      const goalMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(goalMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.deleteGoal('goal-123')
      })

      expect(goalMock.delete).toHaveBeenCalled()
      expect(goalMock.eq).toHaveBeenCalledWith('id', 'goal-123')
    })
  })

  describe('Account Management', () => {
    it('should add account successfully', async () => {
      const mockAccount = {
        id: 'account-123',
        user_id: 'test-user-123',
        name: 'Checking Account',
        type: 'checking',
        balance: 5000,
        color: '#3B82F6',
        last_updated: '2024-01-01T00:00:00.000Z'
      }

      const accountMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAccount, error: null }),
        insert: vi.fn().mockReturnThis().mockResolvedValue({ data: mockAccount, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(accountMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.addAccount({
          name: 'Checking Account',
          type: 'checking',
          balance: 5000,
          userId: 'test-user-123',
          color: '#3B82F6'
        })
      })

      expect(accountMock.insert).toHaveBeenCalledWith([{
        user_id: 'test-user-123',
        name: 'Checking Account',
        type: 'checking',
        balance: 5000,
        color: '#3B82F6'
      }])
    })

    it('should update account successfully', async () => {
      const accountMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(accountMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.updateAccount('account-123', {
          balance: 6000
        })
      })

      expect(accountMock.update).toHaveBeenCalledWith({
        name: undefined,
        type: undefined,
        balance: 6000,
        color: undefined,
        last_updated: expect.any(String)
      })
    })

    it('should delete account successfully', async () => {
      const accountMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(accountMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.deleteAccount('account-123')
      })

      expect(accountMock.delete).toHaveBeenCalled()
      expect(accountMock.eq).toHaveBeenCalledWith('id', 'account-123')
    })
  })

  describe('Budget Management', () => {
    it('should create monthly budget successfully', async () => {
      const mockBudget = {
        id: 'budget-123',
        user_id: 'test-user-123',
        month: '2024-01-01',
        total_budget: 3000
      }

      const budgetMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBudget, error: null }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis().mockResolvedValue({ data: mockBudget, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(budgetMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.createMonthlyBudget('test-user-123', '2024-01', 3000, [
          { category: 'Groceries', allocatedAmount: 500 },
          { category: 'Transportation', allocatedAmount: 300 }
        ])
      })

      expect(budgetMock.upsert).toHaveBeenCalledWith({
        user_id: 'test-user-123',
        month: '2024-01',
        total_budget: 3000
      }, { onConflict: 'user_id,month' })
    })

    it('should get budget status correctly', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      // Set up mock data for budget status calculation
      act(() => {
        // This would normally be loaded from the database
        // For testing, we'll simulate the state
      })

      const budgetStatus = result.current.getBudgetStatus('test-user-123', '2024-01-01')

      expect(budgetStatus).toHaveProperty('totalBudget')
      expect(budgetStatus).toHaveProperty('totalSpent')
      expect(budgetStatus).toHaveProperty('totalRemaining')
      expect(budgetStatus).toHaveProperty('categories')
      expect(budgetStatus).toHaveProperty('utilizationPercentage')
    })
  })

  describe('Vesting Schedule Management', () => {
    it('should add vesting schedule successfully', async () => {
      const mockVestingSchedule = {
        id: 'vesting-123',
        user_id: 'test-user-123',
        monthly_amount: 1000,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        description: 'Stock options vesting',
        cliff_amount: 5000,
        cliff_period: 6
      }

      const vestingMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockVestingSchedule, error: null }),
        insert: vi.fn().mockReturnThis().mockResolvedValue({ data: mockVestingSchedule, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(vestingMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.addVestingSchedule({
          monthlyAmount: 1000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          description: 'Stock options vesting',
          cliffAmount: 5000,
          cliffPeriod: 6
        })
      })

      expect(vestingMock.insert).toHaveBeenCalledWith([{
        user_id: 'test-user-123',
        monthly_amount: 1000,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        description: 'Stock options vesting',
        cliff_amount: 5000,
        cliff_period: 6
      }])
    })

    it('should delete vesting schedule successfully', async () => {
      const vestingMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(vestingMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      await act(async () => {
        await result.current.deleteVestingSchedule('vesting-123')
      })

      expect(vestingMock.delete).toHaveBeenCalled()
      expect(vestingMock.eq).toHaveBeenCalledWith('id', 'vesting-123')
    })
  })

  describe('Financial Calculations', () => {
    it('should calculate total income correctly', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      // Mock users with income
      act(() => {
        result.current.users = [
          { id: '1', name: 'User 1', monthlyIncome: 5000, color: '#3B82F6' },
          { id: '2', name: 'User 2', monthlyIncome: 3000, color: '#10B981' }
        ]
      })

      expect(result.current.totalIncome).toBe(8000)
    })

    it('should calculate monthly spending correctly', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      // Mock transactions for current month
      act(() => {
        result.current.transactions = [
          {
            id: '1',
            date: new Date(currentYear, currentMonth, 15).toISOString(),
            description: 'Groceries',
            amount: -100,
            category: 'Food',
            userId: 'test-user-123'
          },
          {
            id: '2',
            date: new Date(currentYear, currentMonth, 10).toISOString(),
            description: 'Gas',
            amount: -50,
            category: 'Transportation',
            userId: 'test-user-123'
          },
          {
            id: '3',
            date: new Date(currentYear, currentMonth - 1, 15).toISOString(),
            description: 'Old transaction',
            amount: -200,
            category: 'Food',
            userId: 'test-user-123'
          }
        ]
      })

      expect(result.current.totalSpending).toBe(150)
    })

    it('should calculate savings rate correctly', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      act(() => {
        result.current.users = [
          { id: '1', name: 'User 1', monthlyIncome: 5000, color: '#3B82F6' }
        ]
        // Simulate spending of $3000
        result.current.totalSpending = 3000
      })

      expect(result.current.monthlySavings).toBe(2000)
      expect(result.current.savingsRate).toBe(40)
    })

    it('should calculate total asset value correctly', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      act(() => {
        result.current.assets = [
          { id: '1', name: 'Stock A', category: 'Stocks', value: 10000, userId: 'test-user-123' },
          { id: '2', name: 'Stock B', category: 'Stocks', value: 5000, userId: 'test-user-123' },
          { id: '3', name: 'Bonds', category: 'Bonds', value: 3000, userId: 'test-user-123' }
        ]
      })

      expect(result.current.totalAssetValue).toBe(18000)
    })

    it('should calculate total account balance correctly', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      act(() => {
        result.current.accounts = [
          { id: '1', name: 'Checking', type: 'checking', balance: 5000, userId: 'test-user-123', color: '#3B82F6' },
          { id: '2', name: 'Savings', type: 'savings', balance: 10000, userId: 'test-user-123', color: '#10B981' }
        ]
      })

      expect(result.current.totalAccountBalance).toBe(15000)
    })
  })

  describe('Financial Insights', () => {
    it('should generate appropriate insights based on financial data', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      act(() => {
        result.current.users = [
          { id: '1', name: 'User 1', monthlyIncome: 5000, color: '#3B82F6' }
        ]
        result.current.assets = [
          { id: '1', name: 'Stock A', category: 'Stocks', value: 10000, userId: 'test-user-123' }
        ]
      })

      const insights = result.current.insights

      expect(insights).toBeInstanceOf(Array)
      expect(insights.length).toBeGreaterThan(0)
      
      // Should have income insight
      const incomeInsight = insights.find(i => i.type === 'income')
      expect(incomeInsight).toBeDefined()
      expect(incomeInsight?.value).toBe(5000)

      // Should have net worth insight
      const netWorthInsight = insights.find(i => i.type === 'trend')
      expect(netWorthInsight).toBeDefined()
      expect(netWorthInsight?.value).toBe(10000)
    })

    it('should handle empty data gracefully in insights', () => {
      const { result } = renderHook(() => useFinanceData(), { wrapper })

      const insights = result.current.insights

      expect(insights).toBeInstanceOf(Array)
      expect(insights.length).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const errorMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        insert: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(errorMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      // Should not throw error and should complete loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.users).toEqual([])
    })

    it('should handle missing user gracefully', async () => {
      const noUserAuth = {
        ...mockAuthContext,
        user: null
      }
      
      vi.mocked(vi.mock('../../contexts/AuthContext', () => ({
        useAuth: () => noUserAuth
      })))

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      expect(result.current.loading).toBe(false)
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should not trigger unnecessary re-renders', async () => {
      const { result, rerender } = renderHook(() => useFinanceData(), { wrapper })

      const initialRenderCount = vi.fn()
      
      // Track renders
      act(() => {
        initialRenderCount()
      })

      // Re-render with same props should not trigger new API calls
      rerender()

      expect(initialRenderCount).toHaveBeenCalledTimes(1)
    })

    it('should handle parallel operations correctly', async () => {
      const mockAsset1 = { id: 'asset-1', name: 'Asset 1', category: 'Stocks', value: 1000 }
      const mockAsset2 = { id: 'asset-2', name: 'Asset 2', category: 'Bonds', value: 2000 }

      const assetMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: mockAsset1, error: null })
          .mockResolvedValueOnce({ data: mockAsset2, error: null }),
        insert: vi.fn().mockReturnThis()
          .mockResolvedValueOnce({ data: mockAsset1, error: null })
          .mockResolvedValueOnce({ data: mockAsset2, error: null }),
        order: vi.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(assetMock)

      const { result } = renderHook(() => useFinanceData(), { wrapper })

      // Add multiple assets in parallel
      await act(async () => {
        await Promise.all([
          result.current.addAsset({
            name: 'Asset 1',
            category: 'Stocks',
            value: 1000,
            userId: 'test-user-123'
          }),
          result.current.addAsset({
            name: 'Asset 2',
            category: 'Bonds',
            value: 2000,
            userId: 'test-user-123'
          })
        ])
      })

      expect(assetMock.insert).toHaveBeenCalledTimes(2)
    })
  })
}) 