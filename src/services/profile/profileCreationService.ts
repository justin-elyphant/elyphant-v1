import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileCreationData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  photo?: string;
  dateOfBirth?: Date;
  address?: string;
  profileType?: string;
}

export class ProfileCreationService {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;

  static async createProfileWithTimeout(
    userId: string, 
    data: ProfileCreationData
  ): Promise<{ success: boolean; error?: string }> {
    console.log("🚀 Starting profile creation for user:", userId);
    console.log("📝 Profile data:", JSON.stringify(data, null, 2));
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.error("⏰ Profile creation timed out after", this.TIMEOUT_MS, "ms");
        resolve({ success: false, error: "Profile creation timed out" });
      }, this.TIMEOUT_MS);

      this.createProfileWithRetry(userId, data)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error("❌ Profile creation failed:", error);
          resolve({ success: false, error: error.message });
        });
    });
  }

  private static async createProfileWithRetry(
    userId: string, 
    data: ProfileCreationData,
    attempt: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`🔄 Profile creation attempt ${attempt}/${this.MAX_RETRIES}`);
    
    try {
      const profileData = {
        id: userId,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        username: data.username,
        profile_image: data.photo || null,
        dob: data.dateOfBirth?.toISOString() || null,
        shipping_address: data.address ? { formatted_address: data.address } : null,
        profile_type: data.profileType || null,
        onboarding_completed: true,
        data_sharing_settings: {
          dob: "friends",
          shipping_address: "private", 
          gift_preferences: "public",
          email: "private"
        },
        gift_preferences: [],
        important_dates: [],
        updated_at: new Date().toISOString()
      };

      console.log("📤 Sending profile data to database:", JSON.stringify(profileData, null, 2));

      const { data: result, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error(`❌ Database error on attempt ${attempt}:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          console.log(`🔄 Retrying in 1 second... (attempt ${attempt + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.createProfileWithRetry(userId, data, attempt + 1);
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("✅ Profile created successfully:", result);
      return { success: true };
      
    } catch (error: any) {
      console.error(`❌ Exception on attempt ${attempt}:`, error);
      
      if (attempt < this.MAX_RETRIES) {
        console.log(`🔄 Retrying due to exception... (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.createProfileWithRetry(userId, data, attempt + 1);
      }
      
      throw error;
    }
  }

  static async verifyProfileExists(userId: string): Promise<boolean> {
    try {
      console.log("🔍 Verifying profile exists for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error("❌ Error checking profile existence:", error);
        return false;
      }
      
      const exists = !!data;
      console.log(exists ? "✅ Profile exists" : "❌ Profile does not exist");
      return exists;
    } catch (error) {
      console.error("❌ Exception checking profile existence:", error);
      return false;
    }
  }
}