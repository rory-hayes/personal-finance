import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showValidation, setShowValidation] = useState(false);

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rule = rules[fieldName];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.trim().length < rule.minLength) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.trim().length > rule.maxLength) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at most ${rule.maxLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `Please enter a valid ${fieldName}`;
      }
    }

    // Number validations
    if (typeof value === 'number' || !isNaN(parseFloat(value))) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (rule.min !== undefined && numValue < rule.min) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at most ${rule.max}`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((formData: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField]);

  const clearFieldError = useCallback((fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }));
    }
  }, [errors]);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setShowValidation(false);
  }, []);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return showValidation ? errors[fieldName] : undefined;
  }, [errors, showValidation]);

  const getFieldProps = useCallback((fieldName: string) => ({
    error: getFieldError(fieldName),
    hasError: showValidation && !!errors[fieldName],
    className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
      showValidation && errors[fieldName]
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:ring-blue-500'
    }`
  }), [errors, showValidation, getFieldError]);

  return {
    errors,
    showValidation,
    setShowValidation,
    validateForm,
    validateField,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    getFieldProps
  };
};

// Standard validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  currency: /^\d+(\.\d{0,2})?$/,
  positiveNumber: /^\d*\.?\d+$/
};

// Common validation rules
export const commonValidationRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: validationPatterns.email,
    custom: (value: string) => {
      if (!value.trim()) return 'Email address is required';
      if (!validationPatterns.email.test(value)) return 'Please enter a valid email address (e.g., user@example.com)';
      return null;
    }
  },
  password: { 
    required: true, 
    minLength: 6,
    custom: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters long for security';
      return null;
    }
  },
  positiveNumber: { 
    required: true, 
    custom: (value: string) => {
      if (!value.trim()) return 'This field is required';
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0) return 'Amount cannot be negative. Please enter a positive value.';
      if (num === 0) return 'Amount must be greater than zero';
      if (num > 1000000) return 'Amount seems unusually large. Please verify the value.';
      return null;
    }
  },
  optionalPositiveNumber: { 
    custom: (value: string) => {
      if (!value.trim()) return null;
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0) return 'Amount cannot be negative. Please enter a positive value.';
      if (num > 1000000) return 'Amount seems unusually large. Please verify the value.';
      return null;
    }
  },
  name: { 
    required: true, 
    minLength: 2, 
    maxLength: 50,
    custom: (value: string) => {
      if (!value.trim()) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters long';
      if (value.trim().length > 50) return 'Name cannot exceed 50 characters';
      if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
      return null;
    }
  },
  monthlyIncome: {
    required: true,
    custom: (value: string) => {
      if (!value.trim()) return 'Monthly income is required';
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid monthly income amount';
      if (num < 0) return 'Monthly income cannot be negative. Please enter your actual income.';
      if (num > 100000) return 'Monthly income seems unusually high. Please verify this amount.';
      return null;
    }
  },
  futureDate: {
    required: true,
    custom: (value: string) => {
      if (!value.trim()) return 'Target date is required';
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(selectedDate.getTime())) return 'Please enter a valid date';
      if (selectedDate <= today) return 'Target date must be in the future';
      
      const tenYearsFromNow = new Date();
      tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
      if (selectedDate > tenYearsFromNow) return 'Target date cannot be more than 10 years in the future';
      
      return null;
    }
  },
  budgetAmount: {
    required: true,
    custom: (value: string) => {
      if (!value.trim()) return 'Budget amount is required';
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid budget amount';
      if (num <= 0) return 'Budget amount must be greater than zero';
      if (num > 50000) return 'Monthly budget seems unusually high. Please verify this amount.';
      return null;
    }
  }
}; 