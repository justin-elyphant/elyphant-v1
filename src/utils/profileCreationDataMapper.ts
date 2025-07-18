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
    firstName: firstName,
    lastName: lastName,
    email: user.email || "",
    username: additionalData.username || `user_${user.id.substring(0, 8)}`,
    photo: additionalData.profile_image || 
                  metadata.avatar_url || 
                  metadata.picture || 
                  metadata.profile_image_url || 
                  null,
    
    // Default values for optional fields
    address: typeof additionalData.address === 'string' ? additionalData.address : "",
    interests: additionalData.interests || [],
    gift_preferences: additionalData.gift_preferences || []
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
    firstName: data.firstName || data.name?.split(' ')[0] || "",
    lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || "",
    email: data.email || user?.email || "",
    username: data.username || `user_${user?.id?.substring(0, 8) || "unknown"}`,
    photo: data.photo || null,
    address: typeof data.address === 'string' ? data.address : "",
    interests: data.interests || [],
    gift_preferences: data.gift_preferences || []
  };
}

/**
 * Validates ProfileCreationData and returns validation errors
 */
export function validateProfileCreationData(data: ProfileCreationData): string[] {
  const errors: string[] = [];

  if (!data.firstName?.trim()) {
    errors.push("First name is required");
  }

  if (!data.lastName?.trim()) {
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