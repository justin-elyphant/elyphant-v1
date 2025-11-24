export interface UserSizes {
  tops?: string;
  bottoms?: string;
  shoes?: string;
  ring?: string;
  fit_preference?: "slim" | "regular" | "relaxed";
}

export interface ProfileMetadata {
  sizes?: UserSizes;
  theme?: "light" | "dark" | "system";
  feature_flags?: Record<string, boolean>;
}

// Validation helper
export const validateUserSizes = (sizes: Partial<UserSizes>): boolean => {
  const validTops = ["XS", "S", "M", "L", "XL", "XXL"];
  const validFitPreferences = ["slim", "regular", "relaxed"];
  
  if (sizes.tops && !validTops.includes(sizes.tops)) {
    return false;
  }
  
  if (sizes.fit_preference && !validFitPreferences.includes(sizes.fit_preference)) {
    return false;
  }
  
  // Bottoms and shoes are free-form text (validation too complex)
  return true;
};
