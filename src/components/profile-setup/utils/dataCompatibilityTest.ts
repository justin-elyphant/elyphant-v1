
import { ProfileData } from "../hooks/types";
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { convertProfileDataToSettingsForm, validateDataStructureCompatibility } from "./dataStructureValidator";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

/**
 * Test function to validate complete data flow from onboarding to settings
 */
export const testOnboardingToSettingsCompatibility = () => {
  console.log("=== Testing Onboarding to Settings Data Flow ===");
  
  // Create mock onboarding data (similar to what would be created during profile setup)
  const mockOnboardingData: ProfileData = {
    name: "John Doe",
    email: "john@example.com",
    bio: "Test bio",
    profile_image: null,
    birthday: { month: 1, day: 15 }, // Use new month/day format
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US"
    },
    interests: ["books", "movies", "travel"],
    importantDates: [
      {
        date: new Date("2024-12-25"),
        description: "Christmas"
      }
    ],
    data_sharing_settings: getDefaultDataSharingSettings(),
    next_steps_option: "dashboard"
  };

  console.log("1. Mock onboarding data:", mockOnboardingData);

  // Test data structure validation
  const validation = validateDataStructureCompatibility(mockOnboardingData);
  console.log("2. Data structure validation:", validation);

  if (!validation.isValid) {
    console.error("❌ Validation failed:", validation.errors);
    return { success: false, errors: validation.errors };
  }

  // Test conversion to settings format
  try {
    const settingsData: SettingsFormValues = convertProfileDataToSettingsForm(mockOnboardingData);
    console.log("3. Converted to settings format:", settingsData);

    // Verify all required fields are present
    const requiredFields = ['name', 'email', 'address', 'data_sharing_settings'];
    const missingFields = requiredFields.filter(field => !settingsData[field as keyof SettingsFormValues]);
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return { success: false, errors: [`Missing fields: ${missingFields.join(', ')}`] };
    }

    // Verify data_sharing_settings has all required fields including email
    const requiredPrivacyFields = ['dob', 'shipping_address', 'gift_preferences', 'email'];
    const missingPrivacyFields = requiredPrivacyFields.filter(field => 
      !settingsData.data_sharing_settings[field as keyof typeof settingsData.data_sharing_settings]
    );

    if (missingPrivacyFields.length > 0) {
      console.error("❌ Missing privacy fields:", missingPrivacyFields);
      return { success: false, errors: [`Missing privacy fields: ${missingPrivacyFields.join(', ')}`] };
    }

    console.log("✅ All compatibility tests passed!");
    console.log("4. Final settings data structure:", {
      hasName: !!settingsData.name,
      hasEmail: !!settingsData.email,
      hasAddress: !!settingsData.address,
      hasDataSharingSettings: !!settingsData.data_sharing_settings,
      dataSharingFields: Object.keys(settingsData.data_sharing_settings),
      interestsCount: settingsData.interests.length,
      importantDatesCount: settingsData.importantDates.length
    });

    return { 
      success: true, 
      onboardingData: mockOnboardingData,
      settingsData,
      validation 
    };

  } catch (error) {
    console.error("❌ Conversion failed:", error);
    return { success: false, errors: [error instanceof Error ? error.message : 'Unknown conversion error'] };
  }
};

/**
 * Test function to be called from browser console for debugging
 */
export const runCompatibilityTest = () => {
  const result = testOnboardingToSettingsCompatibility();
  
  if (result.success) {
    console.log("🎉 Onboarding to Settings compatibility test PASSED!");
  } else {
    console.error("💥 Onboarding to Settings compatibility test FAILED!");
    console.error("Errors:", result.errors);
  }
  
  return result;
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testOnboardingSettingsCompatibility = runCompatibilityTest;
}
