import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { ProfileCreationService, ProfileCreationData } from "@/services/profile/profileCreationService";
import { toast } from "sonner";
import { ProfileData } from "./types";

interface UseProfileSetupProps {
  onComplete: (nextStepsOption?: string) => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState('basic-info');
  const [profileData, setProfileData] = useState<ProfileData>({} as ProfileData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("🔄 useProfileSetup hook initialized");
  console.log("👤 User:", user?.id);

  const steps = [
    { id: 'basic-info', title: 'Basic Information', description: 'Tell us about yourself' },
    { id: 'date-of-birth', title: 'Date of Birth', description: 'When were you born?' },
    { id: 'address', title: 'Address', description: 'Where should we send gifts?' },
    { id: 'interests', title: 'Interests', description: 'What do you love?' },
    { id: 'important-dates', title: 'Important Dates', description: 'Special occasions to remember' },
    { id: 'privacy', title: 'Privacy Settings', description: 'Control your data sharing' },
    { id: 'next-steps', title: 'Next Steps', description: 'Choose how to get started' }
  ];

  const updateProfileData = useCallback((key: string, value: any) => {
    console.log(`📝 Profile data updated: ${key}`, value);
    setProfileData(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const isCurrentStepValid = useCallback(() => {
    console.log(`🔍 Validating step: ${activeStep}`);
    console.log("📊 Current profile data:", profileData);

    switch (activeStep) {
      case 'basic-info':
        const hasName = profileData.name?.trim();
        const hasEmail = profileData.email?.trim();
        console.log(`✓ Basic info validation: name=${!!hasName}, email=${!!hasEmail}`);
        return hasName && hasEmail;
      case 'date-of-birth':
        // Date of birth is required for better AI recommendations
        const hasValidBirthday = profileData.date_of_birth instanceof Date;
        console.log(`✓ Birthday validation: hasValidBirthday=${hasValidBirthday}`);
        return hasValidBirthday;
      case 'address':
        // Address is optional for setup flow
        return true;
      case 'interests':
        // Interests are optional
        return true;
      case 'important-dates':
        // Important dates are optional
        return true;
      case 'privacy':
        // Privacy settings have defaults
        return true;
      case 'next-steps':
        // Next steps selection is optional
        return true;
      default:
        return true;
    }
  }, [activeStep, profileData]);

  const handleNext = useCallback(() => {
    if (!isCurrentStepValid()) {
      console.log("❌ Step validation failed, cannot proceed");
      return;
    }

    const currentIndex = steps.findIndex(step => step.id === activeStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1].id;
      console.log(`➡️ Moving to next step: ${nextStep}`);
      setActiveStep(nextStep);
    }
  }, [activeStep, isCurrentStepValid, steps]);

  const handleBack = useCallback(() => {
    const currentIndex = steps.findIndex(step => step.id === activeStep);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1].id;
      console.log(`⬅️ Moving to previous step: ${prevStep}`);
      setActiveStep(prevStep);
    }
  }, [activeStep, steps]);

  const handleComplete = useCallback(async () => {
    if (!user) {
      console.error("❌ No user available for profile setup completion");
      setError("Authentication error. Please try signing in again.");
      return;
    }

    console.log("🚀 Starting profile setup completion...");
    console.log("📊 Final profile data:", JSON.stringify(profileData, null, 2));

    setIsLoading(true);
    setError(null);

    try {
      // Convert ProfileData to ProfileCreationData format
      const profileCreationData: ProfileCreationData = {
        // Extract first and last name from full name
        firstName: profileData.name?.split(' ')[0] || "",
        lastName: profileData.name?.split(' ').slice(1).join(' ') || "",
        email: profileData.email || user.email || "",
        username: profileData.username || `user_${user.id.substring(0, 8)}`,
        photo: profileData.profile_image || null,
        
        // Convert birthday format if provided
        birthYear: profileData.date_of_birth ? profileData.date_of_birth.getFullYear() : undefined,
        dateOfBirth: profileData.date_of_birth,
        
        // Address
        address: typeof profileData.address === 'string' ? profileData.address : "",
        
        // Other fields
        interests: profileData.interests || [],
        gift_preferences: []
      };

      console.log("📋 Converted profile creation data:", JSON.stringify(profileCreationData, null, 2));

      // Use enhanced profile creation service
      const result = await ProfileCreationService.createEnhancedProfile(user.id, profileCreationData);

      if (result.success) {
        console.log("✅ Profile setup completion successful!");
        toast.success("Profile setup completed successfully!");
        onComplete(profileData.next_steps_option);
      } else {
        console.error("❌ Profile setup completion failed:", result.error);
        setError(result.error || "Failed to complete profile setup. Please try again.");
        toast.error(result.error || "Failed to complete profile setup. Please try again.");
      }
    } catch (error: any) {
      console.error("❌ Unexpected error during profile setup completion:", error);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, profileData, onComplete]);

  const handleSkip = useCallback(() => {
    console.log("⏭️ Skipping profile setup");
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  }, [onComplete, onSkip]);

  return {
    activeStep,
    steps,
    handleNext,
    handleBack,
    profileData,
    updateProfileData,
    isCurrentStepValid: isCurrentStepValid(),
    isLoading,
    error,
    handleComplete,
    handleSkip
  };
};
