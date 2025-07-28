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

  useEffect(() => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (budget) {
      setTotalAmount(budget.totalBudget.toString());
      const cats = budgetCategories.filter((c) => c.budgetId === budget.id);
      setCategories(cats.map((c) => ({ category: c.category, allocated: c.allocatedAmount.toString() })));
    }
  }, [budgetId, budgets, budgetCategories]);

  const handleCategoryChange = (index: number, field: string, value: string) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const handleAddCategory = () => {
    setCategories((prev) => [...prev, { category: '', allocated: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = parseFloat(totalAmount);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      alert('Please enter a valid total budget');
      return;
    }
    const categoryBreakdown = categories
      .filter((c) => c.category.trim())
      .map((c) => ({ category: c.category.trim(), allocatedAmount: parseFloat(c.allocated) || 0 }));
    try {
      await updateBudget(budgetId, parsedTotal, categoryBreakdown);
      showToast.success('Budget updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating budget:', error);
      showToast.error('Failed to update budget. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Edit Budget</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
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
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update Budget
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

