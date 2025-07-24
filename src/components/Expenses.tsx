import React, { useState, useCallback } from 'react';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, X, Plus, Calendar, DollarSign, Receipt, History, Edit3, Trash2, Filter, Search, HelpCircle, Info } from 'lucide-react';
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

  // Expense management state
  const [showExpenseHistory, setShowExpenseHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Transaction | null>(null);
  
  const { addTransaction, transactions, users } = useFinanceData();

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
          transactions = parseCSV(content, users[0]?.id);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
          transactions = parsePDF(content, users[0]?.id);
        } else {
          results.push({
            success: false,
            message: `Unsupported file type: ${file.name}`,
          });
          continue;
        }

        if (transactions.length > 0) {
          // Only set pending transactions for review - DO NOT save to database yet
          setPendingTransactions(transactions);
          setShowReviewModal(true);
          
          results.push({
            success: true,
            message: `Found ${transactions.length} transactions ready for review`,
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
  }, [users]); // Removed addTransaction dependency to prevent automatic calling

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
      
      // Show detailed user feedback
      if (successCount > 0 && errorCount === 0) {
        // Perfect import
        alert(`✅ Successfully imported all ${successCount} transaction${successCount === 1 ? '' : 's'}!`);
      } else if (successCount > 0 && errorCount > 0) {
        // Partial import
        const message = `⚠️ Partial Import Complete\n\n` +
          `✅ Successfully imported: ${successCount} transaction${successCount === 1 ? '' : 's'}\n` +
          `❌ Failed to import: ${errorCount} transaction${errorCount === 1 ? '' : 's'}\n\n` +
          `The failed transactions may have invalid data or duplicate IDs. ` +
          `Check the browser console for detailed error messages.`;
        alert(message);
      } else {
        // Complete failure
        alert('❌ Import Failed\n\nNo transactions could be imported. This may be due to:\n' +
              '• Database connection issues\n' +
              '• Invalid transaction data\n' +
              '• Duplicate transaction IDs\n\n' +
              'Please check your data and try again.');
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

        <button
          onClick={() => setShowExpenseHistory(!showExpenseHistory)}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <History className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Expense History</h3>
              <p className="text-sm text-gray-600">View and manage your expenses</p>
            </div>
          </div>
        </button>
      </div>

      {/* Expense History Section */}
      {showExpenseHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Expense History</h3>
            <p className="text-sm text-gray-600">
              {transactions.filter(t => t.amount < 0).length} expenses found
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setDateFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>

          {/* Expenses List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions
              .filter(transaction => {
                // Only show expenses (negative amounts)
                if (transaction.amount >= 0) return false;
                
                // Search filter
                if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
                    !transaction.category?.toLowerCase().includes(searchTerm.toLowerCase())) {
                  return false;
                }
                
                // Category filter
                if (selectedCategory !== 'All' && transaction.category !== selectedCategory) {
                  return false;
                }
                
                // Date filter
                const transactionDate = new Date(transaction.date);
                const now = new Date();
                
                switch (dateFilter) {
                  case 'today':
                    return transactionDate.toDateString() === now.toDateString();
                  case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return transactionDate >= weekAgo;
                  case 'month':
                    return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
                  case 'quarter':
                    const currentQuarter = Math.floor(now.getMonth() / 3);
                    const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
                    return transactionQuarter === currentQuarter && transactionDate.getFullYear() === now.getFullYear();
                  case 'year':
                    return transactionDate.getFullYear() === now.getFullYear();
                  default:
                    return true;
                }
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-full">
                          <DollarSign className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-red-600">
                        €{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingExpense(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit expense"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setExpenseToDelete(transaction);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
            
            {transactions.filter(t => t.amount < 0).length === 0 && (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No expenses found</p>
                <p className="text-sm text-gray-400">Add your first expense to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

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

        {/* File Format Help */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">File Format Requirements</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <div>
                  <strong>CSV Files:</strong> Should contain columns for Date, Description, and Amount
                  <ul className="list-disc list-inside mt-1 ml-2 text-blue-700">
                    <li><strong>Date formats:</strong> YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY</li>
                    <li><strong>Amount:</strong> Can include currency symbols (€, $), negative values in parentheses</li>
                    <li><strong>Example row:</strong> "2024-01-15","Grocery Store","-25.50"</li>
                  </ul>
                </div>
                <div>
                  <strong>PDF Files:</strong> Bank statements with transaction data (basic text extraction)
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded">
                  <strong>💡 Tip:</strong> In the review modal, you can edit dates, amounts, descriptions, and toggle between income/expense before importing.
                </div>
              </div>
            </div>
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
      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Expense</h2>
                <button
                  onClick={() => setEditingExpense(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                // For now, just close the modal - actual update functionality would go here
                alert('Edit functionality would be implemented here with updateTransaction function');
                setEditingExpense(null);
              }} 
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
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
                  value={Math.abs(editingExpense.amount)}
                  onChange={(e) => setEditingExpense({...editingExpense, amount: -Math.abs(parseFloat(e.target.value) || 0)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editingExpense.category || 'Other'}
                  onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
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
                  value={editingExpense.date.split('T')[0]}
                  onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && expenseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Expense</h2>
              </div>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this expense?
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                <p className="font-medium text-gray-900">{expenseToDelete.description}</p>
                <p className="text-sm text-gray-600">
                  €{Math.abs(expenseToDelete.amount).toLocaleString()} • {expenseToDelete.category} • {new Date(expenseToDelete.date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-800 text-sm font-medium">⚠️ This action cannot be undone!</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setExpenseToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // For now, just show an alert - actual delete functionality would go here
                    alert('Delete functionality would be implemented here with deleteTransaction function');
                    setShowDeleteConfirm(false);
                    setExpenseToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;