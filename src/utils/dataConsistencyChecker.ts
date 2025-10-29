
import { Profile } from "@/types/profile";

/**
 * Validates profile data and fixes inconsistencies
 * @param profile The profile to validate
 * @param updateCallback Optional callback to update the profile if fixes are needed
 * @param autoFix Whether to automatically fix issues
 * @returns Boolean indicating if the profile is valid
 */
export async function validateAndFixProfile(
  profile: Profile | null, 
  updateCallback?: (data: Partial<Profile>) => Promise<any>,
  autoFix: boolean = false
): Promise<boolean> {
  if (!profile) return false;
  
  let needsFixes = false;
  const fixes: Partial<Profile> = {};
  
  // Check required fields
  if (!profile.name) {
    console.log("Profile missing name");
    needsFixes = true;
    if (autoFix) fixes.name = "User";
  }
  
  // Check shipping address structure
  if (profile.shipping_address) {
    const address = profile.shipping_address;
    
    // Make sure we're using the standardized field names
    if ((address as any).street && !address.address_line1) {
      fixes.shipping_address = {
        ...address,
        address_line1: (address as any).street
      };
      needsFixes = true;
    }
    
    if ((address as any).zipCode && !address.zip_code) {
      fixes.shipping_address = {
        ...(fixes.shipping_address || address),
        zip_code: (address as any).zipCode
      };
      needsFixes = true;
    }
  }
  
  // Check gift preferences
  if (!Array.isArray(profile.gift_preferences) || profile.gift_preferences.length === 0) {
    fixes.gift_preferences = [];
    needsFixes = true;
  }
  
  // Check data_sharing_settings
  if (!profile.data_sharing_settings || !profile.data_sharing_settings.email) {
    fixes.data_sharing_settings = {
      ...(profile.data_sharing_settings || {}),
      dob: profile.data_sharing_settings?.dob || 'private',
      shipping_address: profile.data_sharing_settings?.shipping_address || 'private',
      interests: profile.data_sharing_settings?.interests || profile.data_sharing_settings?.gift_preferences || 'public',
      gift_preferences: profile.data_sharing_settings?.gift_preferences || profile.data_sharing_settings?.interests || 'public',
      email: 'private'
    };
    needsFixes = true;
  }
  
  // If there are fixes and we have an update callback and autoFix is true, apply them
  if (needsFixes && autoFix && updateCallback) {
    try {
      await updateCallback(fixes);
      console.log("Auto-fixed profile inconsistencies:", fixes);
      return true;
    } catch (error) {
      console.error("Failed to auto-fix profile:", error);
      return false;
    }
  }
  
  return !needsFixes;
}
