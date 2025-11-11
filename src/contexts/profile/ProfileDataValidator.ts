import { Profile } from "@/types/supabase";
import { z } from "zod";

// Enhanced validation schema for profile data
const profileValidationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  first_name: z.string().min(1, "First name is required").max(100, "First name too long"),
  last_name: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  username: z.string().min(1, "Username is required").max(50, "Username too long"),
  bio: z.string().max(500, "Bio too long").nullable().optional(),
  profile_image: z.string().url().nullable().optional().or(z.literal(null)),
  dob: z.string().regex(/^\d{2}-\d{2}$/, "Invalid date format (MM-DD)").nullable().optional(),
  birth_year: z.number().min(1900, "Birth year must be valid").max(new Date().getFullYear(), "Birth year cannot be in the future"),
  shipping_address: z.object({
    address_line1: z.string().max(255, "Address too long").optional(),
    address_line2: z.string().max(255, "Address too long").optional(),
    city: z.string().max(100, "City name too long").optional(),
    state: z.string().max(100, "State name too long").optional(),
    zip_code: z.string().max(20, "ZIP code too long").optional(),
    country: z.string().max(100, "Country name too long").optional(),
    is_default: z.boolean().optional(),
    street: z.string().max(255, "Street too long").optional(),
    zipCode: z.string().max(20, "ZIP code too long").optional()
  }).nullable().optional(),
  // Address verification fields
  address_verified: z.boolean().optional(),
  address_verification_method: z.enum(['automatic', 'user_confirmed', 'pending_verification', 'profile_setup']).optional(),
  address_verified_at: z.string().datetime().nullable().optional(),
  address_last_updated: z.string().datetime().nullable().optional(),
  interests: z.array(z.string().max(50, "Interest name too long")).optional(),
  gift_preferences: z.array(z.object({
    category: z.string().max(50, "Category name too long"),
    importance: z.enum(['low', 'medium', 'high']).optional()
  })).optional().or(z.any()),
  important_dates: z.array(z.object({
    id: z.string().optional(),
    title: z.string().max(100, "Title too long"),
    date: z.string(),
    type: z.string().max(50, "Type too long"),
    reminder_days: z.number().min(0).max(365).optional(),
    description: z.string().max(255, "Description too long").optional()
  })).optional().or(z.any()),
  data_sharing_settings: z.object({
    dob: z.enum(['private', 'friends', 'public']).optional(),
    shipping_address: z.enum(['private', 'friends', 'public']).optional(),
    gift_preferences: z.enum(['private', 'friends', 'public']).optional(),
    email: z.enum(['private', 'friends', 'public']).optional()
  }).optional().or(z.any()),
  onboarding_completed: z.boolean().optional(),
  user_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Add flexible fields for backward compatibility
  ai_interaction_data: z.any().optional(),
  gift_giving_preferences: z.any().optional(),
  gifting_history: z.any().optional(),
  recently_viewed: z.any().optional(),
  wishlists: z.any().optional()
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: Partial<Profile>;
}

export class ProfileDataValidator {
  /**
   * Validates and sanitizes profile data
   */
  static validate(data: Partial<Profile>): ValidationResult {
    try {
      // Pre-validation sanitization
      const sanitized = this.sanitizeData(data);
      
      // Validate with Zod schema
      const result = profileValidationSchema.partial().safeParse(sanitized);
      
      if (result.success) {
        return {
          isValid: true,
          errors: [],
          sanitizedData: result.data as Partial<Profile>
        };
      } else {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        return {
          isValid: false,
          errors,
          sanitizedData: sanitized
        };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        sanitizedData: data
      };
    }
  }

  /**
   * Validates critical fields required for core functionality
   */
  static validateCriticalFields(data: Partial<Profile>): ValidationResult {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push("Name is required");
    }
    
    if (!data.email || !data.email.includes('@')) {
      errors.push("Valid email is required");
    }
    
    if (data.username && data.username.length > 0 && data.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: data
    };
  }

  /**
   * Sanitizes data to ensure type safety and remove harmful content
   */
  private static sanitizeData(data: Partial<Profile>): Partial<Profile> {
    const sanitized = { ...data } as any;

    // Sanitize strings
    if (sanitized.name) {
      sanitized.name = this.sanitizeString(sanitized.name);
    }
    
    if (sanitized.first_name) {
      sanitized.first_name = this.sanitizeString(sanitized.first_name);
    }
    
    if (sanitized.last_name) {
      sanitized.last_name = this.sanitizeString(sanitized.last_name);
    }
    
    if (sanitized.username) {
      sanitized.username = this.sanitizeUsername(sanitized.username);
    }
    
    if (sanitized.bio) {
      sanitized.bio = this.sanitizeString(sanitized.bio);
    }

    // Ensure arrays are properly formatted
    if (sanitized.interests && !Array.isArray(sanitized.interests)) {
      sanitized.interests = [];
    }

    if (sanitized.gift_preferences && !Array.isArray(sanitized.gift_preferences)) {
      sanitized.gift_preferences = [];
    }

    if (sanitized.important_dates && !Array.isArray(sanitized.important_dates)) {
      sanitized.important_dates = [];
    }

    // Sanitize shipping address
    if (sanitized.shipping_address && typeof sanitized.shipping_address === 'object') {
      Object.keys(sanitized.shipping_address).forEach(key => {
        const value = (sanitized.shipping_address as any)[key];
        if (typeof value === 'string') {
          (sanitized.shipping_address as any)[key] = this.sanitizeString(value);
        }
      });
    }

    return sanitized;
  }

  /**
   * Basic string sanitization
   */
  private static sanitizeString(str: string): string {
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000); // Prevent extremely long strings
  }

  /**
   * Username-specific sanitization
   */
  private static sanitizeUsername(username: string): string {
    return username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '') // Only allow alphanumeric, underscore, and dash
      .slice(0, 50);
  }

  /**
   * Real-time validation for forms
   */
  static validateField(fieldName: string, value: any): { isValid: boolean; error?: string } {
    try {
      const schema = profileValidationSchema.shape[fieldName as keyof typeof profileValidationSchema.shape];
      
      if (!schema) {
        return { isValid: true }; // Unknown field, let it pass
      }

      const result = schema.safeParse(value);
      
      if (result.success) {
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error: result.error.errors[0]?.message || 'Invalid value'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Validation error'
      };
    }
  }
}