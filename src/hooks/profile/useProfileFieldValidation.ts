
import { useState, useCallback } from "react";

type ValidationFn = (value: any) => string | null;

/**
 * Hook for validating individual profile fields with real-time feedback
 */
export function useProfileFieldValidation(initialValue: any, validationFn?: ValidationFn) {
  const [value, setValue] = useState<any>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Default validation just checks for empty values
  const defaultValidation = useCallback((val: any): string | null => {
    if (val === null || val === undefined || val === '') {
      return "This field is required";
    }
    return null;
  }, []);
  
  // Use provided validation or default
  const validateField = validationFn || defaultValidation;
  
  const handleChange = useCallback((newValue: any) => {
    setValue(newValue);
    setIsDirty(true);
    
    // Validate and set error state
    const validationError = validateField(newValue);
    setError(validationError);
    
    return validationError === null;
  }, [validateField]);
  
  // Force validation (useful for form submission)
  const validate = useCallback(() => {
    const validationError = validateField(value);
    setError(validationError);
    setIsDirty(true);
    return validationError === null;
  }, [value, validateField]);
  
  // Reset the field
  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setIsDirty(false);
  }, [initialValue]);
  
  return {
    value,
    setValue,
    error,
    isDirty,
    handleChange,
    validate,
    reset,
    isValid: error === null
  };
}

/**
 * Common validation functions for profile fields
 */
export const validators = {
  required: (value: any) => {
    return value === null || value === undefined || value === '' 
      ? "This field is required" 
      : null;
  },
  
  email: (value: string) => {
    if (!value) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : "Please enter a valid email address";
  },
  
  minLength: (minLen: number) => (value: string) => {
    if (!value) return `Minimum length is ${minLen} characters`;
    return value.length >= minLen ? null : `Minimum length is ${minLen} characters`;
  },
  
  maxLength: (maxLen: number) => (value: string) => {
    if (!value) return null;
    return value.length <= maxLen ? null : `Maximum length is ${maxLen} characters`;
  },
  
  username: (value: string) => {
    if (!value) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    const usernameRegex = /^[a-z0-9_]+$/;
    return usernameRegex.test(value) 
      ? null 
      : "Username can only contain lowercase letters, numbers, and underscores";
  }
};
