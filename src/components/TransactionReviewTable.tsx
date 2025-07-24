import React from 'react';
import { Check, X, Edit3 } from 'lucide-react';
import { Transaction } from '../types';

interface ReviewTransaction extends Transaction {
  rejected?: boolean;
}

interface TransactionReviewTableProps {
  transactions: ReviewTransaction[];
  onTransactionsChange: (transactions: ReviewTransaction[]) => void;
  expenseCategories: string[];
}

const TransactionReviewTable: React.FC<TransactionReviewTableProps> = ({
  transactions,
  onTransactionsChange,
  expenseCategories,
}) => {
  const updateTransaction = (index: number, updates: Partial<ReviewTransaction>) => {
    const updatedTransactions = transactions.map((transaction, i) => 
      i === index ? { ...transaction, ...updates } : transaction
    );
    onTransactionsChange(updatedTransactions);
  };

  const toggleTransaction = (index: number) => {
    const transaction = transactions[index];
    updateTransaction(index, { rejected: !transaction.rejected });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    const isExpense = amount < 0;
    return (
      <span className={isExpense ? 'text-red-600' : 'text-green-600'}>
        {isExpense ? '-' : '+'}€{absAmount.toFixed(2)}
      </span>
    );
  };

  const approvedCount = transactions.filter(t => !t.rejected).length;
  const rejectedCount = transactions.filter(t => t.rejected).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            {approvedCount} to import
          </span>
        </div>
        <div className="flex items-center gap-2">
          <X className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-gray-700">
            {rejectedCount} rejected
          </span>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 font-medium text-gray-700">Include</th>
              <th className="text-left p-3 font-medium text-gray-700">Date</th>
              <th className="text-left p-3 font-medium text-gray-700">Description</th>
              <th className="text-left p-3 font-medium text-gray-700">Amount</th>
              <th className="text-left p-3 font-medium text-gray-700">Category</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr 
                key={index} 
                className={`border-b border-gray-100 ${
                  transaction.rejected ? 'bg-red-50 opacity-60' : 'bg-white'
                }`}
              >
                <td className="p-3">
                  <button
                    onClick={() => toggleTransaction(index)}
                    className={`p-2 rounded-lg transition-colors ${
                      transaction.rejected 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {transaction.rejected ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </button>
                </td>
                <td className="p-3">
                  <input
                    type="date"
                    value={transaction.date ? transaction.date.split('T')[0] : ''}
                    onChange={(e) => updateTransaction(index, { date: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={transaction.rejected}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={transaction.description}
                    onChange={(e) => updateTransaction(index, { description: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={transaction.rejected}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={Math.abs(transaction.amount)}
                    onChange={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      // Preserve the sign (negative for expenses, positive for income)
                      const signedAmount = transaction.amount < 0 ? -Math.abs(newAmount) : Math.abs(newAmount);
                      updateTransaction(index, { amount: signedAmount });
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={transaction.rejected}
                    min="0"
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={() => updateTransaction(index, { amount: -transaction.amount })}
                    className={`text-xs px-2 py-1 rounded mt-1 transition-colors ${
                      transaction.amount < 0 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    disabled={transaction.rejected}
                    title="Click to toggle between expense and income"
                  >
                    {transaction.amount < 0 ? 'Expense' : 'Income'}
                  </button>
                </td>
                <td className="p-3">
                  <select
                    value={transaction.category}
                    onChange={(e) => updateTransaction(index, { category: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={transaction.rejected}
                  >
                    {expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions to review
        </div>
      )}
    </div>
  );
};

export default TransactionReviewTable;