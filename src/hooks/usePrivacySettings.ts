
import { useState } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";

export type PrivacySettingsType = {
  allowFriendRequests: boolean;
  showMutualFriends: boolean;
  autoGiftingNotifications: boolean;
  connectionVisibility: "everyone" | "friends" | "none";
  friendSuggestions: "enabled" | "mutual-only" | "disabled";
};

const defaultSettings: PrivacySettingsType = {
  allowFriendRequests: true,
  showMutualFriends: true,
  autoGiftingNotifications: true,
  connectionVisibility: "friends",
  friendSuggestions: "mutual-only"
};

interface UsePrivacySettingsOptions {
  onSettingsChange?: (settings: PrivacySettingsType) => void;
}

export const usePrivacySettings = (options: UsePrivacySettingsOptions = {}) => {
  const [storedSettings, setStoredSettings] = useLocalStorage<PrivacySettingsType>(
    "privacy_settings",
    defaultSettings
  );
  
  const [settings, setSettings] = useState<PrivacySettingsType>(storedSettings);
  const [saving, setSaving] = useState(false);
  
  const updateSetting = <K extends keyof PrivacySettingsType>(
    key: K,
    value: PrivacySettingsType[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to local storage
      setStoredSettings(settings);
      
      // If callback provided, invoke it
      if (options.onSettingsChange) {
        options.onSettingsChange(settings);
      }
      
      toast.success("Privacy settings saved successfully");
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast.error("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };
  
  return {
    settings,
    saving,
    updateSetting,
    saveSettings
  };
};
