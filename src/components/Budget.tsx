import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Calculator, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Edit3, Trash2, X } from 'lucide-react';
import BudgetEditor from './BudgetEditor';
import { useFinanceData } from '../hooks/useFinanceData';
import { useAuth } from '../contexts/AuthContext';
import { Budget as BudgetType, BudgetCategory } from '../types';
import SecureStorage from '../utils/secureStorage';

const Budget: React.FC = () => {
  const { user, profile } = useAuth();
  const { 
    users, 
    accounts, 
    budgets, 
    budgetCategories, 
    transactions,
    createMonthlyBudget,
    deleteBudget,
    assignMainAccount,
    allocateMonthlyBudget,
    getBudgetStatus,
    totalIncome,
    loading
  } = useFinanceData();

  // Create a fallback user list that includes the current authenticated user
  const availableUsers = users.length > 0 ? users : (
    user && profile ? [{
      id: user.id,
      name: profile.full_name || user.email || 'Current User',
      monthlyIncome: profile.monthly_income || 0,
      color: '#3B82F6'
    }] : []
  );

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetType | null>(null);
  const [budgetFormData, setBudgetFormData] = useState({
    userId: '',
    totalBudget: '',
    categories: {} as Record<string, string>
  });

  // Feedback states
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Calculate running totals for real-time feedback
  const totalBudget = useMemo(() => {
    const rawValue = budgetFormData.totalBudget?.trim() || '';
    if (rawValue === '') return 0;
    const parsed = parseFloat(rawValue);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }, [budgetFormData.totalBudget]);

  const categoryTotal = useMemo(() => {
    return Object.values(budgetFormData.categories || {})
      .reduce((sum, amount) => {
        if (!amount || typeof amount !== 'string') return sum;
        const rawValue = amount.trim();
        if (rawValue === '') return sum;
        const parsed = parseFloat(rawValue);
        return sum + (isNaN(parsed) ? 0 : Math.max(0, parsed));
      }, 0);
  }, [budgetFormData.categories]);

  const remainingBudget = totalBudget - categoryTotal;
  const isOverBudget = categoryTotal > totalBudget && totalBudget > 0;

  // Historical expense analysis for auto-suggestions
  const expenseSuggestions = useMemo(() => {
    if (!transactions || transactions.length === 0) return {};
    
    // Get last 3 months of expenses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentExpenses = transactions.filter((t: any) => 
      t.amount < 0 && new Date(t.date) >= threeMonthsAgo
    );
    
    // Group by category and calculate average monthly spending
    const categorySpending = recentExpenses.reduce((acc: any, transaction: any) => {
      const category = transaction.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(Math.abs(transaction.amount));
      return acc;
    }, {});
    
    // Calculate average monthly spending per category
    const suggestions: any = {};
    Object.entries(categorySpending).forEach(([category, amounts]: [string, any]) => {
      const total = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
      const monthlyAverage = total / 3; // 3 months of data
      suggestions[category] = Math.round(monthlyAverage);
    });
    
    return suggestions;
  }, [transactions]);

  // Auto-suggest budget allocation
  const applySuggestions = () => {
    if (!totalBudget || totalBudget <= 0) return;
    
    const totalSuggested = Object.values(expenseSuggestions).reduce((sum: number, amount: any) => sum + amount, 0);
    
    if (totalSuggested <= 0) return;
    
    // Scale suggestions to fit within total budget
    const scaleFactor = Math.min(1, (totalBudget * 0.9) / totalSuggested); // Leave 10% buffer
    
    const scaledSuggestions: any = {};
    Object.entries(expenseSuggestions).forEach(([category, amount]: [string, any]) => {
      scaledSuggestions[category] = Math.round(amount * scaleFactor).toString();
    });
    
    setBudgetFormData(prev => ({
      ...prev,
      categories: { ...prev.categories, ...scaledSuggestions }
    }));
    
    setShowSuggestions(false);
  };

  // Save draft functionality
  const saveDraft = async () => {
    setIsDraftSaving(true);
    try {
      const draftKey = `budget_draft_${budgetFormData.userId}_${selectedMonth}`;
      const success = SecureStorage.setItem(draftKey, {
        ...budgetFormData,
        savedAt: new Date().toISOString(),
        isDraft: true
      }, {
        encrypt: true,
        expiry: 7 * 24 * 60 * 60 * 1000, // 7 days
        allowSensitive: false
      });
      
      if (success) {
        setFeedbackMessage({ 
          type: 'success', 
          message: 'Budget draft saved securely! You can continue editing later.' 
        });
      } else {
        setFeedbackMessage({ 
          type: 'error', 
          message: 'Failed to save draft. Storage may be full or data contains sensitive information.' 
        });
      }
      
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (error) {
      setFeedbackMessage({ 
        type: 'error', 
        message: 'Failed to save draft. Please try again.' 
      });
    } finally {
      setIsDraftSaving(false);
    }
  };

  // Load draft on form open
  useEffect(() => {
    if (showBudgetForm && budgetFormData.userId) {
      const draftKey = `budget_draft_${budgetFormData.userId}_${selectedMonth}`;
      const savedDraft = SecureStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          setBudgetFormData(prev => ({
            ...prev,
            totalBudget: savedDraft.totalBudget || '',
            categories: savedDraft.categories || {}
          }));
          
          const draftAge = Date.now() - new Date(savedDraft.savedAt).getTime();
          const hoursOld = Math.floor(draftAge / (1000 * 60 * 60));
          
          setFeedbackMessage({
            type: 'success',
            message: `Draft loaded! Saved ${hoursOld > 0 ? `${hoursOld} hours` : 'recently'} ago.`
          });
          
          setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (error) {
          console.error('Error loading draft:', error);
          SecureStorage.removeItem(draftKey); // Clean up corrupted draft
        }
      }
    }
  }, [showBudgetForm, budgetFormData.userId, selectedMonth]);

  const expenseCategories = [
    'Groceries', 'Dining', 'Transportation', 'Utilities', 'Housing', 
    'Healthcare', 'Entertainment', 'Shopping', 'Bills', 'Insurance', 'Other'
  ];

  const currentMonthBudgets = budgets.filter(b => b.month.startsWith(selectedMonth));
  const currentMonthCategories = budgetCategories.filter(bc => 
    currentMonthBudgets.some(b => b.id === bc.budgetId)
  );

  // Handle Esc key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showBudgetForm) {
          setShowBudgetForm(false);
        }
      }
    };

    if (showBudgetForm) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showBudgetForm]);

  // Auto-dismiss feedback messages
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const totalBudget = parseFloat(budgetFormData.totalBudget);
      if (isNaN(totalBudget) || totalBudget <= 0) {
        setFeedbackMessage({ type: 'error', message: 'Please enter a valid budget amount' });
        return;
      }

      const categoryBreakdown = Object.entries(budgetFormData.categories)
        .filter(([_, amount]) => amount && parseFloat(amount) > 0)
        .map(([category, amount]) => ({
          category,
          allocatedAmount: parseFloat(amount)
        }));

      const totalCategoryAmount = categoryBreakdown.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
      
      if (totalCategoryAmount > totalBudget) {
        setFeedbackMessage({ type: 'error', message: `Category allocations (€${totalCategoryAmount.toLocaleString()}) exceed total budget (€${totalBudget.toLocaleString()})` });
        return;
      }

      await createMonthlyBudget(budgetFormData.userId, `${selectedMonth}-01`, totalBudget, categoryBreakdown);
      
      // Clear the draft
      const draftKey = `budget_draft_${budgetFormData.userId}_${selectedMonth}`;
      SecureStorage.removeItem(draftKey);
      
      // Success feedback
      const userName = availableUsers.find(u => u.id === budgetFormData.userId)?.name || 'User';
      setFeedbackMessage({ 
        type: 'success', 
        message: `Budget successfully created for ${userName} with €${totalBudget.toLocaleString()} total budget` 
      });
      
      setBudgetFormData({ userId: '', totalBudget: '', categories: {} });
      setShowBudgetForm(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      setFeedbackMessage({ 
        type: 'error', 
        message: 'Failed to create budget. Please try again or contact support if the issue persists.' 
      });
    }
  };

  const handleAssignMainAccount = async (userId: string, accountId: string) => {
    await assignMainAccount(userId, accountId);
  };

  const handleAllocateBudget = async (userId: string) => {
    const userBudget = currentMonthBudgets.find(b => b.userId === userId);
    if (userBudget) {
      await allocateMonthlyBudget(userId, userBudget.totalBudget);
    }
  };

  const handleDeleteBudget = (budget: BudgetType) => {
    setBudgetToDelete(budget);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await deleteBudget(budgetToDelete.id);
      setShowDeleteConfirm(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setBudgetToDelete(null);
  };

  const getBudgetUtilization = (userId: string) => {
    const budget = currentMonthBudgets.find(b => b.userId === userId);
    if (!budget) return { percentage: 0, spent: 0, remaining: 0 };

    const userCategories = currentMonthCategories.filter(bc => 
      currentMonthBudgets.find(b => b.id === bc.budgetId && b.userId === userId)
    );
    
    const totalSpent = userCategories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const percentage = budget.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;
    const remaining = budget.totalBudget - totalSpent;

    return { percentage, spent: totalSpent, remaining };
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage <= 50) return 'text-green-600 bg-green-100';
    if (percentage <= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Feedback Messages */}
      {feedbackMessage && (
        <div className={`p-4 rounded-lg border-l-4 ${
          feedbackMessage.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">{feedbackMessage.message}</span>
            </div>
            <button 
              onClick={() => setFeedbackMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BudgetEditor
            budgetId={currentMonthBudgets.find(b => b.userId === editingUser)?.id || ''}
            onClose={() => setEditingUser(null)}
          />
        </div>
      )}

      {showDeleteConfirm && budgetToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Budget</h2>
            </div>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this budget?</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
              <p className="font-medium text-gray-900">{budgetToDelete.month}</p>
              <p className="text-sm text-gray-600">€{budgetToDelete.totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-800 text-sm font-medium">⚠️ This action cannot be undone!</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCancelDelete} className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Budget</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h2>
          <p className="text-gray-600">
            Create and manage monthly budgets for household members
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - 6 + i);
              const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableUsers.map((user) => {
          const budget = currentMonthBudgets.find(b => b.userId === user.id);
          const utilization = getBudgetUtilization(user.id);
          const mainAccount = accounts.find(a => a.userId === user.id && a.type === 'main');
          
          return (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">
                      {budget ? 'Budget Set' : 'No Budget'}
                    </p>
                  </div>
                </div>
                {budget && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getUtilizationColor(utilization.percentage)}`}>
                    {utilization.percentage.toFixed(0)}%
                  </div>
                )}
              </div>

              {budget ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Budget</span>
                    <span className="font-semibold">€{budget.totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Spent</span>
                    <span className="font-semibold text-red-600">€{utilization.spent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className={`font-semibold ${utilization.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{utilization.remaining.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        utilization.percentage <= 50 ? 'bg-green-500' :
                        utilization.percentage <= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(utilization.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setEditingUser(user.id)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 bg-blue-50 text-sm rounded-lg hover:bg-blue-100 hover:border-blue-400 min-h-[44px] touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      aria-label={`Edit budget for ${user.name}`}
                      title="Edit budget categories and amounts"
                    >
                      <Edit3 className="h-5 w-5" />
                      <span className="font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        const b = currentMonthBudgets.find((bud) => bud.userId === user.id);
                        if (b && confirm(`Are you sure you want to delete the budget for ${user.name}? This action cannot be undone.`)) {
                          handleDeleteBudget(b);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 bg-red-50 text-sm rounded-lg hover:bg-red-100 hover:border-red-400 min-h-[44px] touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      aria-label={`Delete budget for ${user.name}`}
                      title="Delete this budget permanently"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No budget set for this month</p>
                  <button
                    onClick={() => {
                      setBudgetFormData(prev => ({ ...prev, userId: user.id }));
                      setShowBudgetForm(true);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Create Budget
                  </button>
                </div>
              )}

              {/* Main Account Assignment */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Main Account
                </label>
                <select
                  value={mainAccount?.id || ''}
                  onChange={(e) => handleAssignMainAccount(user.id, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {accounts.filter(a => a.userId === user.id).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} (€{account.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Creation Form */}
      {showBudgetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 lg:p-4">
          <div className="bg-white rounded-xl lg:max-w-2xl w-full max-h-[90vh] lg:max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">Create Monthly Budget</h2>
                <button
                  onClick={() => setShowBudgetForm(false)}
                  className="text-gray-400 active:text-gray-600 lg:hover:text-gray-600 p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateBudget} className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              {/* Feedback Messages */}
              {feedbackMessage && (
                <div className={`p-3 rounded-lg border ${
                  feedbackMessage.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {feedbackMessage.message}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User
                  </label>
                  <select
                    value={budgetFormData.userId}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm min-h-[44px]"
                    required
                  >
                    <option value="">Select User</option>
                    {availableUsers.length > 0 ? (
                      availableUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>Loading users...</option>
                    )}
                  </select>
                  {!loading && availableUsers.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ No household members found. Please complete your profile setup first.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Monthly Budget (€)
                  </label>
                  <input
                    type="number"
                    value={budgetFormData.totalBudget}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, totalBudget: e.target.value }))}
                    placeholder="2000"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm min-h-[44px]"
                    required
                  />
                </div>
              </div>

              {/* Sticky Budget Summary */}
              {totalBudget > 0 && (
                <div className={`sticky top-0 z-10 p-4 rounded-lg border-2 shadow-lg ${
                  isOverBudget 
                    ? 'bg-red-50 border-red-200' 
                    : remainingBudget === 0 && totalBudget > 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Budget Summary</h4>
                    <div className="flex items-center gap-2">
                      {Object.keys(expenseSuggestions).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(!showSuggestions)}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          💡 Smart Suggestions
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={saveDraft}
                        disabled={isDraftSaving}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        {isDraftSaving ? 'Saving...' : '💾 Save Draft'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-lg">€{totalBudget.toLocaleString()}</div>
                      <div className="text-gray-600">Total Budget</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold text-lg ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        €{categoryTotal.toLocaleString()}
                      </div>
                      <div className="text-gray-600">Allocated</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${
                        isOverBudget ? 'text-red-600' : remainingBudget === 0 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        €{remainingBudget.toLocaleString()}
                      </div>
                      <div className="text-gray-600">Remaining</div>
                    </div>
                  </div>
                  
                  {isOverBudget && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
                      ⚠️ <strong>Over Budget!</strong> Reduce allocations by €{(categoryTotal - totalBudget).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Smart Suggestions Panel */}
              {showSuggestions && Object.keys(expenseSuggestions).length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-purple-900">💡 Based on your last 3 months</h4>
                    <button
                      type="button"
                      onClick={applySuggestions}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      Apply Suggestions
                    </button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    {Object.entries(expenseSuggestions).slice(0, 8).map(([category, amount]: [string, any]) => (
                      <div key={category} className="flex justify-between p-2 bg-white rounded">
                        <span className="text-gray-700">{category}</span>
                        <span className="font-medium">€{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Allocation</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {expenseCategories.map(category => {
                    const suggestion = expenseSuggestions[category];
                    const currentValue = budgetFormData.categories[category] || '';
                    const isOverSuggestion = suggestion && parseFloat(currentValue) > suggestion * 1.5;
                    
                    return (
                      <div key={category} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {category}
                          </label>
                          {suggestion && (
                            <button
                              type="button"
                              onClick={() => setBudgetFormData(prev => ({
                                ...prev,
                                categories: { ...prev.categories, [category]: suggestion.toString() }
                              }))}
                              className="text-xs text-purple-600 hover:text-purple-800"
                              title={`Your avg: €${suggestion}`}
                            >
                              💡 €{suggestion}
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          value={currentValue}
                          onChange={(e) => setBudgetFormData(prev => ({
                            ...prev,
                            categories: { ...prev.categories, [category]: e.target.value }
                          }))}
                          placeholder={suggestion ? `${suggestion}` : '0'}
                          min="0"
                          step="0.01"
                          className={`w-full px-3 py-3 lg:py-2 border rounded-lg focus:outline-none focus:ring-2 text-base lg:text-sm min-h-[44px] ${
                            isOverSuggestion 
                              ? 'border-yellow-300 focus:ring-yellow-500 bg-yellow-50' 
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {isOverSuggestion && (
                          <p className="text-xs text-yellow-600 mt-1">
                            ⚠️ 50% higher than your average (€{suggestion})
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isOverBudget}
                  className={`flex-1 px-4 py-3 lg:py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors min-h-[44px] touch-manipulation font-medium ${
                    isOverBudget
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white active:bg-blue-700 lg:hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isOverBudget ? 'Fix Allocations First' : 'Create Budget'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="px-4 py-3 lg:py-2 text-gray-700 border border-gray-300 rounded-lg active:bg-gray-50 lg:hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px] touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Budget Management Tips</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Set Realistic Budgets:</strong> Base your budget on historical spending patterns</p>
          <p>• <strong>Assign Main Accounts:</strong> Link each person to their primary spending account for easy tracking</p>
          <p>• <strong>Regular Reviews:</strong> Check budget performance weekly and adjust as needed</p>
          <p>• <strong>Category Allocation:</strong> Distribute your budget across different expense categories for better control</p>
          <p>• <strong>Emergency Buffer:</strong> Keep 10-15% of your budget unallocated for unexpected expenses</p>
        </div>
      </div>
    </div>
  );
};

export default Budget;