import { useState, useCallback, useMemo, useEffect } from 'react';
import { Transaction, User, Asset, Goal, FinancialInsight, Account, Budget, BudgetCategory } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useFinanceData = () => {
  const { user, profile } = useAuth();
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

  // Initialize data when user is available
  useEffect(() => {
    if (user && profile?.onboarding_completed) {
      initializeData();
    } else {
      setLoading(false);
    }
  }, [user, profile?.onboarding_completed]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Load all user data in parallel
      await Promise.all([
        loadUsers(),
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
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!user) return;

    try {
      // Check if user record exists in users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error loading user:', userError);
        return;
      }

      if (existingUser) {
        setUsers([{
          id: existingUser.id,
          name: existingUser.name,
          monthlyIncome: existingUser.monthly_income,
          color: existingUser.color
        }]);
      } else if (profile) {
        // Create user record if it doesn't exist
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            name: profile.full_name,
            monthly_income: profile.monthly_income,
            color: '#3B82F6',
            auth_user_id: user.id,
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user record:', insertError);
          return;
        }

        if (newUser) {
          setUsers([{
            id: newUser.id,
            name: newUser.name,
            monthlyIncome: newUser.monthly_income,
            color: newUser.color
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      if (data) {
        setTransactions(data.map((t: any) => ({
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
    }
  };

  const loadAssets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading assets:', error);
        return;
      }

      if (data) {
        setAssets(data.map((a: any) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          value: a.value,
          userId: a.user_id
        })));
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading goals:', error);
        return;
      }

      if (data) {
        setGoals(data.map((g: any) => ({
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
    }
  };

  const loadAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        return;
      }

      if (data) {
        setAccounts(data.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type as Account['type'],
          balance: a.balance,
          userId: a.user_id,
          color: a.color,
          lastUpdated: a.last_updated
        })));
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadBudgets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading budgets:', error);
        return;
      }

      if (data) {
        setBudgets(data.map((b: any) => ({
          id: b.id,
          userId: b.user_id,
          month: b.month,
          totalBudget: b.total_budget,
          createdAt: b.created_at,
          updatedAt: b.updated_at
        })));
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadBudgetCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select(`
          *,
          budgets!inner(user_id)
        `)
        .eq('budgets.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading budget categories:', error);
        return;
      }

      if (data) {
        setBudgetCategories(data.map((bc: any) => ({
          id: bc.id,
          budgetId: bc.budget_id,
          category: bc.category,
          allocatedAmount: bc.allocated_amount,
          spentAmount: bc.spent_amount,
          createdAt: bc.created_at,
          updatedAt: bc.updated_at
        })));
      }
    } catch (error) {
      console.error('Error loading budget categories:', error);
    }
  };

  const loadMonthlyData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: true });

      if (error) {
        console.error('Error loading monthly data:', error);
        return;
      }

      if (data) {
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const loadVestingSchedules = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vesting_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vesting schedules:', error);
        return;
      }

      if (data) {
        setVestingSchedules(data.map((v: any) => ({
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
    }
  };

  const loadMonthlyAllocations = async () => {
    if (!user) return;
    
    // Note: This table doesn't exist in Supabase yet, so we'll keep it empty
    // TODO: Create monthly_allocations table when needed
    setMonthlyAllocations([]);
  };

  const updateUserIncome = useCallback(async (userId: string, income: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ monthly_income: income })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user income:', error);
    }
  }, [user]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      let newTransaction: Transaction;
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
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

      setTransactions(prev => [newTransaction, ...prev]);
      await updateMonthlySummary();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  }, [user]);

  const addUser = useCallback(async (newUser: Omit<User, 'id'>) => {
    if (!user) return;

    const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: newUser.name,
          monthly_income: newUser.monthlyIncome,
          color: colors[users.length % colors.length],
          auth_user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [...prev, {
        id: data.id,
        name: data.name,
        monthlyIncome: data.monthly_income,
        color: data.color
      }]);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  }, [user, users.length]);

  const addAsset = useCallback(async (asset: Omit<Asset, 'id'>) => {
    if (!user) return;

    try {
      let newAsset: Asset;
      
      const { data, error } = await supabase
        .from('assets')
        .insert([{
          user_id: user.id,
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

      setAssets(prev => [newAsset, ...prev]);
      await updateMonthlySummary();

      console.log('Asset added successfully:', newAsset);
    } catch (error) {
      console.error('Error adding asset:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    if (!user) return;

    try {
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

      // Update local state
      setAssets(prev => prev.map(asset => 
        asset.id === id ? { ...asset, ...updates } : asset
      ));

      // Reload data to ensure consistency
      await loadAssets();
      await updateMonthlySummary();

      console.log('Asset updated successfully:', id);
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const deleteAsset = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAssets(prev => prev.filter(asset => asset.id !== id));

      // Update monthly summary since assets changed
      await updateMonthlySummary();

      console.log('Asset deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id'>) => {
    if (!user) return;

    try {
      let newGoal: Goal;
      
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id: user.id,
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

      setGoals(prev => [newGoal, ...prev]);

      console.log('Goal added successfully:', newGoal);
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    if (!user) return;

    try {
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

      // Update local state
      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...updates } : goal
      ));

      // Reload data to ensure consistency
      await loadGoals();

      console.log('Goal updated successfully:', id);
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setGoals(prev => prev.filter(goal => goal.id !== id));

      console.log('Goal deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const addAccount = useCallback(async (account: Omit<Account, 'id'>) => {
    if (!user) return;

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          user_id: user.id,
          name: account.name,
          type: account.type,
          balance: account.balance,
          color: colors[accounts.length % colors.length],
        }])
        .select()
        .single();

      if (error) throw error;

      const newAccount = {
        id: data.id,
        name: data.name,
        type: data.type as Account['type'],
        balance: data.balance,
        userId: data.user_id,
        color: data.color,
        lastUpdated: data.last_updated
      };

      setAccounts(prev => [...prev, newAccount]);

      console.log('Account added successfully:', newAccount);
    } catch (error) {
      console.error('Error adding account:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user, accounts.length]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: updates.name,
          type: updates.type,
          balance: updates.balance,
          color: updates.color,
          last_updated: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAccounts(prev => prev.map(account => 
        account.id === id ? { 
          ...account, 
          ...updates,
          lastUpdated: new Date().toISOString()
        } : account
      ));

      // Reload data to ensure consistency
      await loadAccounts();

      console.log('Account updated successfully:', id);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAccounts(prev => prev.filter(account => account.id !== id));

      console.log('Account deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error; // Re-throw so UI can handle the error
    }
  }, [user]);

  const allocateToAccount = useCallback(async (accountId: string, amount: number, description?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .update({ balance: `balance + ${amount}` })
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error allocating to account:', error);
    }
  }, [user]);

  const addVestingSchedule = useCallback(async (schedule: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vesting_schedules')
        .insert([{
          user_id: user.id,
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
    }
  }, [user]);

  const deleteVestingSchedule = useCallback(async (scheduleId: string) => {
    if (!user) return;

    try {
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
    }
  }, [user]);

  const addMonthlyAllocation = useCallback(async (allocation: any) => {
    if (!user) return;
    
    // TODO: Add Supabase table for monthly_allocations when ready
    // For now, still use localStorage even with Supabase configured
    const updatedAllocations = [...monthlyAllocations, allocation];
    setMonthlyAllocations(updatedAllocations);
    localStorage.setItem('financeApp_monthlyAllocations', JSON.stringify(updatedAllocations));
  }, [user, monthlyAllocations]);

  const createMonthlyBudget = useCallback(async (userId: string, month: string, totalAmount: number, categoryBreakdown: { category: string; allocatedAmount: number }[]) => {
    if (!user) return;

    const monthKey = month;

    try {
      // Create budget in Supabase
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
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
  }, [user]);

  const assignMainAccount = useCallback(async (userId: string, accountId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          // TODO: Add main_account_id column to users table if needed
          // For now, this function is not fully implemented
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Reload users data after update
      await loadUsers();
    } catch (error) {
      console.error('Error assigning main account:', error);
    }
  }, [user]);

  const allocateMonthlyBudget = useCallback(async (userId: string, amount: number) => {
    if (!user) return;

    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        console.error('User not found:', userId);
        return;
      }

      // Find user's main checking account or first checking account
      const mainAccount = accounts.find(acc => 
        acc.userId === userId && acc.type === 'checking'
      );
      
      if (!mainAccount) {
        console.error('No checking account found for user');
        return;
      }

      await allocateToAccount(mainAccount.id, amount, 'Monthly budget allocation');
    } catch (error) {
      console.error('Error allocating monthly budget:', error);
    }
  }, [user, users, accounts, allocateToAccount]);

  const getBudgetStatus = useCallback((userId: string, month?: string) => {
    if (!user) return {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      categories: [],
      utilizationPercentage: 0
    };

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
  }, [user, budgets, budgetCategories]);

  const updateMonthlySummary = useCallback(async () => {
    if (!user) return;
    
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
        user_id: user.id,
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
  }, [user, transactions, users, assets]);

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
    deleteGoal,
    addAccount,
    updateAccount,
    deleteAccount,
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