import React, { useState } from 'react';
import { Plus, Target, Calendar, Euro, TrendingUp, Edit3, Trash2 } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useFormValidation, commonValidationRules } from '../hooks/useFormValidation';
import { showToast } from '../utils/toast';
import { Goal } from '../types';
import { 
  getTodayDateString, 
  getMonthsUntilDate, 
  getDaysDifference, 
  formatDisplayDate,
  getRelativeDateString 
} from '../utils/dateUtils';

const Goals: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, totalIncome, monthlySavings } = useFinanceData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: '',
  });

  // Confirmation modal state  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  // Standardized validation
  const {
    validateForm,
    clearFieldError,
    getFieldProps,
    setShowValidation,
    clearAllErrors
  } = useFormValidation({
    name: commonValidationRules.name,
    targetAmount: commonValidationRules.positiveNumber,
    currentAmount: {
      ...commonValidationRules.optionalPositiveNumber,
      custom: (value: string) => {
        if (!value.trim()) return null;
        const current = parseFloat(value);
        const target = parseFloat(formData.targetAmount);
        if (isNaN(current)) return 'Please enter a valid current amount';
        if (current < 0) return 'Current amount cannot be negative. Please enter your actual saved amount.';
        if (!isNaN(target) && current > target) {
          return 'Current amount cannot exceed your target amount. Please adjust one of these values.';
        }
        if (current > 1000000) return 'Current amount seems unusually large. Please verify this value.';
        return null;
      }
    },
    targetDate: commonValidationRules.futureDate
  });

  // Listen for custom event from Dashboard
  React.useEffect(() => {
    const handleOpenGoalForm = () => {
      setShowAddForm(true);
    };

    window.addEventListener('openGoalForm', handleOpenGoalForm);
    return () => window.removeEventListener('openGoalForm', handleOpenGoalForm);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm(formData)) {
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    const currentAmount = parseFloat(formData.currentAmount || '0');

    const goalData = {
      name: formData.name.trim(),
      targetAmount: targetAmount,
      currentAmount: currentAmount,
      targetDate: formData.targetDate,
      description: formData.description.trim() || undefined,
    };

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData);
        setEditingGoal(null);
      } else {
        await addGoal(goalData);
      }

      setFormData({
        name: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        description: '',
      });
      setShowAddForm(false);
      clearAllErrors();
    } catch (error) {
      console.error('Error saving goal:', error);
      showToast.error('Failed to save goal. Please try again.');
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    clearFieldError(fieldName);
  };

  const handleEdit = (goal: Goal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate,
      description: goal.description || '',
    });
    setEditingGoal(goal);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      description: '',
    });
    setEditingGoal(null);
    setShowAddForm(false);
  };

  // Delete confirmation handlers
  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      await deleteGoal(goalToDelete.id);
      console.log('✅ Goal deleted successfully');
      setShowDeleteConfirm(false);
      setGoalToDelete(null);
    } catch (error) {
      console.error('❌ Failed to delete goal:', error);
      showToast.error('Failed to delete goal. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setGoalToDelete(null);
  };

  const calculateMonthlyTarget = (goal: Goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsLeft = getMonthsUntilDate(goal.targetDate);
    return monthsLeft > 0 ? remaining / monthsLeft : remaining;
  };

  const getGoalStatus = (goal: Goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const monthsLeft = getMonthsUntilDate(goal.targetDate);
    const daysLeft = getDaysDifference(getTodayDateString(), goal.targetDate);
    const monthlyTarget = calculateMonthlyTarget(goal);
    
    if (progress >= 100) {
      return { status: 'completed', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (daysLeft <= 0) {
      return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (monthlyTarget > monthlySavings * 1.2) {
      return { status: 'challenging', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'on-track', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Savings Goals</h2>
          <p className="text-gray-600">
            Set and track your financial goals to stay motivated
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </button>
      </div>

      {/* Goals Overview */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Goals</p>
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
          </div>
          
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Target</p>
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                €{goals.reduce((sum, goal) => sum + goal.targetAmount, 0).toLocaleString()}
              </p>
            </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {goals.length > 0 ? 
                (goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount), 0) / goals.length * 100).toFixed(1) 
                : 0
              }%
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., Emergency Fund, House Down Payment"
                  required
                  {...getFieldProps('name')}
                />
                {getFieldProps('name').error && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    ⚠️ {getFieldProps('name').error}
                  </p>
                )}
              </div>
              
                            <div>
                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount (€) <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  id="targetAmount"
                  value={formData.targetAmount}
                  onChange={(e) => handleFieldChange('targetAmount', e.target.value)}
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  required
                  {...getFieldProps('targetAmount')}
                />
                {getFieldProps('targetAmount').error && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    ⚠️ {getFieldProps('targetAmount').error}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Amount (€)
                </label>
                <input
                  type="number"
                  id="currentAmount"
                  name="currentAmount"
                  value={formData.currentAmount}
                  onChange={(e) => {
                    // Prevent negative values and ensure clean input
                    const value = e.target.value;
                    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                      handleFieldChange('currentAmount', value);
                    }
                  }}
                  onBlur={(e) => {
                    // Clean up the value on blur
                    const value = e.target.value;
                    if (value && !isNaN(parseFloat(value))) {
                      const cleanValue = parseFloat(value).toString();
                      if (cleanValue !== value) {
                        handleFieldChange('currentAmount', cleanValue);
                      }
                    }
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  inputMode="decimal"
                  {...getFieldProps('currentAmount')}
                />
                {getFieldProps('currentAmount').error && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    ⚠️ {getFieldProps('currentAmount').error}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Date <span className="text-red-500 ml-1">*</span>
                </label>
                
                {/* Quick Date Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + 3);
                      handleFieldChange('targetDate', date.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    3 months
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + 6);
                      handleFieldChange('targetDate', date.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    6 months
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      date.setFullYear(date.getFullYear() + 1);
                      handleFieldChange('targetDate', date.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    1 year
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      date.setMonth(11, 31); // December 31st of current year
                      if (date < new Date()) {
                        date.setFullYear(date.getFullYear() + 1); // Next year if current year end has passed
                      }
                      handleFieldChange('targetDate', date.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    End of Year
                  </button>
                </div>
                
                <input
                  type="date"
                  id="targetDate"
                  value={formData.targetDate}
                  onChange={(e) => handleFieldChange('targetDate', e.target.value)}
                  min={getTodayDateString()}
                  {...getFieldProps('targetDate')}
                />
                {getFieldProps('targetDate').error && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    ⚠️ {getFieldProps('targetDate').error}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Additional details about this goal..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {editingGoal ? 'Update Goal' : 'Add Goal'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const monthsLeft = getMonthsUntilDate(goal.targetDate);
            const daysLeft = getDaysDifference(getTodayDateString(), goal.targetDate);
            const monthlyTarget = calculateMonthlyTarget(goal);
            const status = getGoalStatus(goal);
            
            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                        {status.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {daysLeft > 0 ? getRelativeDateString(goal.targetDate) : 'Overdue'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span>
                          €{monthlyTarget.toLocaleString()}/month needed
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        €{goal.currentAmount.toLocaleString()} / €{goal.targetAmount.toLocaleString()}
                      </span>
                      <span className="font-medium text-blue-600">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Set Yet</h3>
          <p className="text-gray-500 mb-6">
            Create savings goals to track your progress and stay motivated on your financial journey.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Set Your First Goal
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && goalToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Goal</h2>
              </div>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this goal?
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                <p className="font-medium text-gray-900">{goalToDelete.name}</p>
                <p className="text-sm text-gray-600">
                  €{goalToDelete.currentAmount.toLocaleString()} / €{goalToDelete.targetAmount.toLocaleString()} 
                  {goalToDelete.description && ` • ${goalToDelete.description}`}
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-800 text-sm font-medium">⚠️ This action cannot be undone!</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;