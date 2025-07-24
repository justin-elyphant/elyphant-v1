
import { ProfileCreationData } from "@/services/profiles/UnifiedProfileService";

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
    
    // Handle address - could be string or object
    address: normalizeAddressInput(additionalData.address),
    interests: additionalData.interests || [],
    gift_preferences: additionalData.gift_preferences || [],
    bio: additionalData.bio || ""
  };

  console.log("✅ Mapped ProfileCreationData:", profileData);
  return profileData;
}

/**
 * Maps StreamlinedSignUp data to ProfileCreationData format
 */
export function mapStreamlinedSignUpToProfileCreationData(signupData: any): ProfileCreationData {
  console.log("🔄 Mapping StreamlinedSignUp data to ProfileCreationData");
  console.log("📊 Signup data:", signupData);

  // Extract names from full name if needed
  const nameParts = signupData.name?.split(' ') || [];
  const firstName = signupData.firstName || nameParts[0] || "";
  const lastName = signupData.lastName || nameParts.slice(1).join(' ') || "";

  const profileData: ProfileCreationData = {
    firstName: firstName,
    lastName: lastName,
    email: signupData.email || "",
    username: signupData.username || `user_${Math.random().toString(36).substr(2, 8)}`,
    photo: signupData.profilePhoto || signupData.profile_image || null,
    
    // Handle date of birth
    dateOfBirth: signupData.dateOfBirth ? new Date(signupData.dateOfBirth) : undefined,
    
    // Handle address - normalize from string or object
    address: normalizeAddressInput(signupData.address),
    
    interests: signupData.interests || [],
    gift_preferences: signupData.gift_preferences || [],
    bio: signupData.bio || ""
  };

  console.log("✅ Mapped StreamlinedSignUp to ProfileCreationData:", profileData);
  return profileData;
}

/**
 * Maps any generic profile data to ProfileCreationData format
 */
export function mapGenericToProfileCreationData(data: any, user: any): ProfileCreationData {
  console.log("🔄 Mapping generic data to ProfileCreationData");
  console.log("📊 Generic data:", data);

  // Extract names
  const nameParts = data.name?.split(' ') || [];
  const firstName = data.firstName || data.first_name || nameParts[0] || "";
  const lastName = data.lastName || data.last_name || nameParts.slice(1).join(' ') || "";

  return {
    firstName: firstName,
    lastName: lastName,
    email: data.email || user?.email || "",
    username: data.username || `user_${user?.id?.substring(0, 8) || "unknown"}`,
    photo: data.photo || data.profile_image || data.profilePhoto || null,
    
    // Handle date of birth
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    birthYear: data.birthYear,
    
    // Handle address
    address: normalizeAddressInput(data.address),
    
    interests: data.interests || [],
    gift_preferences: data.gift_preferences || [],
    bio: data.bio || ""
  };
}

/**
 * Normalize address input from various formats
 */
function normalizeAddressInput(address: any): string | object | undefined {
  if (!address) return undefined;
  
  // If it's already a string, return as-is
  if (typeof address === 'string') {
    return address;
  }
  
  // If it's an object, ensure proper structure
  if (typeof address === 'object' && address !== null) {
    return {
      street: address.street || address.address_line1 || "",
      line2: address.line2 || address.address_line2 || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || address.zip_code || "",
      country: address.country || "US"
    };
  }
  
  return undefined;
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Please enter a valid email address");
  }

  console.log("🔍 Profile validation:", { errors, data: data });
  return errors;
}

/**
 * Enhanced mapping for profile setup data
 */
export function mapProfileSetupToCreationData(profileData: any, userId: string): ProfileCreationData {
  console.log("🔄 Mapping profile setup data to ProfileCreationData");
  console.log("📊 Profile setup data:", profileData);

  // Extract names from full name
  const nameParts = profileData.name?.split(' ') || [];
  const firstName = profileData.firstName || nameParts[0] || "";
  const lastName = profileData.lastName || nameParts.slice(1).join(' ') || "";

  return {
    firstName: firstName,
    lastName: lastName,
    email: profileData.email || "",
    username: profileData.username || `user_${userId.substring(0, 8)}`,
    photo: profileData.profile_image || null,
    
    // Handle birthday conversion
    dateOfBirth: profileData.birthday ? 
      new Date(new Date().getFullYear() - 25, profileData.birthday.month - 1, profileData.birthday.day) : 
      undefined,
    
    // Handle address
    address: normalizeAddressInput(profileData.address),
    
    interests: profileData.interests || [],
    gift_preferences: [],
    bio: profileData.bio || ""
  };
}
