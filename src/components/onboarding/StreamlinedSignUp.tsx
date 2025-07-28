import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { unifiedProfileService } from "@/services/profiles/UnifiedProfileService";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { toast } from "sonner";
// Legacy modal removed - using Nicole unified interface
import { parseBirthdayFromFormData } from "@/utils/dataFormatUtils";
import { supabase } from "@/integrations/supabase/client";

// Define custom FormData interface to avoid conflict with browser FormData
interface OnboardingFormData {
  firstName: string;
  lastName: string;
  birthday: { month: string; day: string };
  address: any;
  interests: string[];
}

interface StreamlinedSignUpProps {
  onComplete?: () => void;
  showModal?: boolean;
}

const StreamlinedSignUp: React.FC<StreamlinedSignUpProps> = ({ 
  onComplete, 
  showModal = true 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchProfile } = useProfile();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: "",
    lastName: "",
    birthday: { month: "", day: "" },
    address: null,
    interests: []
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("🔄 StreamlinedSignUp initialized with user:", user?.id);
  console.log("🔄 Initial form data:", formData);

  useEffect(() => {
    if (!user) {
      console.warn("❌ No user found, redirecting to signin");
      navigate("/signin");
    }
  }, [user, navigate]);

  const updateFormData = (updates: Partial<OnboardingFormData>) => {
    console.log("📝 Updating form data:", updates);
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      console.log("📝 New form data state:", newData);
      return newData;
    });
  };

  const handleNext = () => {
    console.log(`➡️ Moving from step ${currentStep} to ${currentStep + 1}`);
    console.log("📊 Current form data before next:", formData);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    console.log(`⬅️ Moving from step ${currentStep} to ${currentStep - 1}`);
    setCurrentStep(prev => prev - 1);
  };

  const handleFormComplete = () => {
    console.log("✅ Form completed, showing intent modal");
    console.log("📊 Final form data:", formData);
    
    // Validate required fields
    const missingFields = [];
    if (!formData.firstName.trim()) missingFields.push("firstName");
    if (!formData.lastName.trim()) missingFields.push("lastName");
    
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      toast.error(`Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Legacy modal removed - Nicole handles intent selection now
  };

  const handleIntentSelection = async (intent: "quick-gift" | "browse-shop" | "create-wishlist") => {
    if (!user) {
      console.error("❌ No user available for intent selection");
      toast.error("Authentication error. Please try signing in again.");
      return;
    }

    console.log("🎯 Intent selected:", intent);
    console.log("📊 Form data to save:", JSON.stringify(formData, null, 2));
    
    setIsSubmitting(true);
    
    try {
      // Parse birthday data
      const parsedBirthday = parseBirthdayFromFormData(formData.birthday);
      console.log("📅 Parsed birthday:", parsedBirthday);

      // Prepare enhanced profile data with consistent field names
      const enhancedProfileData = {
        // Use consistent field names that match ProfileCreationService interface
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: `user_${user.id.substring(0, 8)}`,
        email: user.email || "",
        
        // Birthday data in new format
        dob: parsedBirthday.dob,
        birth_year: parsedBirthday.birth_year,
        
        // Address data - ensure proper structure
        shipping_address: formData.address ? {
          address_line1: formData.address.street || "",
          city: formData.address.city || "",
          state: formData.address.state || "",
          zip_code: formData.address.zipCode || "",
          country: formData.address.country || "US",
          // Keep aliases for compatibility
          street: formData.address.street || "",
          zipCode: formData.address.zipCode || ""
        } : {},
        
        // Interests as gift preferences
        interests: formData.interests || [],
        gift_preferences: (formData.interests || []).map(interest => ({
          category: interest,
          importance: "medium"
        })),
        
        // Profile type based on intent
        profile_type: intent === "create-wishlist" ? "giftee" : "giftor",
        
        // Mark onboarding as complete
        onboarding_completed: true
      };

      console.log("💾 Enhanced profile data to save:", JSON.stringify(enhancedProfileData, null, 2));

      // Save profile using ProfileCreationService
      console.log("🔄 Calling ProfileCreationService.createEnhancedProfile...");
      const result = await unifiedProfileService.createEnhancedProfile(
        user.id,
        enhancedProfileData
      );

      console.log("💾 Profile creation result:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to save profile data");
      }

      // Store intent context
      console.log("🎯 Storing intent context:", intent);
      LocalStorageService.setNicoleContext({
        selectedIntent: intent,
        source: 'streamlined_signup'
      });

      // Enhanced verification with comprehensive logging
      console.log("🔍 Verifying profile data was saved...");
      
      // First, refresh the profile context
      console.log("🔄 Refreshing profile context...");
      await refetchProfile();
      
      // Then verify directly from database
      const { data: savedProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        console.error("❌ Profile verification failed:", verifyError);
        throw new Error("Profile verification failed");
      }

      console.log("✅ Profile successfully verified from database:", savedProfile);
      
      // Check if critical fields are present
      if (!savedProfile.first_name || !savedProfile.last_name || !savedProfile.email) {
        console.error("❌ Critical profile fields missing:", { 
          first_name: savedProfile.first_name, 
          last_name: savedProfile.last_name, 
          email: savedProfile.email 
        });
        throw new Error("Critical profile data missing after save");
      }

      // Verify new fields were saved correctly
      console.log("🔍 Verifying new data fields:", {
        dob: savedProfile.dob,
        birth_year: savedProfile.birth_year,
        shipping_address: savedProfile.shipping_address,
        interests: savedProfile.interests,
        gift_preferences: savedProfile.gift_preferences,
        profile_type: savedProfile.profile_type,
        onboarding_completed: savedProfile.onboarding_completed
      });

      console.log("✅ All critical profile fields verified");

      toast.success("Profile created successfully!");
      
      // Legacy modal functionality removed - navigate directly based on intent
      
      // Navigate based on intent
      setTimeout(() => {
        if (intent === "browse-shop") {
          console.log("🌐 Navigating to marketplace with AI mode");
          navigate("/marketplace?mode=nicole&open=true&greeting=personalized");
        } else if (intent === "quick-gift") {
          console.log("🎁 Navigating to dashboard for quick gift");
          navigate("/dashboard");
        } else {
          console.log("📝 Navigating to dashboard for wishlist creation");
          navigate("/dashboard");
        }
      }, 500);

      if (onComplete) {
        onComplete();
      }

    } catch (error: any) {
      console.error("❌ Error in handleIntentSelection:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        formData: formData,
        userId: user.id
      });
      
      toast.error("Failed to save profile data", {
        description: error.message || "Please try again or contact support if the issue persists."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const totalSteps = 4;
  const isLastStep = currentStep === totalSteps;

  return (
    <>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Complete Your Profile</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Simplified onboarding steps - will be implemented later */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
          <p className="text-gray-600">Profile setup steps coming soon...</p>
        </div>
      </div>

      {/* Legacy modal removed - Nicole handles all intent selection now */}
    </>
  );
};

export default StreamlinedSignUp;
