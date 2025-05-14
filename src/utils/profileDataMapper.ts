
import { ShippingAddress, ImportantDate, DataSharingSettings, GiftPreference } from "@/types/profile";

/**
 * Maps form address fields to API address format
 */
export function mapFormAddressToApiAddress(formAddress: any): ShippingAddress {
  if (!formAddress) return {};
  
  return {
    // Standard API format
    address_line1: formAddress.street || "",
    city: formAddress.city || "",
    state: formAddress.state || "",
    zip_code: formAddress.zipCode || "",
    country: formAddress.country || "",
    // Aliases for compatibility
    street: formAddress.street || "",
    zipCode: formAddress.zipCode || ""
  };
}

/**
 * Maps API address format to form address format
 */
export function mapApiAddressToFormAddress(apiAddress: ShippingAddress | undefined) {
  if (!apiAddress) return {};
  
  return {
    street: apiAddress.address_line1 || apiAddress.street || "",
    city: apiAddress.city || "",
    state: apiAddress.state || "",
    zipCode: apiAddress.zip_code || apiAddress.zipCode || "",
    country: apiAddress.country || ""
  };
}

/**
 * Maps form important dates to API format
 */
export function mapFormDatesToApiFormat(formDates: { date: Date; description: string }[]): ImportantDate[] {
  if (!formDates || !Array.isArray(formDates)) return [];
  
  return formDates.map(date => ({
    title: date.description,
    date: date.date instanceof Date ? date.date.toISOString() : String(date.date),
    type: "custom",
    description: date.description // For backward compatibility
  }));
}

/**
 * Maps API important dates to form format
 */
export function mapApiDatesToFormFormat(apiDates: ImportantDate[] | undefined) {
  if (!apiDates || !Array.isArray(apiDates)) return [];
  
  return apiDates.map(date => {
    let dateObj;
    try {
      dateObj = new Date(date.date);
    } catch (e) {
      dateObj = new Date();
    }
    
    return {
      date: dateObj,
      description: date.title || date.description || ""
    };
  });
}

/**
 * Normalizes gift preferences to ensure consistent format
 */
export function normalizeGiftPreferences(preferences: any[]): GiftPreference[] {
  if (!preferences || !Array.isArray(preferences)) return [];
  
  return preferences.map(pref => {
    if (typeof pref === "string") {
      return { category: pref, importance: "medium" };
    } else if (pref && typeof pref === "object") {
      const importance = typeof pref.importance === "string" && 
                        ["low", "medium", "high"].includes(pref.importance)
                        ? pref.importance
                        : "medium";
      
      return {
        category: pref.category || "",
        importance: importance as "low" | "medium" | "high"
      };
    }
    return { category: "", importance: "medium" };
  });
}
