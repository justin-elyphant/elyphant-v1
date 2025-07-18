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
  // New fields for enhanced profile data
  dob?: string;
  birth_year?: number;
  shipping_address?: any;
  interests?: string[];
  gift_preferences?: any[];
  profile_type?: string;
  onboarding_completed?: boolean;
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

      // Add debugging to check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username, birth_year, dob, shipping_address, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();
      
      console.log("🔍 Existing profile before upsert:", existingProfile);

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
      console.log("🔍 Key fields in result:", {
        id: result.id,
        first_name: result.first_name,
        last_name: result.last_name,
        username: result.username,
        birth_year: result.birth_year,
        dob: result.dob,
        shipping_address: result.shipping_address,
        onboarding_completed: result.onboarding_completed
      });
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
    
    // Handle birthday - check for new format (dob + birth_year) or legacy format (dateOfBirth + birthYear)
    let hasValidBirthday = false;
    if (data.dob && data.birth_year) {
      hasValidBirthday = true;
    } else if (data.dateOfBirth && data.birthYear) {
      hasValidBirthday = true;
    }
    
    if (!hasValidBirthday) {
      console.warn("⚠️ No birthday data provided, will use defaults");
    }
    
    console.log("✅ Enhanced profile validation passed");
    console.log("📅 Birthday validation:", { 
      hasValidBirthday, 
      dob: data.dob, 
      birth_year: data.birth_year, 
      dateOfBirth: data.dateOfBirth, 
      birthYear: data.birthYear 
    });
    
    // Use the enhanced creation method that handles multiple formats
    return this.createEnhancedProfileWithFormats(userId, data);
  }

  // Enhanced profile creation that handles multiple data formats
  private static async createEnhancedProfileWithFormats(
    userId: string, 
    data: ProfileCreationData
  ): Promise<{ success: boolean; error?: string }> {
    console.log("🚀 Creating enhanced profile with multiple format support");
    
    try {
      // Handle birthday data from multiple formats
      let formattedDob = null;
      let formattedBirthYear = null;
      
      if (data.dob && data.birth_year) {
        // New format: dob (MM-DD) + birth_year
        formattedDob = data.dob;
        formattedBirthYear = data.birth_year;
        console.log("📅 Using new birthday format:", { dob: formattedDob, birth_year: formattedBirthYear });
      } else if (data.dateOfBirth && data.birthYear) {
        // Legacy format: dateOfBirth (Date) + birthYear
        const month = (data.dateOfBirth.getMonth() + 1).toString().padStart(2, '0');
        const day = data.dateOfBirth.getDate().toString().padStart(2, '0');
        formattedDob = `${month}-${day}`;
        formattedBirthYear = data.birthYear;
        console.log("📅 Using legacy birthday format:", { dob: formattedDob, birth_year: formattedBirthYear });
      } else {
        formattedBirthYear = new Date().getFullYear() - 25; // Default to 25 years old
        console.log("📅 Using default birthday:", { birth_year: formattedBirthYear });
      }

      // Handle address data from multiple formats
      let formattedAddress = {};
      if (data.shipping_address && typeof data.shipping_address === 'object') {
        formattedAddress = data.shipping_address;
        console.log("📍 Using new address format:", formattedAddress);
      } else if (data.address) {
        formattedAddress = {
          address_line1: data.address,
          address_line2: data.addressLine2 || null
        };
        console.log("📍 Using legacy address format:", formattedAddress);
      }

      const fullName = `${data.firstName} ${data.lastName}`.trim();

      const profileData = {
        id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        name: fullName,
        email: data.email,
        username: data.username,
        profile_image: data.photo || null,
        dob: formattedDob,
        birth_year: formattedBirthYear,
        shipping_address: formattedAddress,
        interests: data.interests || [],
        gift_preferences: data.gift_preferences || [],
        profile_type: data.profile_type || data.profileType || "user",
        onboarding_completed: data.onboarding_completed || true,
        data_sharing_settings: {
          dob: "friends",
          shipping_address: "private", 
          gift_preferences: "public",
          email: "private"
        },
        important_dates: [],
        updated_at: new Date().toISOString()
      };

      console.log("📤 Sending enhanced profile data to database:", JSON.stringify(profileData, null, 2));

      // Check for existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username, birth_year, dob, shipping_address, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();
      
      console.log("🔍 Existing profile before enhanced upsert:", existingProfile);

      const { data: result, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error("❌ Enhanced profile creation failed:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("✅ Enhanced profile created successfully:", result);
      console.log("🔍 Critical fields in enhanced result:", {
        id: result.id,
        first_name: result.first_name,
        last_name: result.last_name,
        username: result.username,
        birth_year: result.birth_year,
        dob: result.dob,
        shipping_address: result.shipping_address,
        onboarding_completed: result.onboarding_completed,
        interests: result.interests,
        gift_preferences: result.gift_preferences,
        profile_type: result.profile_type
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error("❌ Enhanced profile creation exception:", error);
      return { success: false, error: error.message };
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