
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';

// Define base schema for profile data validation
const profileBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Valid email is required").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional()
});

// Define shipping address schema
const shippingAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required")
}).optional();

// Define the data sharing settings schema with email field
const dataSharingSettingsSchema = z.object({
  dob: z.enum(["public", "friends", "private"]),
  shipping_address: z.enum(["public", "friends", "private"]),
  gift_preferences: z.enum(["public", "friends", "private"]),
  email: z.enum(["public", "friends", "private"])
});

// Export the full profile validation schema
export const profileValidationSchema = profileBaseSchema.extend({
  shipping_address: shippingAddressSchema,
  dob: z.string().optional(),
  birth_year: z.number().min(1900, "Birth year must be valid").max(new Date().getFullYear(), "Birth year cannot be in the future"),
  data_sharing_settings: dataSharingSettingsSchema.optional(),
  gift_preferences: z.array(z.any()).optional(),
  important_dates: z.array(z.any()).optional(),
});

export type ProfileValidationData = z.infer<typeof profileValidationSchema>;

/**
 * Hook for validating profile data before submission
 */
export function useProfileValidation() {
  // 🚨 DEPRECATED: This hook will be removed in Phase 4 data integrity unification
  // Please migrate to useUnifiedDataIntegrity from @/hooks/useUnifiedDataIntegrity
  // See DATA_INTEGRITY_MIGRATION_GUIDE.md for migration instructions
  console.warn("useProfileValidation is deprecated. Please migrate to useUnifiedDataIntegrity");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState<boolean>(false);
  
  const validateProfileData = useCallback((data: any): boolean => {
    try {
      // Clear previous errors
      setErrors({});
      
      // Parse and validate the data against our schema
      const result = profileValidationSchema.safeParse(data);
      
      if (!result.success) {
        // Format validation errors
        const formattedErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          const path = issue.path.join('.');
          formattedErrors[path] = issue.message;
        });
        
        // Set the errors state
        setErrors(formattedErrors);
        setIsValid(false);
        
        // Show toast with the first error for user feedback
        const firstError = result.error.issues[0];
        toast.error("Validation error", {
          description: firstError.message
        });
        
        return false;
      }
      
      setIsValid(true);
      return true;
    } catch (error) {
      console.error("Profile validation error:", error);
      setIsValid(false);
      toast.error("Failed to validate profile data");
      return false;
    }
  }, []);
  
  return {
    validateProfileData,
    errors,
    isValid,
    schema: profileValidationSchema
  };
}
