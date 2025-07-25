import React, { useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { Plus, Edit3, Trash2 } from 'lucide-react';

/**
 * Component for managing recurring expenses.  It displays a list of all recurring
 * expenses and provides forms to add new ones or edit existing ones.  This
 * component uses the recurring expense helpers provided by useFinanceData and
 * relies on localStorage for persistence until a Supabase table is implemented.
 */
const RecurringExpensesManager: React.FC = () => {
  const {
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
  } = useFinanceData();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    nextDue: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!formData.description.trim() || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid description and amount');
      return;
    }
    const payload = {
      id: editingId || Date.now().toString(),
      description: formData.description.trim(),
      amount,
      category: formData.category || 'Other',
      frequency: formData.frequency,
      nextDue: formData.nextDue || new Date().toISOString().substring(0, 10),
    };
    try {
      if (editingId) {
        await updateRecurringExpense(editingId, payload);
      } else {
        await addRecurringExpense(payload);
      }
      setEditingId(null);
      setFormData({ description: '', amount: '', category: '', frequency: 'monthly', nextDue: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving recurring expense:', error);
    }
  };

  const handleEdit = (id: string) => {
    const exp = recurringExpenses.find((e) => e.id === id);
    if (!exp) return;
    setEditingId(id);
    setFormData({
      description: exp.description,
      amount: exp.amount.toString(),
      category: exp.category,
      frequency: exp.frequency,
      nextDue: exp.nextDue,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this recurring expense?')) {
      await deleteRecurringExpense(id);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Recurring Expenses</h2>
      <button
        type="button"
        onClick={() => {
          setEditingId(null);
          setFormData({ description: '', amount: '', category: '', frequency: 'monthly', nextDue: '' });
          setShowForm(true);
        }}
        className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus size={16} /> Add Recurring Expense
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 border border-gray-200 p-4 rounded">
          <div>
            <label htmlFor="rec-description" className="block text-sm font-medium text-gray-700">Description</label>
            <input
              id="rec-description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="rec-amount" className="block text-sm font-medium text-gray-700">Amount (€)</label>
            <input
              id="rec-amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="rec-category" className="block text-sm font-medium text-gray-700">Category</label>
            <input
              id="rec-category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label htmlFor="rec-frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
            <select
              id="rec-frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label htmlFor="rec-nextdue" className="block text-sm font-medium text-gray-700">Next Due Date</label>
            <input
              id="rec-nextdue"
              type="date"
              value={formData.nextDue}
              onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="space-y-2">
        {recurringExpenses.map((exp) => (
          <li key={exp.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
            <div>
              <div className="font-medium">{exp.description}</div>
              <div className="text-sm text-gray-600">€{exp.amount.toLocaleString()} – {exp.frequency} – Next: {exp.nextDue}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleEdit(exp.id)}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Edit"
              >
                <Edit3 size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(exp.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecurringExpensesManager;

