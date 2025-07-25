/**
 * Date utilities to ensure consistent date handling across the application
 * and prevent off-by-one errors common with timezone conversions
 */

/**
 * Get today's date in YYYY-MM-DD format (local timezone, no time component)
 */
export const getTodayDateString = (): string => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
};

/**
 * Convert any date to YYYY-MM-DD format (local timezone, no time component)
 */
export const toDateString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
};

/**
 * Create a Date object from YYYY-MM-DD string (local timezone, noon)
 * This prevents issues with daylight saving time changes
 */
export const fromDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0); // Set to noon to avoid DST issues
};

/**
 * Calculate the difference in months between two dates (more accurate than day-based calculation)
 */
export const getMonthsDifference = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? fromDateString(startDate) : startDate;
  const end = typeof endDate === 'string' ? fromDateString(endDate) : endDate;
  
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
};

/**
 * Calculate months from today to a target date
 */
export const getMonthsUntilDate = (targetDate: Date | string): number => {
  const today = new Date();
  const target = typeof targetDate === 'string' ? fromDateString(targetDate) : targetDate;
  
  return Math.max(0, getMonthsDifference(today, target));
};

/**
 * Calculate days between two dates (no timezone issues)
 */
export const getDaysDifference = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? fromDateString(startDate) : startDate;
  const end = typeof endDate === 'string' ? fromDateString(endDate) : endDate;
  
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Get a formatted date string for display (consistent across browsers)
 */
export const formatDisplayDate = (date: Date | string, options?: {
  includeYear?: boolean;
  shortMonth?: boolean;
}): string => {
  const d = typeof date === 'string' ? fromDateString(date) : date;
  const { includeYear = true, shortMonth = false } = options || {};
  
  const monthFormat = shortMonth ? 'short' : 'long';
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: monthFormat,
    day: 'numeric'
  };
  
  if (includeYear) {
    dateOptions.year = 'numeric';
  }
  
  return d.toLocaleDateString('en-US', dateOptions);
};

/**
 * Get relative date string (e.g., "2 days ago", "Today", "In 3 weeks")
 */
export const getRelativeDateString = (date: Date | string): string => {
  const targetDate = typeof date === 'string' ? fromDateString(date) : date;
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon for comparison
  
  const diffInMs = targetDate.getTime() - today.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays > 0 && diffInDays <= 7) return `In ${diffInDays} days`;
  if (diffInDays < 0 && diffInDays >= -7) return `${Math.abs(diffInDays)} days ago`;
  if (diffInDays > 7 && diffInDays <= 30) return `In ${Math.ceil(diffInDays / 7)} weeks`;
  if (diffInDays < -7 && diffInDays >= -30) return `${Math.ceil(Math.abs(diffInDays) / 7)} weeks ago`;
  if (diffInDays > 30 && diffInDays <= 365) return `In ${Math.ceil(diffInDays / 30)} months`;
  if (diffInDays < -30 && diffInDays >= -365) return `${Math.ceil(Math.abs(diffInDays) / 30)} months ago`;
  
  return formatDisplayDate(targetDate);
};

/**
 * Get the last day of a given month (handles month-end correctly)
 */
export const getLastDayOfMonth = (year: number, month: number): Date => {
  return new Date(year, month, 0, 12, 0, 0, 0); // Day 0 = last day of previous month
};

/**
 * Check if a date string represents the last day of its month
 */
export const isLastDayOfMonth = (dateString: string): boolean => {
  const date = fromDateString(dateString);
  const lastDay = getLastDayOfMonth(date.getFullYear(), date.getMonth() + 1);
  return date.getDate() === lastDay.getDate();
};

/**
 * Add months to a date (handles month boundaries correctly)
 */
export const addMonths = (date: Date | string, months: number): Date => {
  const d = typeof date === 'string' ? fromDateString(date) : new Date(date);
  const result = new Date(d.getFullYear(), d.getMonth() + months, d.getDate(), 12, 0, 0, 0);
  
  // Handle cases where the day doesn't exist in the target month (e.g., Jan 31 + 1 month)
  if (result.getDate() !== d.getDate()) {
    result.setDate(0); // Set to last day of previous month
  }
  
  return result;
};

/**
 * Get month/year string for grouping (e.g., "2024-01")
 */
export const getMonthKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? fromDateString(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Parse various date formats and normalize to YYYY-MM-DD
 * (Enhanced version of the fileParser date logic)
 */
export const parseAndNormalizeDate = (dateInput: string | Date): string => {
  if (dateInput instanceof Date) {
    return toDateString(dateInput);
  }
  
  if (!dateInput || typeof dateInput !== 'string') {
    return getTodayDateString();
  }
  
  // If already in YYYY-MM-DD format, validate and return
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const date = fromDateString(dateInput);
    if (!isNaN(date.getTime())) {
      return dateInput;
    }
  }
  
  // Try to parse and convert to standard format
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return toDateString(parsed);
  }
  
  // Fallback to today
  return getTodayDateString();
};

/**
 * Check if a date is within a specific range
 */
export const isDateInRange = (
  date: Date | string, 
  startDate: Date | string, 
  endDate: Date | string
): boolean => {
  const d = typeof date === 'string' ? fromDateString(date) : date;
  const start = typeof startDate === 'string' ? fromDateString(startDate) : startDate;
  const end = typeof endDate === 'string' ? fromDateString(endDate) : endDate;
  
  return d >= start && d <= end;
};

/**
 * Get date ranges for common filters
 */
export const getDateRange = (period: 'today' | 'week' | 'month' | 'quarter' | 'year'): {
  start: string;
  end: string;
} => {
  const today = new Date();
  const todayStr = getTodayDateString();
  
  switch (period) {
    case 'today':
      return { start: todayStr, end: todayStr };
      
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6); // 7 days including today
      return { start: toDateString(weekStart), end: todayStr };
    }
    
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
      return { start: toDateString(monthStart), end: todayStr };
    }
    
    case 'quarter': {
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1, 12, 0, 0, 0);
      return { start: toDateString(quarterStart), end: todayStr };
    }
    
    case 'year': {
      const yearStart = new Date(today.getFullYear(), 0, 1, 12, 0, 0, 0);
      return { start: toDateString(yearStart), end: todayStr };
    }
    
    default:
      return { start: todayStr, end: todayStr };
  }
}; 