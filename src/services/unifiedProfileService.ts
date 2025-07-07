import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UnifiedProfileData {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  profile_image: string | null;
  dob: string | null;
  bio: string | null;
  profile_type: string | null;
  shipping_address: any;
  gift_preferences: any;
  interests: any;
  onboarding_completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

class UnifiedProfileService {
  /**
   * Get complete profile data for the current user
   */
  async getCurrentProfile(): Promise<UnifiedProfileData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Profile service error:', error);
      return null;
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
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error upserting profile:', error);
        return { success: false, error: error.message };
      }

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
   * Get user's profile type (giftor/giftee)
   */
  async getProfileType(): Promise<string | null> {
    try {
      const profile = await this.getCurrentProfile();
      return profile?.profile_type ?? null;
    } catch (error) {
      console.error('Error getting profile type:', error);
      return null;
    }
  }

  /**
   * Update user's profile type
   */
  async setProfileType(profileType: 'giftor' | 'giftee'): Promise<{ success: boolean; error?: string }> {
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
      return profile?.interests ?? null;
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
  async getGiftPreferences(): Promise<any | null> {
    try {
      const profile = await this.getCurrentProfile();
      return profile?.gift_preferences ?? null;
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
}

// Export singleton instance
export const unifiedProfileService = new UnifiedProfileService();