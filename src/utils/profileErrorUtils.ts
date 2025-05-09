
import { toast } from "sonner";

type ProfileErrorType = 
  | 'validation' 
  | 'submission' 
  | 'network' 
  | 'auth' 
  | 'database' 
  | 'unknown';

/**
 * Categorize and handle profile-related errors in a standardized way
 */
export function handleProfileError(error: any, defaultMessage = "An error occurred"): ProfileErrorType {
  console.error("Profile error:", error);
  
  // Default error message to show to user
  let userMessage = defaultMessage;
  let errorType: ProfileErrorType = 'unknown';
  
  // Determine error type and customize message
  if (error?.message?.includes('validation')) {
    errorType = 'validation';
    userMessage = error.message || "Invalid profile data";
  } 
  else if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
    errorType = 'auth';
    userMessage = "Your session has expired. Please sign in again.";
  }
  else if (error?.code?.startsWith('PGRST') || error?.message?.includes('violates row level security policy')) {
    errorType = 'database';
    userMessage = "Database access error. Please try again later.";
  }
  else if (error?.message?.includes('network') || !navigator.onLine) {
    errorType = 'network';
    userMessage = "Network connection issue. Please check your internet connection.";
  }
  
  // Show toast notification
  toast.error("Profile update failed", {
    description: userMessage
  });
  
  return errorType;
}

/**
 * Extract field-specific validation errors from a generic error object
 */
export function extractValidationErrors(error: any): Record<string, string> {
  // Default empty errors object
  const errors: Record<string, string> = {};
  
  // Check for Zod validation errors
  if (error?.issues && Array.isArray(error.issues)) {
    error.issues.forEach((issue: any) => {
      if (issue.path && issue.path.length > 0) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      }
    });
    return errors;
  }
  
  // Check for Supabase errors with specific field details
  if (error?.details && error.details.includes(':')) {
    const parts = error.details.split(':');
    if (parts.length >= 2) {
      const field = parts[0].trim();
      const message = parts[1].trim();
      errors[field] = message;
      return errors;
    }
  }
  
  // Generic error (assign to root if we can't determine the specific field)
  errors._error = error?.message || "An unknown error occurred";
  return errors;
}

/**
 * Generate user-friendly error messages for common profile issues
 */
export function getProfileErrorMessage(errorKey: string): string {
  const errorMessages: Record<string, string> = {
    'name_required': "Please provide your name",
    'username_taken': "This username is already taken",
    'invalid_email': "Please enter a valid email address",
    'bio_too_long': "Your bio is too long, please keep it under 500 characters",
    'dob_invalid': "Please enter a valid date of birth",
    'address_incomplete': "Please complete all required address fields",
    'auth_expired': "Your session has expired. Please sign in again.",
    'network_error': "Network connection issue. Please check your internet connection.",
    'permission_denied': "You don't have permission to perform this action"
  };
  
  return errorMessages[errorKey] || "An error occurred with your profile";
}
