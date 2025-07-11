/**
 * Date of Birth validation utilities
 * Provides consistent DOB validation across the application
 */

export interface DOBValidationResult {
  isValid: boolean;
  hasFullDate: boolean;
  hasBirthYear: boolean;
  errors: string[];
}

/**
 * Validates a complete date of birth
 * @param dob - Date string in YYYY-MM-DD format
 * @param birthYear - Birth year as number
 * @returns Validation result with detailed feedback
 */
export function validateDOB(dob?: string | null, birthYear?: number | null): DOBValidationResult {
  const errors: string[] = [];
  let hasFullDate = false;
  let hasBirthYear = false;

  // Check birth year
  if (birthYear && birthYear >= 1900 && birthYear <= new Date().getFullYear()) {
    hasBirthYear = true;
  } else {
    errors.push('Valid birth year is required');
  }

  // Check full date
  if (dob && typeof dob === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dob)) {
      const date = new Date(dob);
      const year = date.getFullYear();
      
      // Validate the date is real and reasonable
      if (!isNaN(date.getTime()) && 
          year >= 1900 && 
          year <= new Date().getFullYear() &&
          date.toISOString().startsWith(dob)) {
        hasFullDate = true;
      } else {
        errors.push('Date of birth must be a valid date');
      }
    } else {
      errors.push('Date of birth must be in YYYY-MM-DD format');
    }
  } else {
    errors.push('Full date of birth is required');
  }

  // Cross-validate birth year with full date
  if (hasFullDate && hasBirthYear && dob) {
    const dateYear = new Date(dob).getFullYear();
    if (dateYear !== birthYear) {
      errors.push('Birth year must match the year in date of birth');
    }
  }

  return {
    isValid: errors.length === 0,
    hasFullDate,
    hasBirthYear,
    errors
  };
}

/**
 * Extracts birth year from a date string
 * @param dob - Date string in YYYY-MM-DD format
 * @returns Birth year as number or null if invalid
 */
export function extractBirthYear(dob?: string | null): number | null {
  if (!dob || typeof dob !== 'string') return null;
  
  const date = new Date(dob);
  if (isNaN(date.getTime())) return null;
  
  const year = date.getFullYear();
  return (year >= 1900 && year <= new Date().getFullYear()) ? year : null;
}

/**
 * Checks if user has complete DOB data for mandatory profile requirements
 * @param profile - User profile object
 * @returns True if both DOB and birth year are valid
 */
export function hasCompleteDOB(profile: { dob?: string | null; birth_year?: number | null }): boolean {
  const validation = validateDOB(profile.dob, profile.birth_year);
  return validation.isValid;
}