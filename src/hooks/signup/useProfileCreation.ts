
import { supabase } from "@/integrations/supabase/client";
import { DataSharingSettings, getDefaultDataSharingSettings } from "@/utils/privacyUtils";

export async function createUserProfile(
  userId: string, 
  email: string, 
  name: string,
  dataSharingSettings?: DataSharingSettings
) {
  try {
    // Ensure we have complete data sharing settings
    const completeSettings = dataSharingSettings || getDefaultDataSharingSettings();
    
    // Log the initialization process for debugging
    console.log(`Initializing profile for user ${userId} with complete privacy settings`);
    console.log("Data sharing settings:", JSON.stringify(completeSettings, null, 2));
    
    // Format data with initial values for all required fields
    const initialProfileData = {
      id: userId,
      email: email,
      name: name,
      username: name.toLowerCase().replace(/\s+/g, '_'),
      bio: `Hi, I'm ${name}`,
      profile_image: null,
      dob: null,
      shipping_address: {},
      gift_preferences: [],
      important_dates: [],
      data_sharing_settings: completeSettings,
      updated_at: new Date().toISOString()
    };

    console.log("Complete profile data prepared:", JSON.stringify(initialProfileData, null, 2));
    
    const response = await supabase.functions.invoke('create-profile', {
      body: {
        user_id: userId,
        profile_data: initialProfileData
      }
    });
    
    if (response.error) {
      console.error("Error creating profile via edge function:", response.error);
      
      // Fallback to direct profile creation
      try {
        const { error: directError } = await supabase
          .from('profiles')
          .insert([initialProfileData]);
          
        if (directError) {
          console.error("Direct profile creation also failed:", directError);
        } else {
          console.log("Profile created successfully via direct insertion");
        }
      } catch (directError) {
        console.error("Failed direct profile creation:", directError);
      }
    } else {
      console.log("Profile created successfully via edge function:", response.data);
    }
  } catch (profileError) {
    console.error("Failed to create profile:", profileError);
  }
}
