
import { Profile } from "@/types/profile";
import { normalizeDataSharingSettings } from "@/utils/privacyUtils";
import { toast } from "sonner";

// Check if a profile has all required fields properly initialized
export function checkProfileConsistency(profile: Profile | null): { 
  isValid: boolean; 
  missingFields: string[]; 
  recommendations: string[] 
} {
  const missingFields: string[] = [];
  const recommendations: string[] = [];
  
  if (!profile) {
    return {
      isValid: false,
      missingFields: ["profile"],
      recommendations: ["User not authenticated or profile not loaded"]
    };
  }
  
  // Check required fields
  if (!profile.id) missingFields.push("id");
  if (!profile.name) missingFields.push("name");
  if (!profile.email) missingFields.push("email");
  if (!profile.username) missingFields.push("username");
  
  // Check data structure fields
  if (!profile.shipping_address) {
    missingFields.push("shipping_address");
    recommendations.push("Initialize shipping_address to empty object");
  }
  
  if (!Array.isArray(profile.gift_preferences)) {
    missingFields.push("gift_preferences");
    recommendations.push("Initialize gift_preferences to empty array");
  }
  
  if (!Array.isArray(profile.important_dates)) {
    missingFields.push("important_dates");
    recommendations.push("Initialize important_dates to empty array");
  }
  
  // Check data sharing settings
  if (!profile.data_sharing_settings) {
    missingFields.push("data_sharing_settings");
    recommendations.push("Initialize data_sharing_settings with defaults");
  } else {
    // Check if data sharing settings have all required fields
    const settings = profile.data_sharing_settings;
    const requiredFields = ['dob', 'shipping_address', 'gift_preferences', 'email'];
    const missingSettings = requiredFields.filter(field => !settings[field as keyof typeof settings]);
    
    if (missingSettings.length > 0) {
      missingFields.push(`data_sharing_settings: ${missingSettings.join(', ')}`);
      recommendations.push("Normalize data sharing settings using normalizeDataSharingSettings");
    }
    
    // Ensure email is always private
    if (settings.email !== 'private') {
      recommendations.push("Enforce email privacy to 'private'");
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    recommendations
  };
}

// Run a profile consistency check and fix issues automatically if requested
export async function validateAndFixProfile(
  profile: Profile | null, 
  updateProfileFn?: (data: Partial<Profile>) => Promise<any>,
  autoFix: boolean = false
): Promise<boolean> {
  const result = checkProfileConsistency(profile);
  
  console.log("Profile consistency check:", result);
  
  if (!result.isValid) {
    // Log issues
    console.warn("Profile data inconsistency detected:", {
      missing: result.missingFields,
      recommendations: result.recommendations
    });
    
    // Try to fix issues if requested and update function is available
    if (autoFix && updateProfileFn && profile) {
      try {
        const updates: Partial<Profile> = {};
        
        // Fix shipping address
        if (!profile.shipping_address) {
          updates.shipping_address = {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          };
        }
        
        // Fix gift preferences
        if (!Array.isArray(profile.gift_preferences)) {
          updates.gift_preferences = [];
        }
        
        // Fix important dates
        if (!Array.isArray(profile.important_dates)) {
          updates.important_dates = [];
        }
        
        // Fix data sharing settings
        if (!profile.data_sharing_settings || 
            Object.keys(profile.data_sharing_settings).length < 4) {
          updates.data_sharing_settings = normalizeDataSharingSettings(profile.data_sharing_settings);
        }
        
        // Update profile if there are changes to make
        if (Object.keys(updates).length > 0) {
          console.log("Attempting to fix profile inconsistencies:", updates);
          await updateProfileFn(updates);
          toast.success("Profile data has been optimized");
          return true;
        }
      } catch (error) {
        console.error("Failed to fix profile inconsistencies:", error);
        return false;
      }
    }
    
    return false;
  }
  
  return true;
}
