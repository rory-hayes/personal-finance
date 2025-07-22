import React, { useState, useCallback } from 'react';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, X, Plus, Calendar, DollarSign, Receipt } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { parseCSV, parsePDF } from '../utils/fileParser';
import TransactionReviewTable from './TransactionReviewTable';
import { Transaction } from '../types';

const Expenses: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: boolean;
    message: string;
    transactionCount?: number;
  }[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [manualExpense, setManualExpense] = useState({
    description: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
  });
  const [recurringExpense, setRecurringExpense] = useState({
    description: '',
    amount: '',
    category: 'Bills',
    frequency: 'monthly',
  });
  
  const { addTransaction, users } = useFinanceData();

  const expenseCategories = [
    'Groceries', 'Dining', 'Transportation', 'Utilities', 'Housing', 
    'Healthcare', 'Entertainment', 'Shopping', 'Bills', 'Insurance', 'Other'
  ];

  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    const results: typeof uploadResults = [];

    for (const file of Array.from(files)) {
      try {
        const content = await readFile(file);
        let transactions;

        if (file.name.toLowerCase().endsWith('.csv')) {
          transactions = parseCSV(content, users[0]?.name);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
          transactions = parsePDF(content, users[0]?.name);
        } else {
          results.push({
            success: false,
            message: `Unsupported file type: ${file.name}`,
          });
          continue;
        }

        if (transactions.length > 0) {
          // Show transactions for review instead of adding directly
          setPendingTransactions(transactions);
          setShowReviewModal(true);
          
          results.push({
            success: true,
            message: `Found ${transactions.length} transactions in ${file.name}`,
            transactionCount: transactions.length,
          });
        } else {
          results.push({
            success: false,
            message: `No valid transactions found in ${file.name}`,
          });
        }
      } catch (error) {
        results.push({
          success: false,
          message: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    setUploadResults(results);
    setUploading(false);
  }, [addTransaction, users]);

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(manualExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    addTransaction({
      date: manualExpense.date,
      description: manualExpense.description,
      amount: -Math.abs(amount), // Expenses are negative
      category: manualExpense.category,
      userId: users[0]?.id,
    });

    setManualExpense({
      description: '',
      amount: '',
      category: 'Other',
      date: new Date().toISOString().split('T')[0],
    });
    setShowManualForm(false);
  };

  const handleRecurringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(recurringExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // For now, just add as a regular transaction
    // In a full implementation, this would set up recurring transactions
    addTransaction({
      date: new Date().toISOString(),
      description: `${recurringExpense.description} (${recurringExpense.frequency})`,
      amount: -Math.abs(amount),
      category: recurringExpense.category,
      userId: users[0]?.id,
    });

    setRecurringExpense({
      description: '',
      amount: '',
      category: 'Bills',
      frequency: 'monthly',
    });
    setShowRecurringForm(false);
  };

  const handleApproveTransactions = async (approvedTransactions: Transaction[]) => {
    try {
      console.log('Importing transactions:', approvedTransactions);
      
      // Show loading state
      setUploading(true);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const transaction of approvedTransactions) {
        try {
          await addTransaction(transaction);
          successCount++;
          console.log('Transaction imported successfully:', transaction);
        } catch (error) {
          errorCount++;
          console.error('Error importing transaction:', transaction, error);
        }
      }
      
      setShowReviewModal(false);
      setPendingTransactions([]);
      setUploading(false);
      
      // Update upload results to show import status
      setUploadResults(prev => prev.map((result: any) => 
        result.transactionCount ? {
          ...result,
          success: successCount > 0,
          message: errorCount > 0 
            ? `Imported ${successCount} transactions, ${errorCount} failed`
            : `Successfully imported ${successCount} transactions`,
          transactionCount: successCount
        } : result
      ));
      
      // Show user feedback
      if (successCount > 0) {
        alert(`Successfully imported ${successCount} transaction${successCount === 1 ? '' : 's'}!`);
      } else {
        alert('Failed to import transactions. Please check your database connection.');
      }
      
    } catch (error) {
      console.error('Error in handleApproveTransactions:', error);
      setUploading(false);
      alert('Error importing transactions. Please try again.');
    }
  };

  const handleRejectTransactions = () => {
    setShowReviewModal(false);
    setPendingTransactions([]);
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Expenses</h2>
        <p className="text-gray-600">
          Track your expenses by uploading documents or adding them manually
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setShowManualForm(true)}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Add Manual Expense</h3>
              <p className="text-sm text-gray-600">Quickly add individual expenses</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowRecurringForm(true)}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Recurring Expenses</h3>
              <p className="text-sm text-gray-600">Set up bills and regular costs</p>
            </div>
          </div>
        </button>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upload Documents</h3>
              <p className="text-sm text-gray-600">Import from bank statements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".csv,.pdf"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <UploadIcon className="h-6 w-6 text-gray-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {uploading ? 'Processing files...' : 'Drop files here or click to browse'}
              </h3>
              <p className="text-gray-600">
                Supports CSV and PDF bank statements. Multiple files can be uploaded at once.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                CSV
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                PDF
              </div>
            </div>

            {uploading && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Expense Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Manual Expense</h2>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={manualExpense.description}
                  onChange={(e) => setManualExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Grocery shopping, Gas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (€)
                </label>
                <input
                  type="number"
                  value={manualExpense.amount}
                  onChange={(e) => setManualExpense(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={manualExpense.category}
                  onChange={(e) => setManualExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={manualExpense.date}
                  onChange={(e) => setManualExpense(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recurring Expense Modal */}
      {showRecurringForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Recurring Expense</h2>
                <button
                  onClick={() => setShowRecurringForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleRecurringSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={recurringExpense.description}
                  onChange={(e) => setRecurringExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Mortgage, Internet Bill"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (€)
                </label>
                <input
                  type="number"
                  value={recurringExpense.amount}
                  onChange={(e) => setRecurringExpense(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={recurringExpense.category}
                  onChange={(e) => setRecurringExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={recurringExpense.frequency}
                  onChange={(e) => setRecurringExpense(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add Recurring Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecurringForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Review Transactions</h2>
                <button
                  onClick={handleRejectTransactions}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Review and categorize {pendingTransactions.length} transactions before importing
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <TransactionReviewTable 
                transactions={pendingTransactions}
                onTransactionsChange={setPendingTransactions}
                expenseCategories={expenseCategories}
              />
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleApproveTransactions(pendingTransactions.filter(t => !t.rejected))}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Import {pendingTransactions.filter(t => !t.rejected).length} Transactions
              </button>
              <button
                onClick={handleRejectTransactions}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload Results</h3>
            <button
              onClick={clearResults}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            {uploadResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  {result.transactionCount && (
                    <p className="text-sm text-green-600 mt-1">
                      Added {result.transactionCount} transaction{result.transactionCount === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Expense Tracking Tips</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <h4 className="font-medium">Manual Entry:</h4>
            <p>Perfect for cash purchases, small expenses, or when you want immediate tracking.</p>
          </div>
          <div>
            <h4 className="font-medium">Recurring Expenses:</h4>
            <p>Set up your regular bills like rent, utilities, and subscriptions for automatic tracking.</p>
          </div>
          <div>
            <h4 className="font-medium">Document Upload:</h4>
            <p>Upload bank statements or receipts for bulk import of transactions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;