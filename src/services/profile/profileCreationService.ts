
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

export interface ProfileCreationData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  photo?: string | null;
  
  // Address can be either simple string or structured object
  address?: string | {
    street?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Optional fields
  birthYear?: number;
  dateOfBirth?: Date;
  interests?: string[];
  gift_preferences?: any[];
  bio?: string;
}

export interface ProfileCreationResult {
  success: boolean;
  error?: string;
  profileId?: string;
}

export class ProfileCreationService {
  /**
   * Enhanced profile creation with comprehensive address handling
   */
  static async createEnhancedProfile(
    userId: string,
    profileData: ProfileCreationData
  ): Promise<ProfileCreationResult> {
    console.log("🚀 Starting enhanced profile creation...");
    console.log("📊 Profile data:", JSON.stringify(profileData, null, 2));

    try {
      // Validate required fields
      if (!profileData.firstName?.trim() || !profileData.lastName?.trim()) {
        return {
          success: false,
          error: "First name and last name are required"
        };
      }

      if (!profileData.email?.trim()) {
        return {
          success: false,
          error: "Email is required"
        };
      }

      // Handle address structure conversion
      const shippingAddress = this.normalizeAddress(profileData.address);
      
      // Prepare complete profile data
      const completeProfileData = {
        id: userId,
        first_name: profileData.firstName.trim(),
        last_name: profileData.lastName.trim(),
        name: `${profileData.firstName.trim()} ${profileData.lastName.trim()}`,
        email: profileData.email.trim(),
        username: profileData.username || `user_${userId.substring(0, 8)}`,
        bio: profileData.bio || "",
        profile_image: profileData.photo || null,
        
        // Handle date of birth properly
        dob: profileData.dateOfBirth ? profileData.dateOfBirth.toISOString() : null,
        birth_year: profileData.birthYear || (profileData.dateOfBirth ? profileData.dateOfBirth.getFullYear() : new Date().getFullYear() - 25),
        
        // Structured address
        shipping_address: shippingAddress,
        
        // Arrays
        interests: profileData.interests || [],
        gift_preferences: profileData.gift_preferences || [],
        important_dates: [],
        
        // Settings
        data_sharing_settings: getDefaultDataSharingSettings(),
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      console.log("📋 Complete profile data prepared:", JSON.stringify(completeProfileData, null, 2));

      // Insert profile via Supabase
      const { data, error } = await supabase
        .from('profiles')
        .upsert(completeProfileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Profile creation failed:", error);
        return {
          success: false,
          error: error.message || "Failed to create profile"
        };
      }

      console.log("✅ Profile created successfully:", data);
      return {
        success: true,
        profileId: userId
      };

    } catch (error: any) {
      console.error("❌ Unexpected error during profile creation:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred"
      };
    }
  }

  /**
   * Normalize address from various input formats to consistent structure
   */
  private static normalizeAddress(address: string | object | undefined): object {
    if (!address) {
      return {
        address_line1: "",
        city: "",
        state: "",
        zip_code: "",
        country: "US"
      };
    }

    // If it's a simple string (from StreamlinedSignUp)
    if (typeof address === 'string') {
      return {
        address_line1: address,
        city: "",
        state: "",
        zip_code: "",
        country: "US",
        // Legacy compatibility
        street: address,
        zipCode: ""
      };
    }

    // If it's already an object (from settings or other forms)
    if (typeof address === 'object' && address !== null) {
      const addr = address as any;
      
      return {
        // Standard API format
        address_line1: addr.street || addr.address_line1 || "",
        address_line2: addr.line2 || addr.address_line2 || "",
        city: addr.city || "",
        state: addr.state || "",
        zip_code: addr.zipCode || addr.zip_code || "",
        country: addr.country || "US",
        
        // Legacy compatibility fields
        street: addr.street || addr.address_line1 || "",
        line2: addr.line2 || addr.address_line2 || "",
        zipCode: addr.zipCode || addr.zip_code || ""
      };
    }

    // Fallback to empty structure
    return {
      address_line1: "",
      city: "",
      state: "",
      zip_code: "",
      country: "US"
    };
  }

  /**
   * Verify that a profile exists for the given user
   */
  static async verifyProfileExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("❌ Profile verification failed:", error);
      return false;
    }
  }

  /**
   * Create profile with timeout for error handling
   */
  static async createProfileWithTimeout(
    userId: string,
    profileData: ProfileCreationData,
    timeoutMs: number = 30000
  ): Promise<ProfileCreationResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Profile creation timeout'));
      }, timeoutMs);

      this.createEnhancedProfile(userId, profileData)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Update existing profile with new data
   */
  static async updateProfile(
    userId: string,
    updateData: Partial<ProfileCreationData>
  ): Promise<ProfileCreationResult> {
    console.log("🔄 Updating profile for user:", userId);
    console.log("📊 Update data:", JSON.stringify(updateData, null, 2));

    try {
      const updates: any = {};

      // Handle name updates
      if (updateData.firstName || updateData.lastName) {
        updates.first_name = updateData.firstName;
        updates.last_name = updateData.lastName;
        updates.name = `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim();
      }

      // Handle other field updates
      if (updateData.email) updates.email = updateData.email;
      if (updateData.username) updates.username = updateData.username;
      if (updateData.bio !== undefined) updates.bio = updateData.bio;
      if (updateData.photo !== undefined) updates.profile_image = updateData.photo;
      if (updateData.interests) updates.interests = updateData.interests;
      if (updateData.gift_preferences) updates.gift_preferences = updateData.gift_preferences;

      // Handle address updates
      if (updateData.address) {
        updates.shipping_address = this.normalizeAddress(updateData.address);
      }

      // Handle date updates
      if (updateData.dateOfBirth) {
        updates.dob = updateData.dateOfBirth.toISOString();
        updates.birth_year = updateData.dateOfBirth.getFullYear();
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error("❌ Profile update failed:", error);
        return {
          success: false,
          error: error.message || "Failed to update profile"
        };
      }

      console.log("✅ Profile updated successfully:", data);
      return {
        success: true,
        profileId: userId
      };

    } catch (error: any) {
      console.error("❌ Unexpected error during profile update:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred"
      };
    }
  }
}
