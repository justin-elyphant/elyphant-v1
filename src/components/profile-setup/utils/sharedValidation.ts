
import { formSchema, SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { ZodError } from "zod";

export const validateProfileStep = (step: number, data: Partial<SettingsFormValues>): boolean => {
  console.log(`Validating step ${step} with data:`, data);
  
  try {
    switch (step) {
      case 0: // Basic info
        return !!(data.name && data.name.trim().length >= 2 && data.email && data.email.includes('@'));
      
      case 1: // Birthday (optional during onboarding)
        return true;
      
      case 2: // Address - require at minimum city and country during onboarding
        return !!(data.address?.city && data.address?.country);
      
      case 3: // Interests
        return Array.isArray(data.interests) && data.interests.length > 0;
      
      case 4: // Data sharing
        return !!(data.data_sharing_settings && 
                 data.data_sharing_settings.dob &&
                 data.data_sharing_settings.shipping_address &&
                 data.data_sharing_settings.gift_preferences &&
                 data.data_sharing_settings.email);
      
      case 5: // Next steps (always valid)
        return true;
      
      default:
        return false;
    }
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
};

export const validateCompleteProfile = (data: SettingsFormValues): { isValid: boolean; errors: string[] } => {
  try {
    formSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
};
