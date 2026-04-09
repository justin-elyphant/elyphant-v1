
import { ProfileData } from "../hooks/types";
import { SettingsFormValues } from "@/hooks/settings/settingsFormSchema";
import { convertProfileDataToSettingsForm, validateDataStructureCompatibility } from "./dataStructureValidator";


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
    date_of_birth: new Date(1990, 0, 15), // Use full Date object
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
    const requiredFields = ['first_name', 'last_name', 'email', 'address'];
    const missingFields = requiredFields.filter(field => !settingsData[field as keyof SettingsFormValues]);
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return { success: false, errors: [`Missing fields: ${missingFields.join(', ')}`] };
    }

    console.log("✅ All compatibility tests passed!");
    console.log("4. Final settings data structure:", {
      hasFirstName: !!settingsData.first_name,
      hasLastName: !!settingsData.last_name,
      hasEmail: !!settingsData.email,
      hasAddress: !!settingsData.address,
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
