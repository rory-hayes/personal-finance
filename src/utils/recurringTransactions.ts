import { Transaction } from '../types';
import { getTodayDateString, addMonths, toDateString } from './dateUtils';

export interface RecurringTransaction {
  id: string;
  template: Omit<Transaction, 'id' | 'date'>;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastProcessed?: string;
  isActive: boolean;
  nextDueDate: string;
}

/**
 * Calculate the next due date for a recurring transaction
 */
export const getNextDueDate = (recurring: RecurringTransaction): string => {
  const lastDate = recurring.lastProcessed || recurring.startDate;
  const date = new Date(lastDate);
  
  switch (recurring.frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      return toDateString(addMonths(date, 1));
    case 'quarterly':
      return toDateString(addMonths(date, 3));
    case 'yearly':
      return toDateString(addMonths(date, 12));
    default:
      return toDateString(addMonths(date, 1));
  }
  
  return toDateString(date);
};

/**
 * Check if a recurring transaction is due for processing
 */
export const isRecurringTransactionDue = (recurring: RecurringTransaction): boolean => {
  if (!recurring.isActive) return false;
  
  const today = getTodayDateString();
  const nextDue = recurring.nextDueDate || getNextDueDate(recurring);
  
  // Check if end date has passed
  if (recurring.endDate && today > recurring.endDate) {
    return false;
  }
  
  return today >= nextDue;
};

/**
 * Create a transaction from a recurring template
 */
export const createTransactionFromRecurring = (
  recurring: RecurringTransaction,
  date: string = getTodayDateString()
): Transaction => {
  return {
    ...recurring.template,
    id: `recurring-${recurring.id}-${date}-${Date.now()}`,
    date: date,
  };
};

/**
 * Process all due recurring transactions
 */
export const processDueRecurringTransactions = (
  recurringTransactions: RecurringTransaction[],
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>
): { processed: Transaction[], updated: RecurringTransaction[] } => {
  const today = getTodayDateString();
  const processedTransactions: Transaction[] = [];
  const updatedRecurring: RecurringTransaction[] = [];

  recurringTransactions.forEach(recurring => {
    if (isRecurringTransactionDue(recurring)) {
      try {
        // Create the transaction
        const transaction = createTransactionFromRecurring(recurring, today);
        
        // Add to processed list (the actual adding will be done by the caller)
        processedTransactions.push(transaction);
        
        // Update the recurring transaction
        const updatedRecurringTx: RecurringTransaction = {
          ...recurring,
          lastProcessed: today,
          nextDueDate: getNextDueDate({
            ...recurring,
            lastProcessed: today
          })
        };
        
        updatedRecurring.push(updatedRecurringTx);
        
        console.log(`📅 Processed recurring transaction: ${transaction.description} (${transaction.amount})`);
      } catch (error) {
        console.error(`❌ Failed to process recurring transaction ${recurring.id}:`, error);
      }
    } else {
      // Keep the recurring transaction unchanged
      updatedRecurring.push(recurring);
    }
  });

  return { processed: processedTransactions, updated: updatedRecurring };
};

/**
 * Get a user-friendly description of the recurring frequency
 */
export const getFrequencyDescription = (frequency: RecurringTransaction['frequency']): string => {
  switch (frequency) {
    case 'weekly':
      return 'Every week';
    case 'monthly':
      return 'Every month';
    case 'quarterly':
      return 'Every 3 months';
    case 'yearly':
      return 'Every year';
    default:
      return 'Monthly';
  }
};

/**
 * Validate a recurring transaction before saving
 */
export const validateRecurringTransaction = (recurring: Partial<RecurringTransaction>): string[] => {
  const errors: string[] = [];
  
  if (!recurring.template?.description?.trim()) {
    errors.push('Description is required');
  }
  
  if (!recurring.template?.amount || isNaN(recurring.template.amount)) {
    errors.push('Valid amount is required');
  }
  
  if (!recurring.template?.category?.trim()) {
    errors.push('Category is required');
  }
  
  if (!recurring.frequency) {
    errors.push('Frequency is required');
  }
  
  if (!recurring.startDate) {
    errors.push('Start date is required');
  } else if (recurring.startDate < getTodayDateString()) {
    errors.push('Start date cannot be in the past');
  }
  
  if (recurring.endDate && recurring.startDate && recurring.endDate <= recurring.startDate) {
    errors.push('End date must be after start date');
  }
  
  return errors;
};

/**
 * Local storage key for recurring transactions
 */
const STORAGE_KEY = 'budgettracker_recurring_transactions';

/**
 * Save recurring transactions to local storage
 */
export const saveRecurringTransactions = (recurringTransactions: RecurringTransaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringTransactions));
  } catch (error) {
    console.error('Failed to save recurring transactions:', error);
  }
};

/**
 * Load recurring transactions from local storage
 */
export const loadRecurringTransactions = (): RecurringTransaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load recurring transactions:', error);
  }
  return [];
};

/**
 * Set up automatic recurring transaction processing
 * Returns a cleanup function to stop the interval
 */
export const setupRecurringTransactionProcessor = (
  onProcessTransactions: () => void,
  intervalMinutes: number = 60 // Check every hour by default
): (() => void) => {
  // Run immediately on setup
  onProcessTransactions();
  
  // Set up interval to check periodically
  const intervalId = setInterval(onProcessTransactions, intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}; 