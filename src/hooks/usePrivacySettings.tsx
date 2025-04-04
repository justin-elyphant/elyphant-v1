
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";

export type PrivacySettingsType = {
  allowFriendRequests: boolean;
  showMutualFriends: boolean;
  connectionVisibility: 'everyone' | 'friends' | 'none';
  autoGiftingNotifications: boolean;
  friendSuggestions: 'enabled' | 'mutual-only' | 'disabled';
};

const defaultSettings: PrivacySettingsType = {
  allowFriendRequests: true,
  showMutualFriends: true,
  connectionVisibility: 'friends',
  autoGiftingNotifications: true,
  friendSuggestions: 'enabled',
};

export const usePrivacySettings = () => {
  const [settings, setSettings] = useLocalStorage<PrivacySettingsType>(
    "privacySettings", 
    defaultSettings
  );
  const [pendingChanges, setPendingChanges] = useState<PrivacySettingsType>(settings);

  // Initialize pending changes when settings change
  useEffect(() => {
    setPendingChanges(settings);
  }, [settings]);

  const updateSetting = <K extends keyof PrivacySettingsType>(
    key: K, 
    value: PrivacySettingsType[K]
  ) => {
    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    setSettings(pendingChanges);
    toast.success("Privacy settings saved successfully");
  };

  return {
    settings: pendingChanges,
    updateSetting,
    saveSettings
  };
};
