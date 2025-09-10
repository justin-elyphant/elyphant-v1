import { Profile, ShippingAddress, ImportantDate, GiftPreference } from "@/types/profile";

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

/**
 * Parse birthday from form data
 */
export function parseBirthdayFromFormData(formData: any): { dob: string | null, birth_year: number | null } {
  if (!formData.birthday) return { dob: null, birth_year: null };
  
  try {
    if (formData.birthday instanceof Date) {
      const month = (formData.birthday.getMonth() + 1).toString().padStart(2, '0');
      const day = formData.birthday.getDate().toString().padStart(2, '0');
      return {
        dob: `${month}-${day}`,
        birth_year: formData.birthday.getFullYear()
      };
    }
    
    if (typeof formData.birthday === 'object' && formData.birthday.month && formData.birthday.day) {
      const month = formData.birthday.month.toString().padStart(2, '0');
      const day = formData.birthday.day.toString().padStart(2, '0');
      return {
        dob: `${month}-${day}`,
        birth_year: formData.birthday.year || new Date().getFullYear() - 25
      };
    }
  } catch (error) {
    console.error("Error parsing birthday:", error);
  }
  
  return { dob: null, birth_year: null };
}

/**
 * Parse birthday from storage format
 */
export function parseBirthdayFromStorage(dob: string | null, birth_year: number | null): Date | undefined {
  if (!dob && !birth_year) return undefined;
  
  try {
    if (dob && dob.includes('-')) {
      const [month, day] = dob.split('-');
      const year = birth_year || new Date().getFullYear() - 25;
      return new Date(year, parseInt(month) - 1, parseInt(day));
    }
    
    if (birth_year) {
      return new Date(birth_year, 0, 1); // January 1st of the birth year
    }
  } catch (error) {
    console.error("Error parsing birthday from storage:", error);
  }
  
  return undefined;
}

/**
 * Format profile data for submission
 */
export function formatProfileForSubmission(profileData: any): any {
  const birthday = parseBirthdayFromFormData(profileData);
  
  return {
    ...profileData,
    dob: birthday.dob,
    birth_year: birthday.birth_year,
    shipping_address: profileData.address ? mapFormAddressToApiAddress(profileData.address) : undefined
  };
}

/**
 * Format birthday for storage
 */
export function formatBirthdayForStorage(date: Date | null): { dob: string | null, birth_year: number | null } {
  if (!date) return { dob: null, birth_year: null };
  
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return {
    dob: `${month}-${day}`,
    birth_year: date.getFullYear()
  };
}

export function mapDatabaseToSettingsForm(profile: Profile) {
  if (!profile) {
    console.warn("❌ mapDatabaseToSettingsForm: No profile provided");
    return null;
  }

  console.log("🔄 mapDatabaseToSettingsForm input:", JSON.stringify(profile, null, 2));

  try {
    // Parse date of birth
    let dateOfBirth: Date | undefined;
    if (profile.dob) {
      try {
        // Handle MM-DD format
        if (profile.dob.includes('-') && profile.dob.length <= 5) {
          const [month, day] = profile.dob.split('-');
          const year = profile.birth_year || new Date().getFullYear() - 25;
          dateOfBirth = new Date(year, parseInt(month) - 1, parseInt(day));
        } else {
          // Handle full date format
          dateOfBirth = new Date(profile.dob);
        }
        
        if (isNaN(dateOfBirth.getTime())) {
          console.warn("❌ Invalid date parsed from profile.dob:", profile.dob);
          dateOfBirth = undefined;
        }
      } catch (error) {
        console.error("❌ Error parsing date of birth:", error);
        dateOfBirth = undefined;
      }
    }

    // Map address with proper structure
    const address = profile.shipping_address ? {
      street: profile.shipping_address.address_line1 || profile.shipping_address.street || "",
      line2: profile.shipping_address.address_line2 || profile.shipping_address.line2 || "",
      city: profile.shipping_address.city || "",
      state: profile.shipping_address.state || "",
      zipCode: profile.shipping_address.zip_code || profile.shipping_address.zipCode || "",
      country: profile.shipping_address.country || ""
    } : {
      street: "",
      line2: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    };

    // Map important dates
    const importantDates = (profile.important_dates || []).map(date => {
      try {
        return {
          date: new Date(date.date),
          description: date.title || date.description || ""
        };
      } catch (error) {
        console.error("❌ Error parsing important date:", error);
        return null;
      }
    }).filter(Boolean);

    // Map interests from gift_preferences or interests field
    let interests: string[] = [];
    if (profile.interests && Array.isArray(profile.interests)) {
      interests = profile.interests;
    } else if (profile.gift_preferences && Array.isArray(profile.gift_preferences)) {
      interests = profile.gift_preferences.map(pref => 
        typeof pref === 'string' ? pref : pref.category || ""
      ).filter(Boolean);
    }

    // Ensure data sharing settings have all required fields
    const dataSharingSettings = {
      dob: profile.data_sharing_settings?.dob || "private",
      shipping_address: profile.data_sharing_settings?.shipping_address || "private",
      gift_preferences: profile.data_sharing_settings?.gift_preferences || "friends",
      email: profile.data_sharing_settings?.email || "private"
    };

    const mappedData = {
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      name: profile.name || "",
      email: profile.email || "",
      username: profile.username || "",
      bio: profile.bio || "",
      profile_image: profile.profile_image || null,
      date_of_birth: dateOfBirth,
      address: address,
      interests: interests,
      importantDates: importantDates,
      data_sharing_settings: dataSharingSettings
    };

    console.log("✅ mapDatabaseToSettingsForm output:", JSON.stringify(mappedData, null, 2));
    return mappedData;

  } catch (error) {
    console.error("❌ Error in mapDatabaseToSettingsForm:", error);
    return null;
  }
}
