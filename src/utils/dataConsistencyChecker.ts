
import { Profile } from "@/types/profile";

/**
 * Validates profile data and fixes inconsistencies.
 * NOTE: data_sharing_settings is deprecated — privacy now lives in privacy_settings table.
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
