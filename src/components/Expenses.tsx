import React, { useState, useCallback, useEffect } from 'react';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, X, Plus, Calendar, DollarSign, Receipt, History, Edit3, Trash2, Filter, Search, HelpCircle, Info, Repeat } from 'lucide-react';
import RecurringExpensesManager from './RecurringExpensesManager';
import { useFinanceData } from '../hooks/useFinanceData';
import { parseCSV, parsePDF } from '../utils/fileParser';
import TransactionReviewTable from './TransactionReviewTable';
import { Transaction } from '../types';
import { showToast } from '../utils/toast';
import { getTodayDateString, getDateRange, isDateInRange, getRelativeDateString } from '../utils/dateUtils';
import { 
  RecurringTransaction, 
  loadRecurringTransactions, 
  saveRecurringTransactions, 
  processDueRecurringTransactions,
  setupRecurringTransactionProcessor,
  validateRecurringTransaction,
  getFrequencyDescription,
  getNextDueDate
} from '../utils/recurringTransactions';

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
  const [pendingTransactions, setPendingTransactions] = useState<(Transaction & { rejected?: boolean })[]>([]);
  const [manualExpense, setManualExpense] = useState({
    description: '',
    amount: '',
    category: 'Other',
    date: getTodayDateString(),
  });
  const [recurringExpense, setRecurringExpense] = useState({
    description: '',
    amount: '',
    category: 'Bills',
    frequency: 'monthly',
    startDate: getTodayDateString(),
    endDate: '',
  });

  // Recurring transactions state
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [showRecurringManagement, setShowRecurringManagement] = useState(false);

  // Load recurring transactions on component mount
  useEffect(() => {
    const loaded = loadRecurringTransactions();
    setRecurringTransactions(loaded);
  }, []);

  // Expense management state
  const [showExpenseHistory, setShowExpenseHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Transaction | null>(null);
  
  const { addTransaction, updateTransaction, deleteTransaction, transactions, users, addRecurringExpense, recurringExpenses } = useFinanceData();

  // Set up recurring transaction processor
  useEffect(() => {
    const processRecurring = async () => {
      const { processed, updated } = processDueRecurringTransactions(
        recurringTransactions,
        addTransaction
      );

      if (processed.length > 0) {
        // Add all processed transactions
        for (const transaction of processed) {
          try {
            await addTransaction(transaction);
          } catch (error) {
            console.error('Failed to add recurring transaction:', error);
          }
        }

        // Update recurring transactions with new next due dates
        setRecurringTransactions(updated);
        saveRecurringTransactions(updated);

        showToast.success(`Processed ${processed.length} recurring transaction${processed.length === 1 ? '' : 's'}!`);
      }
    };

    if (recurringTransactions.length > 0) {
      // Set up processor to run every hour
      const cleanup = setupRecurringTransactionProcessor(processRecurring, 60);
      return cleanup;
    }
  }, [recurringTransactions, addTransaction]);

  const expenseCategories = [
    'Groceries', 'Dining', 'Transportation', 'Utilities', 'Housing', 
    'Healthcare', 'Entertainment', 'Shopping', 'Bills', 'Insurance', 'Other'
  ];

  // Helper function for automatic category suggestions
  const getSuggestedCategory = (description: string): string => {
    const desc = description.toLowerCase();
    
    // Food & Dining
    if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('food') ||
        desc.includes('whole foods') || desc.includes('trader joe') || desc.includes('walmart') ||
        desc.includes('costco') || desc.includes('target') || desc.includes('safeway') ||
        desc.includes('kroger') || desc.includes('publix') || desc.includes('aldi') ||
        desc.includes('tesco') || desc.includes('lidl') || desc.includes('asda')) {
      return 'Groceries';
    }
    
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining') ||
        desc.includes('mcdonald') || desc.includes('starbucks') || desc.includes('subway') ||
        desc.includes('pizza') || desc.includes('burger') || desc.includes('taco') ||
        desc.includes('kfc') || desc.includes('domino') || desc.includes('chipotle') ||
        desc.includes('dunkin') || desc.includes('coffee') || desc.includes('bar ') ||
        desc.includes('pub ') || desc.includes('grill') || desc.includes('bistro') ||
        desc.includes('diner') || desc.includes('bakery') || desc.includes('buffet')) {
      return 'Dining';
    }
    
    // Transportation
    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('shell') || 
        desc.includes('bp') || desc.includes('exxon') || desc.includes('chevron') ||
        desc.includes('mobil') || desc.includes('uber') || desc.includes('lyft') || 
        desc.includes('taxi') || desc.includes('parking') || desc.includes('toll')) {
      return 'Transportation';
    }
    
    // Utilities & Bills
    if (desc.includes('electric') || desc.includes('water') || desc.includes('gas bill') ||
        desc.includes('internet') || desc.includes('phone') || desc.includes('utility') ||
        desc.includes('rent') || desc.includes('mortgage') || desc.includes('insurance')) {
      return 'Bills';
    }
    
    // Healthcare
    if (desc.includes('pharmacy') || desc.includes('doctor') || desc.includes('hospital') ||
        desc.includes('clinic') || desc.includes('dental') || desc.includes('medical') ||
        desc.includes('health') || desc.includes('prescription')) {
      return 'Healthcare';
    }
    
    // Entertainment
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('cinema') ||
        desc.includes('movie') || desc.includes('theater') || desc.includes('game') ||
        desc.includes('entertainment') || desc.includes('subscription')) {
      return 'Entertainment';
    }
    
    // Shopping
    if (desc.includes('amazon') || desc.includes('shop') || desc.includes('store') ||
        desc.includes('mall') || desc.includes('clothes') || desc.includes('clothing') ||
        desc.includes('fashion') || desc.includes('electronics')) {
      return 'Shopping';
    }
    
    return 'Other';
  };

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
          // Debug: Log first few transactions to verify parsing
          console.log('📊 Sample transactions parsed:', transactions.slice(0, 3).map(t => ({
            description: t.description,
            amount: t.amount,
            isExpense: t.amount < 0,
            category: t.category
          })));
          
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
    
    // Comprehensive validation
    const errors: string[] = [];
    
    if (!manualExpense.description.trim()) {
      errors.push('Description is required');
    } else if (manualExpense.description.trim().length < 3) {
      errors.push('Description must be at least 3 characters');
    }
    
    const amount = parseFloat(manualExpense.amount);
    if (!manualExpense.amount.trim() || isNaN(amount)) {
      errors.push('Please enter a valid amount');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (amount > 1000000) {
      errors.push('Amount seems unusually large. Please verify.');
    }
    
    if (!manualExpense.date) {
      errors.push('Date is required');
    }
    
    if (!manualExpense.category) {
      errors.push('Category is required');
    }
    
    if (errors.length > 0) {
      showToast.validationError(errors.join(', '));
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

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation for recurring expenses
    const errors: string[] = [];
    
    if (!recurringExpense.description.trim()) {
      errors.push('Description is required');
    } else if (recurringExpense.description.trim().length < 3) {
      errors.push('Description must be at least 3 characters');
    }
    
    const amount = parseFloat(recurringExpense.amount);
    if (!recurringExpense.amount.trim() || isNaN(amount)) {
      errors.push('Please enter a valid amount');
    } else if (amount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (amount > 100000) {
      errors.push('Monthly recurring amount seems unusually large. Please verify.');
    }
    
    if (!recurringExpense.frequency) {
      errors.push('Frequency is required');
    }
    
    if (!recurringExpense.category) {
      errors.push('Category is required');
    }
    
    if (errors.length > 0) {
      showToast.validationError(errors.join(', '));
      return;
    }

    try {
      // Create recurring expense using the same system as the management list
      const newRecurringExpense = {
        id: `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: recurringExpense.description.trim(),
        amount: amount, // Store as positive amount
        category: recurringExpense.category,
        frequency: recurringExpense.frequency,
        nextDue: recurringExpense.startDate,
        active: true,
      };

      // Use the useFinanceData hook's function to ensure consistency
      await addRecurringExpense(newRecurringExpense);

      showToast.success(`Recurring ${recurringExpense.frequency} expense created: ${recurringExpense.description}`);

      setRecurringExpense({
        description: '',
        amount: '',
        category: 'Bills',
        frequency: 'monthly',
        startDate: getTodayDateString(),
        endDate: '',
      });
      setShowRecurringForm(false);
    } catch (error) {
      console.error('Error saving recurring expense:', error);
      showToast.error('Failed to save recurring expense. Please try again.');
    }
  };

  const handleApproveTransactions = async (approvedTransactions: Transaction[]) => {
    try {
      console.log('Importing transactions:', approvedTransactions);
      
      // Show loading state
      setUploading(true);
      
      let successCount = 0;
      let errorCount = 0;
      const totalTransactions = approvedTransactions.length;
      
      // Show progress for each transaction
      for (let i = 0; i < approvedTransactions.length; i++) {
        const transaction = approvedTransactions[i];
        try {
          await addTransaction(transaction);
          successCount++;
          console.log(`Transaction ${i + 1}/${totalTransactions} imported successfully:`, transaction);
          
          // Update progress (optional - you could show this in UI)
          setUploadResults([{
            success: true,
            message: `Importing transactions... ${successCount}/${totalTransactions} completed`,
            transactionCount: successCount
          }]);
        } catch (error) {
          errorCount++;
          console.error(`Error importing transaction ${i + 1}/${totalTransactions}:`, transaction, error);
        }
      }
      
      setShowReviewModal(false);
      setPendingTransactions([]);
      setUploading(false);
      
      // Show final results
      setUploadResults([{
        success: successCount > 0,
        message: errorCount > 0 
          ? `✅ Import complete: ${successCount} successful, ${errorCount} failed`
          : `✅ Successfully imported all ${successCount} transactions!`,
        transactionCount: successCount
      }]);
      
      // Show detailed user feedback
      if (successCount > 0 && errorCount === 0) {
        // Perfect import
        showToast.success(`Successfully imported ${successCount} transaction${successCount === 1 ? '' : 's'}!`);
      } else if (successCount > 0 && errorCount > 0) {
        // Partial import
        const message = `⚠️ Partial Import Complete\n\n` +
          `✅ Successfully imported: ${successCount} transaction${successCount === 1 ? '' : 's'}\n` +
          `❌ Failed to import: ${errorCount} transaction${errorCount === 1 ? '' : 's'}\n\n` +
          `The failed transactions may have invalid data or duplicate IDs. ` +
          `Check the browser console for detailed error messages.`;
                  showToast.warning(message);
      } else {
        // Complete failure
        showToast.error('Import Failed - No transactions could be imported. This may be due to database connection issues, invalid transaction data, or duplicate transaction IDs. Please check your data and try again.');
      }
      
    } catch (error) {
      console.error('Error in handleApproveTransactions:', error);
      setUploading(false);
              showToast.error('Error importing transactions. Please try again.');
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

      {/* First-time user guidance */}
      {transactions.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome! Let's get started</h3>
              <p className="text-blue-800 mb-4">
                Start tracking your expenses by uploading a bank statement or adding your first expense manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg active:bg-blue-700 lg:hover:bg-blue-700 transition-colors text-sm min-h-[44px] touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Add First Expense
                </button>
                <a
                  href="/sample-statement.csv"
                  download
                  className="px-4 py-3 border border-blue-300 text-blue-700 rounded-lg active:bg-blue-50 lg:hover:bg-blue-50 transition-colors text-sm min-h-[44px] flex items-center justify-center touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Download Sample CSV
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel: Manual & Recurring Options */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Quick Entry
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowManualForm(true)}
                className="w-full bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Add Manual Expense</h4>
                    <p className="text-sm text-gray-600">Perfect for cash purchases and receipts</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowExpenseHistory(!showExpenseHistory)}
                className="w-full bg-orange-50 rounded-lg p-4 hover:bg-orange-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <History className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">View Expense History</h4>
                    <p className="text-sm text-gray-600">Search and filter your past expenses</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Combined Recurring Expenses Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Repeat className="h-5 w-5 text-green-600" />
              Recurring Expenses
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowRecurringForm(true)}
                className="w-full bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Add Recurring Expense</h4>
                    <p className="text-sm text-gray-600">Set up bills, rent, subscriptions</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowRecurringManagement(true)}
                className="w-full bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Edit3 className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Manage Recurring ({recurringExpenses.length})</h4>
                    <p className="text-sm text-gray-600">Edit or cancel scheduled expenses</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Quick Recurring Expenses Preview */}
            {recurringExpenses.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Active Recurring:</h5>
                <div className="space-y-1">
                  {recurringExpenses.slice(0, 3).map((expense, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{expense.description}</span>
                      <span className="font-medium">€{Math.abs(expense.amount)}</span>
                    </div>
                  ))}
                  {recurringExpenses.length > 3 && (
                    <div className="text-xs text-gray-500 pt-1">
                      +{recurringExpenses.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: File Upload */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UploadIcon className="h-5 w-5 text-purple-600" />
              Bulk Import
            </h3>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
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
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UploadIcon className="h-6 w-6 text-purple-600" />
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {uploading ? 'Processing files...' : 'Upload Bank Statements'}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Drop CSV or PDF files here, or click to browse. Supports multiple files.
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
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Tips - Collapsible */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                📋 Upload Guidelines & Tips
              </summary>
              <div className="mt-3 space-y-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <div>
                  <strong>CSV Format:</strong> Should include columns for Date, Description, and either Amount (with +/- signs) or separate Debit/Credit columns.
                </div>
                <div>
                  <strong>PDF Statements:</strong> We'll extract transaction data automatically. Works best with standard bank statement formats.
                </div>
                <div>
                  <strong>Multiple Files:</strong> Upload statements from different months or accounts simultaneously.
                </div>
              </div>
            </details>
          </div>

          {/* Visual Summary for Uploaded Transactions */}
          {transactions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    €{Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700">This Month's Expenses</div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {transactions.filter(t => t.amount < 0).length}
                  </div>
                  <div className="text-sm text-blue-700">Total Transactions</div>
                </div>
              </div>

              {/* Top Categories Preview */}
              {(() => {
                const expensesByCategory = transactions
                  .filter(t => t.amount < 0)
                  .reduce((acc, t) => {
                    const cat = t.category || 'Other';
                    acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
                    return acc;
                  }, {} as Record<string, number>);
                
                const topCategories = Object.entries(expensesByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3);

                return topCategories.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Top Spending Categories</h4>
                    <div className="space-y-1">
                      {topCategories.map(([category, amount]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span className="text-gray-600">{category}</span>
                          <span className="font-medium">€{amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Expense History Section */}
      {showExpenseHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Expense History</h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.amount < 0).length}
                </p>
                <p className="text-sm text-gray-500">
                  expenses ({transactions.length} total transactions)
                </p>
                {/* Debug info for amount distribution */}
                <p className="text-xs text-blue-600">
                  Positive: {transactions.filter(t => t.amount > 0).length}, 
                  Negative: {transactions.filter(t => t.amount < 0).length}, 
                  Zero: {transactions.filter(t => t.amount === 0).length}
                </p>
              </div>
            </div>

            {/* Enhanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-3.5 lg:top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search description, category, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm min-h-[44px]"
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

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min €"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    // Add min amount filter state if needed
                  }}
                />
                <input
                  type="number"
                  placeholder="Max €"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    // Add max amount filter state if needed
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setDateFilter('all');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Debug Info */}
          {transactions.length === 0 && (
            <div className="p-6 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
              <p className="text-gray-600 mb-4">
                Upload your first bank statement or add a manual expense to get started.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowManualForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Manual Expense
                </button>
                <a
                  href="/sample-statement.csv"
                  download
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Download Sample CSV
                </a>
              </div>
            </div>
          )}

          {/* Expenses List */}
          {transactions.length > 0 && (
            <div className="divide-y divide-gray-100">
              {transactions
                .filter(transaction => {
                  // Only show expenses (negative amounts)
                  if (transaction.amount >= 0) return false;
                  
                  // Search filter (improved to search amounts too)
                  if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    const amountStr = Math.abs(transaction.amount).toString();
                    if (
                      !transaction.description.toLowerCase().includes(searchLower) && 
                      !transaction.category?.toLowerCase().includes(searchLower) &&
                      !amountStr.includes(searchTerm)
                    ) {
                      return false;
                    }
                  }
                  
                  // Category filter
                  if (selectedCategory !== 'All' && transaction.category !== selectedCategory) {
                    return false;
                  }
                  
                  // Date filter
                  if (dateFilter !== 'all') {
                    const range = getDateRange(dateFilter as 'today' | 'week' | 'month' | 'quarter' | 'year');
                    if (!isDateInRange(transaction.date, range.start, range.end)) {
                      return false;
                    }
                  }

                  return true;
                })
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{transaction.description}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{getRelativeDateString(transaction.date)}</span>
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {transaction.category || 'Uncategorized'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            €{Math.abs(transaction.amount).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingExpense(transaction)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                            title="Edit expense"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setExpenseToDelete(transaction);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
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
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No expenses found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters or add your first expense</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Quick Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-1">💰 Manual Entry</h4>
            <p>Perfect for cash purchases, small expenses, or when you want immediate tracking.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">🔄 Recurring Expenses</h4>
            <p>Set up your regular bills like rent, utilities, and subscriptions for automatic tracking.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">📄 Bulk Import</h4>
            <p>Upload bank statements or receipts for bulk import of transactions with smart categorization.</p>
          </div>
        </div>
      </div>

      {/* Manual Expense Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl lg:max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">Add Manual Expense</h2>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="text-gray-400 active:text-gray-600 lg:hover:text-gray-600 p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleManualSubmit} className="p-4 lg:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={manualExpense.description}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    const suggestedCategory = getSuggestedCategory(newDescription);
                    setManualExpense(prev => ({ 
                      ...prev, 
                      description: newDescription,
                      // Auto-suggest category if user hasn't manually changed it or if it's still 'Other'
                      category: prev.category === 'Other' || prev.category === getSuggestedCategory(prev.description) ? suggestedCategory : prev.category
                    }));
                  }}
                  placeholder="e.g., Tesco grocery shopping, Shell gas station, Starbucks coffee..."
                  className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm min-h-[44px]"
                  required
                />
                {manualExpense.description && getSuggestedCategory(manualExpense.description) !== 'Other' && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Suggested category: {getSuggestedCategory(manualExpense.description)}
                  </p>
                )}
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
                  className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm min-h-[44px]"
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
                  className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm min-h-[44px]"
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
                  className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base lg:text-sm min-h-[44px]"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 lg:py-2 bg-blue-600 text-white rounded-lg active:bg-blue-700 lg:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] touch-manipulation font-medium"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
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
                  disabled={uploading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                    uploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importing...
                    </div>
                  ) : (
                    `Import ${pendingTransactions.filter(t => !t.rejected).length} Transactions`
                  )}
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
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingExpense) return;
                
                try {
                  await updateTransaction(editingExpense.id, {
                    description: editingExpense.description,
                    amount: editingExpense.amount,
                    category: editingExpense.category,
                    date: editingExpense.date
                  });
                  showToast.updated('Expense');
                  setEditingExpense(null);
                } catch (error) {
                  showToast.updateFailed('expense', error instanceof Error ? error.message : undefined);
                }
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
                  onClick={async () => {
                    if (!expenseToDelete) return;
                    
                    try {
                      await deleteTransaction(expenseToDelete.id);
                      showToast.deleted('Expense');
                      setShowDeleteConfirm(false);
                      setExpenseToDelete(null);
                    } catch (error) {
                      showToast.deleteFailed('expense', error instanceof Error ? error.message : undefined);
                    }
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

      {showRecurringManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end p-4">
              <button onClick={() => setShowRecurringManagement(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <RecurringExpensesManager />
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;