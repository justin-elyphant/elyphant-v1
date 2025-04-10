import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { ShippingAddress, SharingLevel, GiftPreference } from "@/types/supabase";
import { validateStep } from "../utils/stepValidation";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  name: string;
  username: string;
  email: string;
  profile_image: string | null;
  dob: string;
  shipping_address: ShippingAddress;
  gift_preferences: GiftPreference[];
  data_sharing_settings: {
    dob: SharingLevel;
    shipping_address: SharingLevel;
    gift_preferences: SharingLevel;
  };
  next_steps_option: string;
}

interface UseProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const useProfileSetup = ({ onComplete, onSkip }: UseProfileSetupProps) => {
  const { user, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    username: "",
    email: user?.email || "",
    profile_image: null,
    dob: "",
    shipping_address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    gift_preferences: [],
    data_sharing_settings: {
      dob: "friends" as SharingLevel,
      shipping_address: "private" as SharingLevel,
      gift_preferences: "public" as SharingLevel
    },
    next_steps_option: "dashboard"
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const profile = await getUserProfile();
        if (profile) {
          console.log("Loaded initial profile data:", profile);
          setProfileData(prevData => ({
            ...prevData,
            name: profile.name || prevData.name,
            username: profile.username || prevData.username || (profile.email ? profile.email.split('@')[0] : ''),
            email: profile.email || user.email || '',
            profile_image: profile.profile_image || prevData.profile_image,
            dob: profile.dob || prevData.dob,
            shipping_address: profile.shipping_address || prevData.shipping_address,
            gift_preferences: profile.gift_preferences || prevData.gift_preferences,
            data_sharing_settings: profile.data_sharing_settings || prevData.data_sharing_settings
          }));
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };
    
    fetchUserProfile();
  }, [user, getUserProfile]);

  const steps = [
    "Basic Info",
    "Profile",
    "Birthday",
    "Shipping Address",
    "Gift Preferences",
    "Data Sharing",
    "Next Steps"
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      
      const formattedGiftPreferences = profileData.gift_preferences.map(pref => ({
        category: pref.category,
        importance: pref.importance || "medium"
      }));
      
      let dataToUpdate: any = {
        name: profileData.name,
        email: profileData.email,
        profile_image: profileData.profile_image,
        dob: profileData.dob,
        shipping_address: profileData.shipping_address,
        gift_preferences: formattedGiftPreferences,
        data_sharing_settings: profileData.data_sharing_settings,
        updated_at: new Date().toISOString(),
        
        bio: profileData.name ? `Hi, I'm ${profileData.name}` : "Hello!",
        interests: formattedGiftPreferences.map(pref => pref.category)
      };
      
      console.log("Saving final profile data:", dataToUpdate);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dataToUpdate)
        .eq('id', user?.id)
        .select();
      
      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
      console.log("Profile setup completed successfully:", data);
      toast.success("Profile updated successfully!");
      
      switch (profileData.next_steps_option) {
        case "create_wishlist":
          navigate("/wishlist/create");
          break;
        case "find_friends":
          navigate("/connections");
          break;
        case "shop_gifts":
          navigate("/marketplace");
          break;
        case "explore_marketplace":
          navigate("/marketplace/explore");
          break;
        default:
          onComplete();
      }
    } catch (err) {
      console.error("Error completing profile setup:", err);
      toast.error("Failed to save profile data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info("You can complete your profile later in settings");
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const isCurrentStepValid = () => {
    return validateStep(activeStep, profileData);
  };

  const updateProfileData = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return {
    activeStep,
    profileData,
    steps,
    isLoading,
    isCurrentStepValid,
    handleNext,
    handleBack,
    handleComplete,
    handleSkip,
    updateProfileData
  };
};
