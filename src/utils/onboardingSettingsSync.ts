
import { supabase } from "@/integrations/supabase/client";
import { mapDatabaseToSettingsForm } from "./dataFormatUtils";

/**
 * Test function to verify onboarding data syncs to settings
 */
export const testOnboardingSettingsSync = async (userId: string) => {
  console.log("=== Testing Onboarding → Settings Data Sync ===");
  
  try {
    // Fetch the user's profile from the database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("❌ Failed to fetch profile:", error);
      return { success: false, error: error.message };
    }

    if (!profile) {
      console.error("❌ No profile found for user");
      return { success: false, error: "No profile found" };
    }

    console.log("✅ Profile found in database:", profile);

    // Test the mapping to settings format
    const settingsData = mapDatabaseToSettingsForm(profile as any);
    
    if (!settingsData) {
      console.error("❌ Failed to map profile to settings format");
      return { success: false, error: "Mapping failed" };
    }

    console.log("✅ Successfully mapped to settings format:", settingsData);

    // Verify required fields are present
    const requiredFields = ['name', 'email', 'address'];
    const missingFields = requiredFields.filter(field => !settingsData[field as keyof typeof settingsData]);
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return { success: false, error: `Missing fields: ${missingFields.join(', ')}` };
    }

    console.log("✅ All required fields present");
    console.log("🎉 Onboarding → Settings sync test PASSED!");

    return { 
      success: true, 
      profile, 
      settingsData,
      summary: {
        hasName: !!settingsData.name,
        hasEmail: !!settingsData.email,
        hasBio: !!settingsData.bio,
        hasBirthday: !!settingsData.date_of_birth,
        hasAddress: !!settingsData.address && Object.keys(settingsData.address).length > 0,
        hasInterests: settingsData.interests.length > 0,
        hasImportantDates: settingsData.importantDates.length > 0,
      }
    };

  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testOnboardingSettingsSync = testOnboardingSettingsSync;
}
