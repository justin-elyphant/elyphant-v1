
import type { DataSharingSettings, SharingLevel, ConnectionStatus } from "@/types/profile";

// Get default privacy settings with email always set to private
export function getDefaultDataSharingSettings(): DataSharingSettings {
  return {
    dob: "friends",
    shipping_address: "private",
    gift_preferences: "public",
    email: "private" // Email is always private by default
  };
}

// Check if data should be visible based on sharing level and connection status
export function isDataVisible(
  data: any,
  sharingLevel: SharingLevel | undefined = "friends",
  connectionStatus: ConnectionStatus = "none"
): boolean {
  if (!data) return false;
  
  // If sharing level is not specified, default to friends
  const level = sharingLevel || "friends";
  
  switch (level) {
    case "public":
      return true;
    case "friends":
      return connectionStatus === "accepted" || connectionStatus === "self";
    case "private":
    default:
      return connectionStatus === "self";
  }
}

// Get human readable label for sharing level
export function getSharingLevelLabel(level: SharingLevel): string {
  switch (level) {
    case "public":
      return "Everyone";
    case "friends":
      return "Only Friends";
    case "private":
      return "Only Me";
    default:
      return "Unknown";
  }
}

// Normalize data sharing settings to ensure all required fields are present
export function normalizeDataSharingSettings(settings?: DataSharingSettings | null): DataSharingSettings {
  const defaults = getDefaultDataSharingSettings();
  
  if (!settings) {
    return defaults;
  }
  
  // Ensure all required properties are present with non-null values
  const normalizedSettings: DataSharingSettings = {
    dob: settings.dob || defaults.dob,
    shipping_address: settings.shipping_address || defaults.shipping_address,
    gift_preferences: settings.gift_preferences || defaults.gift_preferences,
    email: settings.email || defaults.email
  };
  
  return normalizedSettings;
}
