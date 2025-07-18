
import { supabase } from "@/integrations/supabase/client";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

export interface EnhancedProfileData {
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  dob?: string | null;
  birth_year?: number | null;
  shipping_address?: any;
  interests?: string[];
  gift_preferences?: any[];
  profile_type?: string;
  onboarding_completed?: boolean;
}

export class ProfileCreationService {
  static async createEnhancedProfile(
    userId: string, 
    profileData: EnhancedProfileData
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    console.log("🔄 ProfileCreationService.createEnhancedProfile called");
    console.log("👤 User ID:", userId);
    console.log("📊 Profile data received:", JSON.stringify(profileData, null, 2));

    try {
      // Validate required fields
      if (!profileData.first_name?.trim()) {
        throw new Error("First name is required");
      }
      if (!profileData.last_name?.trim()) {
        throw new Error("Last name is required");
      }
      if (!profileData.email?.trim()) {
        throw new Error("Email is required");
      }

      // Generate username if not provided
      const username = `user_${userId.substring(0, 8)}`;
      
      // Prepare the complete profile record with all required fields
      const profileRecord = {
        id: userId,
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        name: profileData.name || `${profileData.first_name} ${profileData.last_name}`.trim(),
        email: profileData.email.trim(),
        username: username,
        bio: `Hi, I'm ${profileData.first_name}`,
        profile_image: null,
        
        // Birthday fields
        dob: profileData.dob || null,
        birth_year: profileData.birth_year || null,
        
        // Address
        shipping_address: profileData.shipping_address || {},
        
        // Interests and preferences
        interests: profileData.interests || [],
        gift_preferences: profileData.gift_preferences || (profileData.interests || []).map(interest => ({
          category: interest,
          importance: "medium"
        })),
        
        // Important dates - empty array for now
        important_dates: [],
        
        // Data sharing settings with proper defaults
        data_sharing_settings: getDefaultDataSharingSettings(),
        
        // Profile type and completion status
        profile_type: profileData.profile_type || "user",
        onboarding_completed: profileData.onboarding_completed || true,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("💾 Complete profile record to upsert:", JSON.stringify(profileRecord, null, 2));

      // Upsert the profile (insert or update if exists)
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileRecord, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase error during profile upsert:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("✅ Profile successfully saved to database:", data);

      // Verify the data was actually saved by fetching it back
      console.log("🔍 Verifying profile was saved correctly...");
      const { data: verificationData, error: verificationError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (verificationError) {
        console.warn("⚠️ Could not verify profile save:", verificationError);
      } else {
        console.log("✅ Profile verification successful:", verificationData);
      }

      return { 
        success: true, 
        data: data || verificationData 
      };

    } catch (error: any) {
      console.error("❌ Error in ProfileCreationService.createEnhancedProfile:", error);
      return { 
        success: false, 
        error: error.message || "Failed to create profile" 
      };
    }
  }

  static async getProfile(userId: string) {
    console.log("🔍 Getting profile for user:", userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("❌ Error fetching profile:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Profile fetched successfully:", data);
      return { success: true, data };

    } catch (error: any) {
      console.error("❌ Error in getProfile:", error);
      return { success: false, error: error.message };
    }
  }
}
