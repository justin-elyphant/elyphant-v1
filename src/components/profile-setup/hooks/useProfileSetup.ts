
import { useState, useCallback, useEffect } from "react";
import { useProfileData } from "./useProfileData";
import { ProfileData } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

interface UseProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  const { user } = useAuth();
  const { profileData, updateProfileData, isLoading: dataLoading } = useProfileData();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { title: "Basic Info", description: "Tell us about yourself" },
    { title: "Birthday", description: "When is your birthday?" },
    { title: "Address", description: "Where should gifts be delivered?" },
    { title: "Preferences", description: "What do you like?" },
    { title: "Privacy", description: "Control your data sharing" },
    { title: "Next Steps", description: "What would you like to do?" }
  ];

  const isCurrentStepValid = useCallback(() => {
    switch (activeStep) {
      case 0: // Basic Info
        return profileData.name && profileData.name.trim().length > 0;
      case 1: // Birthday
        return true; // Optional
      case 2: // Address
        return true; // Optional for now
      case 3: // Preferences
        return true; // Optional
      case 4: // Privacy
        return true; // Has defaults
      case 5: // Next Steps
        return true;
      default:
        return false;
    }
  }, [activeStep, profileData]);

  const handleNext = useCallback(() => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  }, [activeStep, steps.length]);

  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  }, [activeStep]);

  const handleComplete = useCallback(async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      console.log("[Profile Setup] Starting profile save with data:", profileData);

      // Ensure we have a username
      const username = profileData.username || 
        (user.email ? user.email.split('@')[0] : '') ||
        `user_${Date.now().toString(36)}`;

      // Enhanced data formatting for Supabase with proper date and important dates handling
      const updateData = {
        id: user.id,
        name: profileData.name || '',
        username: username,
        email: profileData.email || user.email || '',
        bio: profileData.bio || `Hi, I'm ${profileData.name || 'there'}!`,
        profile_image: profileData.profile_image || null,
        // Enhanced birthday handling - ensure it's properly formatted or null
        dob: profileData.dob ? (profileData.dob.includes('-') ? profileData.dob : null) : null,
        shipping_address: profileData.shipping_address || {
          address_line1: "",
          city: "",
          state: "",
          zip_code: "",
          country: ""
        },
        gift_preferences: profileData.gift_preferences || [],
        // Enhanced important dates handling - ensure they're properly formatted
        important_dates: profileData.important_dates ? profileData.important_dates.map(date => ({
          title: date.title || date.description || "Important Date",
          date: date.date,
          type: date.type || "custom"
        })) : [],
        data_sharing_settings: profileData.data_sharing_settings || {
          dob: "friends",
          shipping_address: "private",
          gift_preferences: "public",
          email: "private"
        },
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      console.log("[Profile Setup] Formatted data for save:", updateData);

      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('profiles')
        .upsert(updateData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error("[Profile Setup] Error saving profile:", error);
        
        if (error.code === '42501' || error.message.includes('policy')) {
          toast.error("Permission error. Please try logging out and back in.");
        } else if (error.code === '23505') {
          toast.error("Username already exists. Please try a different one.");
        } else {
          toast.error(`Failed to save profile: ${error.message}`);
        }
        return;
      }

      console.log("[Profile Setup] Profile saved successfully:", data);
      toast.success("Profile completed successfully!");

      // Clear any remaining onboarding flags
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileSetupLoading");
      localStorage.removeItem("onboardingComplete");
      localStorage.removeItem("nicoleCollectedData");
      localStorage.removeItem("nicoleDataReady");
      localStorage.setItem("profileCompleted", "true");

      onComplete();
    } catch (error) {
      console.error("[Profile Setup] Error completing profile setup:", error);
      toast.error("Failed to complete profile setup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profileData, user, onComplete]);

  const handleSkip = useCallback(() => {
    console.log("[Profile Setup] Profile setup skipped");
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("profileSetupLoading");
    localStorage.removeItem("nicoleCollectedData");
    localStorage.removeItem("nicoleDataReady");
    localStorage.setItem("profileSkipped", "true");
    
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  }, [onSkip, onComplete]);

  return {
    activeStep,
    profileData,
    steps,
    isLoading: isLoading || dataLoading,
    isCurrentStepValid: isCurrentStepValid(),
    handleNext,
    handleBack,
    handleComplete,
    handleSkip,
    updateProfileData
  };
};
