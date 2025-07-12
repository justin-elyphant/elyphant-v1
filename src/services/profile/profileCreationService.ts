import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileCreationData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  photo?: string;
  dateOfBirth?: Date;
  birthYear?: number;
  address?: string;
  addressLine2?: string;
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
      // Ensure we have a proper name
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      if (!fullName) {
        throw new Error("Name is required - firstName and/or lastName must be provided");
      }

      // Format date of birth properly
      let formattedDob = null;
      if (data.dateOfBirth) {
        if (data.dateOfBirth instanceof Date) {
          // Convert to MM-DD format for birthday storage
          const month = (data.dateOfBirth.getMonth() + 1).toString().padStart(2, '0');
          const day = data.dateOfBirth.getDate().toString().padStart(2, '0');
          formattedDob = `${month}-${day}`;
        } else {
          console.warn("dateOfBirth is not a Date object:", data.dateOfBirth);
        }
      }

      // Format shipping address properly
      let formattedAddress = null;
      if (data.address) {
        if (typeof data.address === 'string') {
          formattedAddress = { 
            formatted_address: data.address,
            address_line_2: data.addressLine2 || null
          };
        } else if (data.address && typeof data.address === 'object') {
          formattedAddress = {
            formatted_address: (data.address as any).formatted_address || data.address,
            address_line_2: data.addressLine2 || null
          };
        }
      }

      const profileData = {
        id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        name: fullName,
        email: data.email,
        username: data.username || null,
        profile_image: data.photo || null,
        dob: formattedDob,
        birth_year: data.birthYear || null,
        shipping_address: formattedAddress,
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

  // Enhanced profile creation with mandatory fields
  static async createEnhancedProfile(
    userId: string, 
    data: ProfileCreationData
  ): Promise<{ success: boolean; error?: string }> {
    console.log("🚀 Starting enhanced profile creation for user:", userId);
    console.log("📝 Enhanced profile data:", JSON.stringify(data, null, 2));
    
    // Validate mandatory fields
    if (!data.firstName?.trim()) {
      return { success: false, error: "First name is required" };
    }
    if (!data.lastName?.trim()) {
      return { success: false, error: "Last name is required" };
    }
    if (!data.email?.trim()) {
      return { success: false, error: "Email is required" };
    }
    if (!data.username?.trim() || data.username.length < 3) {
      return { success: false, error: "Username must be at least 3 characters" };
    }
    // Profile photo is now optional
    // if (!data.photo) {
    //   return { success: false, error: "Profile photo is required" };
    // }
    if (!data.dateOfBirth) {
      return { success: false, error: "Date of birth is required" };
    }
    if (!data.birthYear || data.birthYear < 1900 || data.birthYear > new Date().getFullYear()) {
      return { success: false, error: "Valid birth year is required" };
    }
    if (!data.address?.trim()) {
      return { success: false, error: "Shipping address is required" };
    }
    
    return this.createProfileWithTimeout(userId, data);
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