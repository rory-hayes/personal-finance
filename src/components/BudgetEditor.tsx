import React, { useState, useEffect } from 'react';
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
    <div className="p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-semibold mb-2">Edit Budget</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetEditor;

