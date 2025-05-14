
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

export interface PreferencesState {
  interests: string[];
  priceRanges: {
    min: number;
    max: number;
  };
  notifications: {
    priceDrops: boolean;
    newArrivals: boolean;
    recommendations: boolean;
  };
}

interface UsePreferencesProps {
  onPreferencesChange?: (preferences: PreferencesState) => void;
}

export const usePreferences = ({ onPreferencesChange }: UsePreferencesProps = {}) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [savedPreferences, setSavedPreferences] = useLocalStorage<PreferencesState>(
    "shopping_preferences", 
    {
      interests: [],
      priceRanges: { min: 0, max: 1000 },
      notifications: {
        priceDrops: true,
        newArrivals: false,
        recommendations: true
      }
    }
  );
  
  const [preferences, setPreferences] = useState<PreferencesState>(savedPreferences);
  const [saving, setSaving] = useState(false);
  
  const updateInterests = (interests: string[]) => {
    setPreferences(prev => ({
      ...prev,
      interests
    }));
  };
  
  const updatePriceRange = (priceRange: [number, number]) => {
    setPreferences(prev => ({
      ...prev,
      priceRanges: {
        min: priceRange[0],
        max: priceRange[1]
      }
    }));
  };
  
  const updateNotification = (key: keyof PreferencesState['notifications'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };
  
  const savePreferences = async () => {
    setSaving(true);
    try {
      // Save to local storage
      setSavedPreferences(preferences);
      
      // If user is logged in, update profile
      if (user) {
        await updateProfile({
          // Convert interests to gift_preferences format
          gift_preferences: preferences.interests.map(interest => ({
            category: interest,
            importance: "medium" as const
          }))
        });
      }
      
      // Notify parent component if callback provided
      if (onPreferencesChange) {
        onPreferencesChange(preferences);
      }
      
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };
  
  return {
    preferences,
    saving,
    updateInterests,
    updatePriceRange,
    updateNotification,
    savePreferences
  };
};
