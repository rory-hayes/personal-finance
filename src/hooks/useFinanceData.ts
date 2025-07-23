import { useState, useCallback, useMemo, useEffect } from 'react';
import { Transaction, User, Asset, Goal, FinancialInsight, Account, Budget, BudgetCategory } from '../types';
import { supabase, isSupabaseMock } from '../lib/supabase';

export const useFinanceData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [vestingSchedules, setVestingSchedules] = useState<any[]>([]);
  const [monthlyAllocations, setMonthlyAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  // Initialize default user if none exists
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is properly configured
      if (isSupabaseMock) {
        console.warn('Supabase not configured, using local storage fallback');
        setIsSupabaseReady(false);
        initializeLocalData();
        return;
      }

      try {
        // Check if we have any users
        const { data: existingUsers, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });

        if (usersError) {
          throw usersError;
        }

        if (!existingUsers || existingUsers.length === 0) {
          // Create default user
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{ name: 'You', monthly_income: 0, color: '#3B82F6' }])
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          if (newUser) {
            setUsers([{
              id: newUser.id,
              name: newUser.name,
              monthlyIncome: newUser.monthly_income,
              color: newUser.color
            }]);
          }
          setIsSupabaseReady(true);
        } else {
          setUsers(existingUsers.map(user => ({
            id: user.id,
            name: user.name,
            monthlyIncome: user.monthly_income,
            color: user.color
          })));
          setIsSupabaseReady(true);
        }

        // Load all data
        await Promise.all([
          loadTransactions(),
          loadAssets(),
          loadGoals(),
          loadAccounts(),
          loadBudgets(),
          loadBudgetCategories(),
          loadMonthlyData(),
          loadVestingSchedules(),
          loadMonthlyAllocations()
        ]);
      } catch (supabaseError) {
        console.warn('Supabase connection failed, falling back to local storage:', supabaseError);
        setIsSupabaseReady(false);
        initializeLocalData();
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      setIsSupabaseReady(false);
      initializeLocalData();
    } finally {
      setLoading(false);
    }
  };

  const initializeLocalData = () => {
    // Initialize with default user for local development
    const defaultUser: User = {
      id: 'local-user-1',
      name: 'You',
      monthlyIncome: 0,
      color: '#3B82F6'
    };
    setUsers([defaultUser]);
    setIsSupabaseReady(false);
    setLoading(false);
  };

  const loadTransactions = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedTransactions = localStorage.getItem('financeApp_transactions');
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setTransactions(data.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category,
          userId: t.user_id
        })));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Use local storage fallback
      const savedTransactions = localStorage.getItem('financeApp_transactions');
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    }
  };

  const loadAssets = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedAssets = localStorage.getItem('financeApp_assets');
        if (savedAssets) {
          setAssets(JSON.parse(savedAssets));
        }
        return;
      }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setAssets(data.map(a => ({
          id: a.id,
          name: a.name,
          category: a.category,
          value: a.value,
          userId: a.user_id
        })));
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      // Use local storage fallback
      const savedAssets = localStorage.getItem('financeApp_assets');
      if (savedAssets) {
        setAssets(JSON.parse(savedAssets));
      }
    }
  };

  const loadGoals = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedGoals = localStorage.getItem('financeApp_goals');
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals));
        }
        return;
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setGoals(data.map(g => ({
          id: g.id,
          name: g.name,
          targetAmount: g.target_amount,
          currentAmount: g.current_amount,
          targetDate: g.target_date,
          description: g.description || undefined
        })));
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      // Use local storage fallback
      const savedGoals = localStorage.getItem('financeApp_goals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    }
  };

  const loadAccounts = async () => {
    // For now, use local state since we don't have accounts table in Supabase
    // In a real implementation, you'd create an accounts table
    const savedAccounts = localStorage.getItem('financeApp_accounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  };

  const loadBudgets = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedBudgets = localStorage.getItem('financeApp_budgets');
        if (savedBudgets) {
          setBudgets(JSON.parse(savedBudgets));
        }
        return;
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setBudgets(data.map(b => ({
          id: b.id,
          userId: b.user_id,
          month: b.month,
          totalBudget: b.total_budget
        })));
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      // Use local storage fallback
      const savedBudgets = localStorage.getItem('financeApp_budgets');
      if (savedBudgets) {
        setBudgets(JSON.parse(savedBudgets));
      }
    }
  };

  const loadBudgetCategories = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedBudgetCategories = localStorage.getItem('financeApp_budgetCategories');
        if (savedBudgetCategories) {
          setBudgetCategories(JSON.parse(savedBudgetCategories));
        }
        return;
      }

      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setBudgetCategories(data.map(bc => ({
          id: bc.id,
          budgetId: bc.budget_id,
          category: bc.category,
          allocatedAmount: bc.allocated_amount,
          spentAmount: bc.spent_amount
        })));
      }
    } catch (error) {
      console.error('Error loading budget categories:', error);
      // Use local storage fallback
      const savedBudgetCategories = localStorage.getItem('financeApp_budgetCategories');
      if (savedBudgetCategories) {
        setBudgetCategories(JSON.parse(savedBudgetCategories));
      }
    }
  };

  const loadMonthlyData = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedMonthlyData = localStorage.getItem('financeApp_monthlyData');
        if (savedMonthlyData) {
          setMonthlyData(JSON.parse(savedMonthlyData));
        }
        return;
      }

      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('*')
        .order('month', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
      // Use local storage fallback
      const savedMonthlyData = localStorage.getItem('financeApp_monthlyData');
      if (savedMonthlyData) {
        setMonthlyData(JSON.parse(savedMonthlyData));
      }
    }
  };

  const loadVestingSchedules = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedVestingSchedules = localStorage.getItem('financeApp_vestingSchedules');
        if (savedVestingSchedules) {
          setVestingSchedules(JSON.parse(savedVestingSchedules));
        }
        return;
      }
      
      const { data, error } = await supabase
        .from('vesting_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setVestingSchedules(data.map(v => ({
          id: v.id,
          userId: v.user_id,
          monthlyAmount: v.monthly_amount,
          startDate: v.start_date,
          endDate: v.end_date,
          description: v.description,
          cliffAmount: v.cliff_amount,
          cliffPeriod: v.cliff_period
        })));
      }
    } catch (error) {
      console.error('Error loading vesting schedules:', error);
      // Fallback to localStorage
      const savedVestingSchedules = localStorage.getItem('financeApp_vestingSchedules');
      if (savedVestingSchedules) {
        setVestingSchedules(JSON.parse(savedVestingSchedules));
      }
    }
  };

  const loadMonthlyAllocations = async () => {
    try {
      if (isSupabaseMock) {
        // Use local storage fallback
        const savedMonthlyAllocations = localStorage.getItem('financeApp_monthlyAllocations');
        if (savedMonthlyAllocations) {
          setMonthlyAllocations(JSON.parse(savedMonthlyAllocations));
        }
        return;
      }
      
      // TODO: Add Supabase table for monthly_allocations when ready
      // For now, still use localStorage even with Supabase configured
      const savedMonthlyAllocations = localStorage.getItem('financeApp_monthlyAllocations');
      if (savedMonthlyAllocations) {
        setMonthlyAllocations(JSON.parse(savedMonthlyAllocations));
      }
    } catch (error) {
      console.error('Error loading monthly allocations:', error);
      // Fallback to localStorage
      const savedMonthlyAllocations = localStorage.getItem('financeApp_monthlyAllocations');
      if (savedMonthlyAllocations) {
        setMonthlyAllocations(JSON.parse(savedMonthlyAllocations));
      }
    }
  };

  const updateUserIncome = useCallback(async (userId: string, income: number) => {
    try {
      if (isSupabaseReady) {
        const { error } = await supabase
          .from('users')
          .update({ monthly_income: income })
          .eq('id', userId);

        if (error) throw error;
      } else {
        // Use local storage fallback
        const updatedUsers = users.map(user => 
          user.id === userId ? { ...user, monthlyIncome: income } : user
        );
        localStorage.setItem('financeApp_users', JSON.stringify(updatedUsers));
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, monthlyIncome: income } : user
      ));
    } catch (error) {
      console.error('Error updating user income:', error);
    }
  }, [isSupabaseReady, users]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      let newTransaction: Transaction;
      
      if (isSupabaseReady) {
        const { data, error } = await supabase
          .from('transactions')
          .insert([{
            user_id: transaction.userId || users[0]?.id,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            category: transaction.category
          }])
          .select()
          .single();

        if (error) throw error;

        newTransaction = {
          id: data.id,
          date: data.date,
          description: data.description,
          amount: data.amount,
          category: data.category,
          userId: data.user_id
        };
      } else {
        // Use local storage fallback
        newTransaction = {
          id: `transaction-${Date.now()}-${Math.random()}`,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          userId: transaction.userId || users[0]?.id
        };
        
        const updatedTransactions = [newTransaction, ...transactions];
        localStorage.setItem('financeApp_transactions', JSON.stringify(updatedTransactions));
      }

      setTransactions(prev => [newTransaction, ...prev]);
      if (isSupabaseReady) {
        await updateMonthlySummary();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  }, [users, transactions, isSupabaseReady]);

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    try {
      const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      let newUser: User;
      
      if (isSupabaseReady) {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            name: user.name,
            monthly_income: user.monthlyIncome,
            color: colors[users.length % colors.length]
          }])
          .select()
          .single();

        if (error) throw error;

        newUser = {
          id: data.id,
          name: data.name,
          monthlyIncome: data.monthly_income,
          color: data.color
        };
      } else {
        // Use local storage fallback
        newUser = {
          id: `local-user-${Date.now()}`,
          name: user.name,
          monthlyIncome: user.monthlyIncome,
          color: colors[users.length % colors.length]
        };
        
        const updatedUsers = [...users, newUser];
        localStorage.setItem('financeApp_users', JSON.stringify(updatedUsers));
      }

      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  }, [users.length, users, isSupabaseReady]);

  const addAsset = useCallback(async (asset: Omit<Asset, 'id'>) => {
    try {
      let newAsset: Asset;
      
      if (isSupabaseReady) {
        const { data, error } = await supabase
          .from('assets')
          .insert([{
            user_id: asset.userId || users[0]?.id,
            name: asset.name,
            category: asset.category,
            value: asset.value
          }])
          .select()
          .single();

        if (error) throw error;

        newAsset = {
          id: data.id,
          name: data.name,
          category: data.category,
          value: data.value,
          userId: data.user_id
        };
      } else {
        // Use local storage fallback
        newAsset = {
          id: `asset-${Date.now()}-${Math.random()}`,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          userId: asset.userId || users[0]?.id
        };
        
        const updatedAssets = [newAsset, ...assets];
        localStorage.setItem('financeApp_assets', JSON.stringify(updatedAssets));
      }

      setAssets(prev => [newAsset, ...prev]);
      if (isSupabaseReady) {
        await updateMonthlySummary();
      }
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  }, [users, assets, isSupabaseReady]);

  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    try {
      if (isSupabaseReady) {
        const { error } = await supabase
          .from('assets')
          .update({
            name: updates.name,
            category: updates.category,
            value: updates.value,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Use local storage fallback
        const updatedAssets = assets.map(asset => 
          asset.id === id ? { ...asset, ...updates } : asset
        );
        localStorage.setItem('financeApp_assets', JSON.stringify(updatedAssets));
      }

      setAssets(prev => prev.map(asset => 
        asset.id === id ? { ...asset, ...updates } : asset
      ));
      if (isSupabaseReady) {
        await updateMonthlySummary();
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  }, [assets, isSupabaseReady]);

  const deleteAsset = useCallback(async (id: string) => {
    try {
      if (isSupabaseReady) {
        const { error } = await supabase
          .from('assets')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        // Use local storage fallback
        const updatedAssets = assets.filter(asset => asset.id !== id);
        localStorage.setItem('financeApp_assets', JSON.stringify(updatedAssets));
      }

      setAssets(prev => prev.filter(asset => asset.id !== id));
      if (isSupabaseReady) {
        await updateMonthlySummary();
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  }, [assets, isSupabaseReady]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id'>) => {
    try {
      let newGoal: Goal;
      
      if (isSupabaseReady) {
        const { data, error } = await supabase
          .from('goals')
          .insert([{
            user_id: users[0]?.id,
            name: goal.name,
            target_amount: goal.targetAmount,
            current_amount: goal.currentAmount,
            target_date: goal.targetDate,
            description: goal.description
          }])
          .select()
          .single();

        if (error) throw error;

        newGoal = {
          id: data.id,
          name: data.name,
          targetAmount: data.target_amount,
          currentAmount: data.current_amount,
          targetDate: data.target_date,
          description: data.description || undefined
        };
      } else {
        // Use local storage fallback
        newGoal = {
          id: `goal-${Date.now()}-${Math.random()}`,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: goal.targetDate,
          description: goal.description
        };
        
        const updatedGoals = [newGoal, ...goals];
        localStorage.setItem('financeApp_goals', JSON.stringify(updatedGoals));
      }

      setGoals(prev => [newGoal, ...prev]);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  }, [users, goals, isSupabaseReady]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    try {
      if (isSupabaseReady) {
        const { error } = await supabase
          .from('goals')
          .update({
            name: updates.name,
            target_amount: updates.targetAmount,
            current_amount: updates.currentAmount,
            target_date: updates.targetDate,
            description: updates.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Use local storage fallback
        const updatedGoals = goals.map(goal => 
          goal.id === id ? { ...goal, ...updates } : goal
        );
        localStorage.setItem('financeApp_goals', JSON.stringify(updatedGoals));
      }

      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...updates } : goal
      ));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  }, [goals, isSupabaseReady]);

  const addAccount = useCallback(async (account: Omit<Account, 'id'>) => {
    try {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
      const newAccount: Account = {
        ...account,
        id: `account-${Date.now()}`,
        color: colors[accounts.length % colors.length],
      };

      const updatedAccounts = [...accounts, newAccount];
      setAccounts(updatedAccounts);
      localStorage.setItem('financeApp_accounts', JSON.stringify(updatedAccounts));
    } catch (error) {
      console.error('Error adding account:', error);
    }
  }, [accounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    try {
      const updatedAccounts = accounts.map(account => 
        account.id === id ? { ...account, ...updates, lastUpdated: new Date().toISOString() } : account
      );
      setAccounts(updatedAccounts);
      localStorage.setItem('financeApp_accounts', JSON.stringify(updatedAccounts));
    } catch (error) {
      console.error('Error updating account:', error);
    }
  }, [accounts]);

  const allocateToAccount = useCallback(async (accountId: string, amount: number, description?: string) => {
    try {
      const updatedAccounts = accounts.map(account => 
        account.id === accountId 
          ? { ...account, balance: account.balance + amount, lastUpdated: new Date().toISOString() }
          : account
      );
      setAccounts(updatedAccounts);
      localStorage.setItem('financeApp_accounts', JSON.stringify(updatedAccounts));
    } catch (error) {
      console.error('Error allocating to account:', error);
    }
  }, [accounts]);

  const addVestingSchedule = useCallback(async (schedule: any) => {
    try {
      if (!isSupabaseReady) {
        // Use local storage fallback
        const newSchedule = {
          ...schedule,
          id: `vesting-${Date.now()}`,
        };
        const updatedSchedules = [...vestingSchedules, newSchedule];
        setVestingSchedules(updatedSchedules);
        localStorage.setItem('financeApp_vestingSchedules', JSON.stringify(updatedSchedules));
        return;
      }

      const { data, error } = await supabase
        .from('vesting_schedules')
        .insert([{
          user_id: schedule.userId,
          monthly_amount: schedule.monthlyAmount,
          start_date: schedule.startDate,
          end_date: schedule.endDate,
          description: schedule.description,
          cliff_amount: schedule.cliffAmount || null,
          cliff_period: schedule.cliffPeriod || null
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newSchedule = {
          id: data.id,
          userId: data.user_id,
          monthlyAmount: data.monthly_amount,
          startDate: data.start_date,
          endDate: data.end_date,
          description: data.description,
          cliffAmount: data.cliff_amount,
          cliffPeriod: data.cliff_period
        };
        setVestingSchedules(prev => [newSchedule, ...prev]);
        
        // Force a complete refresh to ensure all components update
        setTimeout(() => {
          loadVestingSchedules();
        }, 100);
      }

    } catch (error) {
      console.error('Error adding vesting schedule:', error);
      // Fallback to localStorage
      const newSchedule = {
        ...schedule,
        id: `vesting-${Date.now()}`,
      };
      const updatedSchedules = [...vestingSchedules, newSchedule];
      setVestingSchedules(updatedSchedules);
      localStorage.setItem('financeApp_vestingSchedules', JSON.stringify(updatedSchedules));
    }
  }, [vestingSchedules]);

  const deleteVestingSchedule = useCallback(async (scheduleId: string) => {
    try {
      if (!isSupabaseReady) {
        // Use local storage fallback
        const updatedSchedules = vestingSchedules.filter(schedule => schedule.id !== scheduleId);
        setVestingSchedules(updatedSchedules);
        localStorage.setItem('financeApp_vestingSchedules', JSON.stringify(updatedSchedules));
        return;
      }

      const { error } = await supabase
        .from('vesting_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        throw error;
      }

      setVestingSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    } catch (error) {
      console.error('Error deleting vesting schedule:', error);
      // Fallback to localStorage
      const updatedSchedules = vestingSchedules.filter(schedule => schedule.id !== scheduleId);
      setVestingSchedules(updatedSchedules);
      localStorage.setItem('financeApp_vestingSchedules', JSON.stringify(updatedSchedules));
    }
  }, [vestingSchedules, isSupabaseReady]);

  const addMonthlyAllocation = useCallback(async (allocation: any) => {
    try {
      if (!isSupabaseReady) {
        // Use local storage fallback
        const updatedAllocations = [...monthlyAllocations, allocation];
        setMonthlyAllocations(updatedAllocations);
        localStorage.setItem('financeApp_monthlyAllocations', JSON.stringify(updatedAllocations));
        return;
      }
      
      // TODO: Add Supabase table for monthly_allocations when ready
      // For now, still use localStorage even with Supabase configured
      const updatedAllocations = [...monthlyAllocations, allocation];
      setMonthlyAllocations(updatedAllocations);
      localStorage.setItem('financeApp_monthlyAllocations', JSON.stringify(updatedAllocations));
    } catch (error) {
      console.error('Error adding monthly allocation:', error);
      // Fallback to localStorage
      const updatedAllocations = [...monthlyAllocations, allocation];
      setMonthlyAllocations(updatedAllocations);
      localStorage.setItem('financeApp_monthlyAllocations', JSON.stringify(updatedAllocations));
    }
  }, [monthlyAllocations]);

  const createMonthlyBudget = useCallback(async (userId: string, month: string, totalAmount: number, categoryBreakdown: { category: string; allocatedAmount: number }[]) => {
    try {
      const monthKey = month;

      if (!isSupabaseReady) {
        // Use local storage fallback
        const newBudget: Budget = {
          id: `budget-${Date.now()}`,
          userId,
          month: monthKey,
          totalBudget: totalAmount
        };

        const updatedBudgets = [...budgets.filter(b => !(b.userId === userId && b.month === monthKey)), newBudget];
        setBudgets(updatedBudgets);
        localStorage.setItem('financeApp_budgets', JSON.stringify(updatedBudgets));

        // Create budget categories
        const newCategories = categoryBreakdown.map(cat => ({
          id: `category-${Date.now()}-${cat.category}`,
          budgetId: newBudget.id,
          category: cat.category,
          allocatedAmount: cat.allocatedAmount,
          spentAmount: 0
        }));

        const updatedCategories = [...budgetCategories.filter(bc => bc.budgetId !== newBudget.id), ...newCategories];
        setBudgetCategories(updatedCategories);
        localStorage.setItem('financeApp_budgetCategories', JSON.stringify(updatedCategories));
        return;
      }

      // Create budget in Supabase
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .upsert({
          user_id: userId,
          month: monthKey,
          total_budget: totalAmount
        }, {
          onConflict: 'user_id,month'
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Create budget categories
      const categoryInserts = categoryBreakdown.map(cat => ({
        budget_id: budgetData.id,
        category: cat.category,
        allocated_amount: cat.allocatedAmount,
        spent_amount: 0
      }));

      const { error: categoriesError } = await supabase
        .from('budget_categories')
        .upsert(categoryInserts, {
          onConflict: 'budget_id,category'
        });

      if (categoriesError) throw categoriesError;

      await loadBudgets();
      await loadBudgetCategories();
    } catch (error) {
      console.error('Error creating monthly budget:', error);
    }
  }, [budgets, budgetCategories]);

  const assignMainAccount = useCallback(async (userId: string, accountId: string) => {
    try {
      if (!isSupabaseReady) {
        // Use local storage fallback
        const updatedUsers = users.map(user => 
          user.id === userId ? { ...user, mainAccountId: accountId } : user
        );
        setUsers(updatedUsers);
        localStorage.setItem('financeApp_users', JSON.stringify(updatedUsers));
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ main_account_id: accountId })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, mainAccountId: accountId } : user
      ));
    } catch (error) {
      console.error('Error assigning main account:', error);
    }
  }, [users]);

  const allocateMonthlyBudget = useCallback(async (userId: string, amount: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user || !user.mainAccountId) {
        throw new Error('User or main account not found');
      }

      await allocateToAccount(user.mainAccountId, amount, `Monthly budget allocation for ${user.name}`);
    } catch (error) {
      console.error('Error allocating monthly budget:', error);
    }
  }, [users, allocateToAccount]);

  const getBudgetStatus = useCallback((userId: string, month?: string) => {
    const currentMonth = month || new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
    
    const userBudget = budgets.find(b => b.userId === userId && b.month === currentMonth);
    if (!userBudget) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        categories: [],
        utilizationPercentage: 0
      };
    }

    const categories = budgetCategories.filter(bc => bc.budgetId === userBudget.id);
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const totalRemaining = userBudget.totalBudget - totalSpent;
    const utilizationPercentage = userBudget.totalBudget > 0 ? (totalSpent / userBudget.totalBudget) * 100 : 0;

    return {
      totalBudget: userBudget.totalBudget,
      totalSpent,
      totalRemaining,
      categories: categories.map(cat => ({
        ...cat,
        remainingAmount: cat.allocatedAmount - cat.spentAmount,
        utilizationPercentage: cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0
      })),
      utilizationPercentage
    };
  }, [budgets, budgetCategories]);

  const updateMonthlySummary = useCallback(async () => {
    try {
      if (!isSupabaseReady) {
        // Skip Supabase operations if not ready
        return;
      }
      
      const currentMonth = new Date();
      currentMonth.setDate(1); // First day of current month
      const monthKey = currentMonth.toISOString().split('T')[0];

      const currentMonthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth.getMonth() && 
               transactionDate.getFullYear() === currentMonth.getFullYear();
      });

      const totalIncome = users.reduce((sum, user) => sum + user.monthlyIncome, 0);
      const totalSpending = currentMonthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalSavings = totalIncome - totalSpending;
      const netWorth = assets.reduce((sum, asset) => sum + asset.value, 0);

      const { error } = await supabase
        .from('monthly_summaries')
        .upsert({
          user_id: users[0]?.id,
          month: monthKey,
          total_income: totalIncome,
          total_spending: totalSpending,
          total_savings: totalSavings,
          net_worth: netWorth
        }, {
          onConflict: 'user_id,month'
        });

      if (error) throw error;
      await loadMonthlyData();
    } catch (error) {
      console.error('Error updating monthly summary:', error);
    }
  }, [transactions, users, assets, isSupabaseReady]);

  // Financial calculations
  const totalIncome = useMemo(() => 
    users.reduce((sum, user) => sum + user.monthlyIncome, 0), [users]
  );

  const totalSpending = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear && 
               t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const totalAssetValue = useMemo(() => 
    assets.reduce((sum, asset) => sum + asset.value, 0), [assets]
  );

  const totalAccountBalance = useMemo(() => 
    accounts.reduce((sum, account) => sum + account.balance, 0), [accounts]
  );

  const monthlySavings = totalIncome - totalSpending;
  const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;

  const insights = useMemo((): FinancialInsight[] => {
    const insights: FinancialInsight[] = [];

    if (totalIncome > 0) {
      insights.push({
        type: 'income',
        title: 'Monthly Income',
        description: `Total household income across ${users.length} member${users.length === 1 ? '' : 's'}`,
        value: totalIncome,
      });
    }

    if (totalSpending > 0) {
      insights.push({
        type: 'spending',
        title: 'Monthly Spending',
        description: 'Current month spending across all categories',
        value: totalSpending,
      });
    }

    if (monthlySavings !== 0) {
      insights.push({
        type: 'savings',
        title: 'Monthly Savings',
        description: `Saving ${savingsRate.toFixed(1)}% of income`,
        value: monthlySavings,
        isPositive: monthlySavings > 0,
      });
    }

    if (assets.length > 0) {
      insights.push({
        type: 'trend',
        title: 'Net Worth',
        description: `Total value across ${assets.length} asset${assets.length === 1 ? '' : 's'}`,
        value: totalAssetValue,
        isPositive: true,
      });
    }

    return insights;
  }, [totalIncome, totalSpending, monthlySavings, savingsRate, assets.length, totalAssetValue, users.length]);

  return {
    transactions,
    users,
    assets,
    goals,
    accounts,
    budgets,
    budgetCategories,
    monthlyData,
    vestingSchedules,
    monthlyAllocations,
    loading,
    addTransaction,
    addUser,
    updateUserIncome,
    addAsset,
    updateAsset,
    deleteAsset,
    addGoal,
    updateGoal,
    addAccount,
    updateAccount,
    allocateToAccount,
    addVestingSchedule,
    deleteVestingSchedule,
    addMonthlyAllocation,
    createMonthlyBudget,
    assignMainAccount,
    allocateMonthlyBudget,
    getBudgetStatus,
    totalIncome,
    totalSpending,
    totalAssetValue,
    totalAccountBalance,
    monthlySavings,
    savingsRate,
    insights,
  };
};