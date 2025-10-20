import { supabase } from "@/integrations/supabase/client";
import { Database, Json } from "@/integrations/supabase/types";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";
import { toast } from "sonner";

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface ProfileCreationData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  photo?: string | null;
  address?: string | {
    street?: string;
    line2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
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

export interface UnifiedProfileData extends Profile {
  // Additional computed fields for UI
  full_name?: string;
  display_name?: string;
}

/**
 * UNIFIED PROFILE SERVICE
 * 
 * Consolidates all profile operations into a single, comprehensive service.
 * Replaces: profileCreationService, unifiedProfileService, and scattered profile hooks.
 * 
 * Features:
 * - Profile CRUD operations
 * - Enhanced profile creation with address normalization
 * - Cache management and validation
 * - Onboarding flow management
 * - Data consistency and integrity checks
 */
class UnifiedProfileService {
  private cache = new Map<string, { data: UnifiedProfileData; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get complete profile data for the current user
   */
  async getCurrentProfile(): Promise<UnifiedProfileData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return this.getProfileById(user.id);
    } catch (error) {
      console.error('Profile service error:', error);
      return null;
    }
  }

  /**
   * Get profile by user ID with caching
   */
  async getProfileById(userId: string): Promise<UnifiedProfileData | null> {
    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!profile) return null;

      // Enhance profile data with computed fields
      const enhancedProfile: UnifiedProfileData = {
        ...profile,
        full_name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        display_name: profile.name || profile.username || 'User'
      };

      // Update cache
      this.cache.set(userId, { data: enhancedProfile, timestamp: Date.now() });

      return enhancedProfile;
    } catch (error) {
      console.error('Profile service error:', error);
      return null;
    }
  }

  /**
   * Enhanced profile creation with comprehensive address handling
   */
  async createEnhancedProfile(
    userId: string,
    profileData: ProfileCreationData
  ): Promise<ProfileCreationResult> {
    console.log("🚀 UnifiedProfileService: Starting enhanced profile creation...");

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

      // Insert profile via Supabase
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          ...completeProfileData,
          shipping_address: completeProfileData.shipping_address as Json,
          interests: completeProfileData.interests as Json,
          gift_preferences: completeProfileData.gift_preferences as Json,
          data_sharing_settings: completeProfileData.data_sharing_settings as Json,
        }, {
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

      // Clear cache to ensure fresh data
      this.invalidateCache(userId);

      // Create birthday special date if provided
      if (profileData.dateOfBirth) {
        await this.createBirthdaySpecialDate(userId, profileData.dateOfBirth);
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
   * Update profile data with automatic updated_at timestamp
   */
  async updateProfile(updates: Partial<ProfileUpdate>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      // Clear cache to force fresh fetch
      this.invalidateCache(user.id);

      return { success: true };
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create or update profile data (upsert)
   */
  async upsertProfile(profileData: Partial<ProfileUpdate> & { id: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...profileData,
          birth_year: profileData.birth_year || 1990, // Provide default if missing
          email: profileData.email || 'unknown@example.com', // Provide default email
          first_name: profileData.first_name || 'Unknown', // Provide default first_name
          last_name: profileData.last_name || 'User', // Provide default last_name
        } as any); // Cast to bypass strict typing

      if (error) {
        console.error('Error upserting profile:', error);
        return { success: false, error: error.message };
      }

      // Clear cache
      this.invalidateCache(profileData.id);

      return { success: true };
    } catch (error: any) {
      console.error('Profile upsert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const profile = await this.getCurrentProfile();
      return profile?.onboarding_completed ?? false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(): Promise<{ success: boolean; error?: string }> {
    return this.updateProfile({ onboarding_completed: true });
  }

  /**
   * Verify that a profile exists for the given user
   */
  async verifyProfileExists(userId: string): Promise<boolean> {
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
   * Cache management
   */
  invalidateCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * @deprecated Use user_roles table and has_role() function instead
   * Get user's profile type (legacy - being phased out)
   */
  async getProfileType(): Promise<string | null> {
    console.warn('getProfileType() is deprecated. Use user_roles table instead.');
    try {
      const profile = await this.getCurrentProfile();
      return profile?.profile_type ?? null;
    } catch (error) {
      console.error('Error getting profile type:', error);
      return null;
    }
  }

  /**
   * @deprecated Use user_roles table and has_role() function instead
   * Update user's profile type (legacy - being phased out)
   */
  async setProfileType(profileType: 'giftor' | 'giftee'): Promise<{ success: boolean; error?: string }> {
    console.warn('setProfileType() is deprecated. Use user_roles table instead.');
    return this.updateProfile({ profile_type: profileType });
  }

  /**
   * Get user's shipping address
   */
  async getShippingAddress(): Promise<any | null> {
    try {
      const profile = await this.getCurrentProfile();
      return profile?.shipping_address ?? null;
    } catch (error) {
      console.error('Error getting shipping address:', error);
      return null;
    }
  }

  /**
   * Update user's shipping address
   */
  async updateShippingAddress(address: any): Promise<{ success: boolean; error?: string }> {
    return this.updateProfile({ shipping_address: address });
  }

  /**
   * Get user's interests
   */
  async getInterests(): Promise<string[] | null> {
    try {
      const profile = await this.getCurrentProfile();
      const interests = profile?.interests;
      if (Array.isArray(interests)) {
        return interests as string[];
      }
      return null;
    } catch (error) {
      console.error('Error getting interests:', error);
      return null;
    }
  }

  /**
   * Update user's interests
   */
  async updateInterests(interests: string[]): Promise<{ success: boolean; error?: string }> {
    return this.updateProfile({ interests });
  }

  /**
   * Get user's gift preferences
   */
  async getGiftPreferences(): Promise<any[] | null> {
    try {
      const profile = await this.getCurrentProfile();
      const preferences = profile?.gift_preferences;
      if (Array.isArray(preferences)) {
        return preferences;
      }
      return null;
    } catch (error) {
      console.error('Error getting gift preferences:', error);
      return null;
    }
  }

  /**
   * Update user's gift preferences
   */
  async updateGiftPreferences(preferences: any): Promise<{ success: boolean; error?: string }> {
    return this.updateProfile({ gift_preferences: preferences });
  }

  /**
   * PRIVATE HELPER METHODS
   */

  /**
   * Normalize address from various input formats to consistent structure
   */
  private normalizeAddress(address: string | object | undefined): object {
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
   * Create birthday special date entry
   */
  private async createBirthdaySpecialDate(userId: string, dateOfBirth: Date): Promise<void> {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const thisYearBirthday = new Date(currentYear, dateOfBirth.getMonth(), dateOfBirth.getDate());
      
      // If this year's birthday has passed, use next year's
      const birthdayDateToUse = thisYearBirthday < today 
        ? new Date(currentYear + 1, dateOfBirth.getMonth(), dateOfBirth.getDate())
        : thisYearBirthday;

      const birthdaySpecialDate = {
        user_id: userId,
        date_type: 'birthday',
        date: birthdayDateToUse.toISOString().split('T')[0], // YYYY-MM-DD format
        visibility: 'friends',
        is_recurring: true,
        recurring_type: 'yearly'
      };

      const { error } = await supabase
        .from('user_special_dates')
        .insert(birthdaySpecialDate);

      if (error) {
        console.error("Error creating birthday special date:", error);
        toast.error("Profile created but couldn't add birthday to events");
      } else {
        console.log("Birthday special date created successfully");
        toast.success("Profile created and birthday added to My Events!");
      }
    } catch (error) {
      console.error("Failed to create birthday special date:", error);
    }
  }
}

// Export singleton instance
export const unifiedProfileService = new UnifiedProfileService();