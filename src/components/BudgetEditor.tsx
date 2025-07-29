import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { showToast } from '../utils/toast';

/**
 * Component for editing an existing monthly budget.  It allows users to
 * update the total budget and reallocate funds across categories.  The
 * component uses the updateBudget helper from useFinanceData.
 */
const BudgetEditor: React.FC<{ budgetId: string; onClose: () => void }> = ({ budgetId, onClose }) => {
  const { budgets, budgetCategories, updateBudget } = useFinanceData();
  const [totalAmount, setTotalAmount] = useState('');
  const [categories, setCategories] = useState<{ category: string; allocated: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only initialize once or when budgetId changes, not during submission
    if (isSubmitting && hasInitialized) return;
    
    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      setTotalAmount(budget.totalBudget.toString());
      const cats = budgetCategories.filter((c) => c.budgetId === budget.id);
      setCategories(cats.map((c) => ({ category: c.category, allocated: c.allocatedAmount.toString() })));
      setHasInitialized(true);
    }
  }, [budgetId, budgets, budgetCategories, isSubmitting, hasInitialized]);

  const handleCategoryChange = (index: number, field: string, value: string) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const handleAddCategory = () => {
    setCategories((prev) => [...prev, { category: '', allocated: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    const parsedTotal = parseFloat(totalAmount);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      showToast.error('Please enter a valid total budget amount greater than 0.');
      return;
    }

    // Calculate total allocated across categories
    const categoryBreakdown = categories
      .filter((c) => c.category.trim())
      .map((c) => ({ category: c.category.trim(), allocatedAmount: parseFloat(c.allocated) || 0 }));
    
    const totalAllocated = categoryBreakdown.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
    
    // Allow submission even if not perfectly balanced, but warn if over budget
    if (totalAllocated > parsedTotal) {
      showToast.error(`Category allocations (€${totalAllocated.toLocaleString()}) exceed total budget (€${parsedTotal.toLocaleString()}). Please adjust your allocations.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBudget(budgetId, parsedTotal, categoryBreakdown);
      showToast.success(`Budget updated successfully! Total: €${parsedTotal.toLocaleString()}, Categories: ${categoryBreakdown.length}`);
      onClose();
    } catch (error) {
      console.error('Error updating budget:', error);
      showToast.error('Failed to update budget. Please check your internet connection and try again.');
      setIsSubmitting(false); // Re-enable submission on error
    }
  };

  // Calculate totals for validation and display
  const totalBudget = parseFloat(totalAmount) || 0;
  const totalAllocated = categories.reduce((sum, cat) => sum + (parseFloat(cat.allocated) || 0), 0);
  const remainingBudget = totalBudget - totalAllocated;
  const isOverBudget = totalAllocated > totalBudget;

  return (
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Sticky Header with Total Budget */}
      <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Edit Budget</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Budget Summary - Always Visible */}
        <div className={`p-4 rounded-lg border-2 ${
          isOverBudget 
            ? 'bg-red-50 border-red-200' 
            : remainingBudget === 0 && totalBudget > 0
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-700">Total Budget</div>
              <div className="text-lg font-bold text-gray-900">€{totalBudget.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">Allocated</div>
              <div className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                €{totalAllocated.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">Remaining</div>
              <div className={`text-lg font-bold ${
                isOverBudget ? 'text-red-600' : remainingBudget === 0 ? 'text-green-600' : 'text-blue-600'
              }`}>
                €{remainingBudget.toLocaleString()}
              </div>
            </div>
          </div>
          
          {isOverBudget && (
            <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
              ⚠️ <strong>Over Budget!</strong> Reduce allocations by €{(totalAllocated - totalBudget).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="budget-total" className="block text-sm font-medium text-gray-700">Total Budget (€)</label>
          <input
            id="budget-total"
            type="number"
            min="0"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Categories</span>
            <button type="button" onClick={handleAddCategory} className="text-blue-600 hover:underline">Add</button>
          </div>
          {categories.map((cat, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Category"
                value={cat.category}
                onChange={(e) => handleCategoryChange(idx, 'category', e.target.value)}
                className="border border-gray-300 rounded p-2"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Allocated (€)"
                value={cat.allocated}
                onChange={(e) => handleCategoryChange(idx, 'allocated', e.target.value)}
                className="border border-gray-300 rounded p-2"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isOverBudget || isSubmitting}
            className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isOverBudget || isSubmitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isSubmitting 
              ? 'Updating Budget...' 
              : isOverBudget 
                ? 'Fix Allocations First' 
                : 'Update Budget'
            }
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetEditor;

