import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { ProfileCreationService } from "@/services/profile/profileCreationService";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { toast } from "sonner";
import OnboardingIntentModal from "@/components/auth/signup/OnboardingIntentModal";
import { parseBirthdayFromFormData } from "@/utils/dataFormatUtils";

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
  const [showIntentModal, setShowIntentModal] = useState(false);
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

    setShowIntentModal(true);
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
        // Use consistent field names that match database schema
        firstName: formData.firstName.trim(), // Keep original field name for ProfileCreationService
        lastName: formData.lastName.trim(),
        username: `user_${user.id.substring(0, 8)}`,
        email: user.email || "",
        
        // Birthday data
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
      const result = await ProfileCreationService.createEnhancedProfile(
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

      // Refresh profile context to get latest data
      console.log("🔄 Refreshing profile context...");
      await refetchProfile();

      // Verify data was saved correctly
      console.log("🔍 Verifying profile data was saved...");
      setTimeout(async () => {
        try {
          await refetchProfile();
          console.log("✅ Profile refresh completed");
        } catch (error) {
          console.error("❌ Error refreshing profile:", error);
        }
      }, 1000);

      toast.success("Profile created successfully!");
      
      // Close modal and complete onboarding
      setShowIntentModal(false);
      
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

      {showModal && (
        <OnboardingIntentModal
          open={showIntentModal}
          onSelect={handleIntentSelection}
          onSkip={() => setShowIntentModal(false)}
        />
      )}
    </>
  );
};

export default StreamlinedSignUp;
