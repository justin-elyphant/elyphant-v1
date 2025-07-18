
import { ProfileCreationData } from "@/services/profile/profileCreationService";

/**
 * Maps OAuth user metadata to ProfileCreationData format
 */
export function mapOAuthToProfileCreationData(user: any, additionalData: any = {}): ProfileCreationData {
  console.log("🔄 Mapping OAuth data to ProfileCreationData");
  console.log("📊 OAuth user:", user);
  console.log("📊 Additional data:", additionalData);

  const metadata = user.user_metadata || {};
  
  // Extract names from OAuth metadata
  const firstName = additionalData.first_name || 
                   metadata.first_name || 
                   metadata.given_name || 
                   (metadata.full_name || metadata.name || "").split(' ')[0] || 
                   "";
                   
  const lastName = additionalData.last_name || 
                  metadata.last_name || 
                  metadata.family_name || 
                  (metadata.full_name || metadata.name || "").split(' ').slice(1).join(' ') || 
                  "";

  const profileData: ProfileCreationData = {
    first_name: firstName,
    last_name: lastName,
    name: additionalData.name || `${firstName} ${lastName}`.trim() || metadata.full_name || metadata.name || "",
    email: user.email || "",
    username: additionalData.username || `user_${user.id.substring(0, 8)}`,
    bio: additionalData.bio || "",
    profile_image: additionalData.profile_image || 
                  metadata.avatar_url || 
                  metadata.picture || 
                  metadata.profile_image_url || 
                  null,
    
    // Default values for optional fields
    birthday: additionalData.birthday || null,
    address: additionalData.address || {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US"
    },
    interests: additionalData.interests || [],
    importantDates: additionalData.importantDates || [],
    data_sharing_settings: additionalData.data_sharing_settings || {
      dob: "friends",
      shipping_address: "private",
      gift_preferences: "public",
      email: "private"
    }
  };

  console.log("✅ Mapped ProfileCreationData:", profileData);
  return profileData;
}

/**
 * Maps any generic profile data to ProfileCreationData format
 */
export function mapGenericToProfileCreationData(data: any, user: any): ProfileCreationData {
  console.log("🔄 Mapping generic data to ProfileCreationData");
  console.log("📊 Generic data:", data);

  return {
    first_name: data.first_name || data.name?.split(' ')[0] || "",
    last_name: data.last_name || data.name?.split(' ').slice(1).join(' ') || "",
    name: data.name || `${data.first_name || ""} ${data.last_name || ""}`.trim(),
    email: data.email || user?.email || "",
    username: data.username || `user_${user?.id?.substring(0, 8) || "unknown"}`,
    bio: data.bio || "",
    profile_image: data.profile_image || null,
    birthday: data.birthday || null,
    address: data.address || {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US"
    },
    interests: data.interests || [],
    importantDates: data.importantDates || [],
    data_sharing_settings: data.data_sharing_settings || {
      dob: "friends",
      shipping_address: "private",
      gift_preferences: "public",
      email: "private"
    }
  };
}

/**
 * Validates ProfileCreationData and returns validation errors
 */
export function validateProfileCreationData(data: ProfileCreationData): string[] {
  const errors: string[] = [];

  if (!data.first_name?.trim()) {
    errors.push("First name is required");
  }

  if (!data.last_name?.trim()) {
    errors.push("Last name is required");
  }

  if (!data.email?.trim()) {
    errors.push("Email is required");
  }

  if (!data.username?.trim()) {
    errors.push("Username is required");
  }

  if (data.username && data.username.trim().length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  console.log("🔍 Profile validation:", { errors, data: data });
  return errors;
}
