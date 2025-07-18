
import { ShippingAddress, ImportantDate, DataSharingSettings, GiftPreference } from "@/types/profile";

/**
 * Enhanced address mapping that handles multiple formats
 */
export function mapFormAddressToApiAddress(formAddress: any): ShippingAddress {
  if (!formAddress) return {};
  
  // Handle both nested object and flat object structures
  const address = formAddress.address || formAddress;
  
  return {
    // Standard API format
    address_line1: address.street || address.address_line1 || "",
    address_line2: address.line2 || address.address_line2 || "",
    city: address.city || "",
    state: address.state || "",
    zip_code: address.zipCode || address.zip_code || "",
    country: address.country || "US",
    
    // Legacy compatibility aliases
    street: address.street || address.address_line1 || "",
    line2: address.line2 || address.address_line2 || "",
    zipCode: address.zipCode || address.zip_code || ""
  };
}

/**
 * Enhanced API address to form address mapping
 */
export function mapApiAddressToFormAddress(apiAddress: ShippingAddress | undefined) {
  if (!apiAddress) {
    return {
      street: "",
      line2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US"
    };
  }
  
  return {
    street: apiAddress.address_line1 || apiAddress.street || "",
    line2: apiAddress.address_line2 || apiAddress.line2 || "",
    city: apiAddress.city || "",
    state: apiAddress.state || "",
    zipCode: apiAddress.zip_code || apiAddress.zipCode || "",
    country: apiAddress.country || "US"
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

/**
 * Enhanced database to settings form mapping
 */
export function mapDatabaseToSettingsForm(profile: any) {
  console.log("🔄 mapDatabaseToSettingsForm input:", profile);
  
  if (!profile) {
    return {
      first_name: "",
      last_name: "",
      name: "",
      email: "",
      username: "",
      bio: "",
      profile_image: null,
      date_of_birth: undefined,
      address: {
        street: "",
        line2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US"
      },
      interests: [],
      importantDates: [],
      data_sharing_settings: {
        dob: "private",
        shipping_address: "private",
        gift_preferences: "friends",
        email: "private"
      }
    };
  }

  // Handle date of birth conversion
  let dateOfBirth;
  if (profile.dob) {
    try {
      dateOfBirth = new Date(profile.dob);
    } catch (e) {
      console.warn("Invalid date of birth format:", profile.dob);
      dateOfBirth = undefined;
    }
  }

  // Map address using the enhanced mapper
  const mappedAddress = mapApiAddressToFormAddress(profile.shipping_address);

  const result = {
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    name: profile.name || "",
    email: profile.email || "",
    username: profile.username || "",
    bio: profile.bio || "",
    profile_image: profile.profile_image || null,
    date_of_birth: dateOfBirth,
    address: mappedAddress,
    interests: profile.interests || [],
    importantDates: mapApiDatesToFormFormat(profile.important_dates),
    data_sharing_settings: profile.data_sharing_settings || {
      dob: "private",
      shipping_address: "private", 
      gift_preferences: "friends",
      email: "private"
    }
  };

  console.log("✅ mapDatabaseToSettingsForm output:", result);
  return result;
}

/**
 * Enhanced settings form to database mapping
 */
export function mapSettingsFormToDatabase(formData: any) {
  console.log("🔄 mapSettingsFormToDatabase input:", formData);

  const databaseData = {
    first_name: formData.first_name || "",
    last_name: formData.last_name || "",
    name: formData.name || `${formData.first_name || ""} ${formData.last_name || ""}`.trim(),
    email: formData.email || "",
    username: formData.username || "",
    bio: formData.bio || "",
    profile_image: formData.profile_image || null,
    dob: formData.date_of_birth ? formData.date_of_birth.toISOString() : null,
    birth_year: formData.date_of_birth ? formData.date_of_birth.getFullYear() : null,
    shipping_address: mapFormAddressToApiAddress(formData.address),
    interests: formData.interests || [],
    important_dates: mapFormDatesToApiFormat(formData.importantDates || []),
    data_sharing_settings: formData.data_sharing_settings,
    updated_at: new Date().toISOString()
  };

  console.log("✅ mapSettingsFormToDatabase output:", databaseData);
  return databaseData;
}
