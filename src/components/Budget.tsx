import React, { useState, useEffect } from 'react';
import { Plus, Calculator, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Edit3, Trash2, X } from 'lucide-react';
import BudgetEditor from './BudgetEditor';
import { useFinanceData } from '../hooks/useFinanceData';
import { Budget as BudgetType, BudgetCategory } from '../types';

const Budget: React.FC = () => {
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
    totalIncome
  } = useFinanceData();

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

  // Calculate running totals for real-time feedback
  const totalBudget = parseFloat(budgetFormData.totalBudget) || 0;
  const categoryTotal = Object.values(budgetFormData.categories)
    .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
  const remainingBudget = totalBudget - categoryTotal;
  const isOverBudget = categoryTotal > totalBudget;

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
        setFeedbackMessage({ type: 'error', message: 'Category allocations exceed total budget' });
        return;
      }

      await createMonthlyBudget(budgetFormData.userId, `${selectedMonth}-01`, totalBudget, categoryBreakdown);
      
      // Success feedback
      const userName = users.find(u => u.id === budgetFormData.userId)?.name || 'User';
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
        {users.map((user) => {
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

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAllocateBudget(user.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      disabled={!mainAccount}
                    >
                      Allocate
                    </button>
                    <button
                      onClick={() => setEditingUser(user.id)}
                      className="px-3 py-2 text-gray-600 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const b = currentMonthBudgets.find((bud) => bud.userId === user.id);
                        if (b) handleDeleteBudget(b);
                      }}
                      className="px-3 py-2 text-gray-600 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                      title="Delete budget"
                    >
                      <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Monthly Budget</h2>
                <button
                  onClick={() => setShowBudgetForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateBudget} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User
                  </label>
                  <select
                    value={budgetFormData.userId}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select User</option>
                    {users.length > 0 ? (
                      users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No users found - Please add household members first</option>
                    )}
                  </select>
                  {users.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ No household members found. Please add users in the Household section first.
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Allocation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenseCategories.map(category => (
                    <div key={category}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {category}
                      </label>
                      <input
                        type="number"
                        value={budgetFormData.categories[category] || ''}
                        onChange={(e) => setBudgetFormData(prev => ({
                          ...prev,
                          categories: { ...prev.categories, [category]: e.target.value }
                        }))}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  isOverBudget 
                    ? 'bg-red-50 border-red-200' 
                    : remainingBudget === 0 && totalBudget > 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <h4 className="font-medium text-gray-900 mb-3">Budget Summary</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Budget:</span>
                      <span className="font-semibold">€{totalBudget.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Total Allocated:</span>
                      <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        €{categoryTotal.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span>Remaining:</span>
                      <span className={`font-bold ${
                        isOverBudget ? 'text-red-600' : remainingBudget === 0 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        €{remainingBudget.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {isOverBudget && (
                    <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                      ⚠️ <strong>Over Budget!</strong> You've allocated €{(categoryTotal - totalBudget).toLocaleString()} more than your budget allows.
                    </div>
                  )}
                  
                  {remainingBudget === 0 && totalBudget > 0 && !isOverBudget && (
                    <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
                      ✅ <strong>Perfect!</strong> You've allocated your entire budget.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Create Budget
                </button>
                <button
                  type="button"
                  onClick={() => setShowBudgetForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget vs Actual Comparison */}
      {currentMonthBudgets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget vs Actual Spending</h3>
          
          <div className="space-y-6">
            {users.map(user => {
              const budget = currentMonthBudgets.find(b => b.userId === user.id);
              if (!budget) return null;

              const userCategories = currentMonthCategories.filter(bc => 
                currentMonthBudgets.find(b => b.id === bc.budgetId && b.userId === user.id)
              );

              return (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    {user.name}'s Budget
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userCategories.map(category => {
                      const utilizationPercentage = category.allocatedAmount > 0 
                        ? (category.spentAmount / category.allocatedAmount) * 100 
                        : 0;
                      
                      return (
                        <div key={category.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">{category.category}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              utilizationPercentage <= 80 ? 'bg-green-100 text-green-800' :
                              utilizationPercentage <= 100 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {utilizationPercentage.toFixed(0)}%
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Budget:</span>
                              <span>€{category.allocatedAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Spent:</span>
                              <span>€{category.spentAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Remaining:</span>
                              <span className={category.allocatedAmount - category.spentAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                €{(category.allocatedAmount - category.spentAmount).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                utilizationPercentage <= 80 ? 'bg-green-500' :
                                utilizationPercentage <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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