
import { supabase } from "@/integrations/supabase/client";

export async function createUserProfile(userId: string, email: string, name: string) {
  try {
    console.log("Creating initial profile for user:", userId);
    
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
      data_sharing_settings: {
        dob: "friends",
        shipping_address: "private",
        gift_preferences: "public"
      },
      updated_at: new Date().toISOString()
    };

    console.log("Initial profile data:", JSON.stringify(initialProfileData, null, 2));
    
    // First attempt: Use direct database insertion
    const { data, error } = await supabase
      .from('profiles')
      .upsert(initialProfileData);
      
    if (error) {
      console.error("Direct profile creation failed:", error);
      
      // Fallback attempt: Try an edge function if available
      try {
        const functionResponse = await supabase.functions.invoke('create-profile', {
          body: {
            user_id: userId,
            profile_data: initialProfileData
          }
        });
        
        if (functionResponse.error) {
          console.error("Edge function profile creation also failed:", functionResponse.error);
          throw functionResponse.error;
        } else {
          console.log("Profile created via edge function:", functionResponse.data);
        }
      } catch (edgeFunctionError) {
        console.error("Edge function call failed:", edgeFunctionError);
        
        // Last resort attempt with minimal data
        const minimalData = {
          id: userId,
          email: email,
          name: name,
          updated_at: new Date().toISOString()
        };
        
        const { error: minimalError } = await supabase
          .from('profiles')
          .upsert(minimalData);
          
        if (minimalError) {
          console.error("Even minimal profile creation failed:", minimalError);
        } else {
          console.log("Created minimal profile as last resort");
        }
      }
    } else {
      console.log("Profile created successfully via direct insertion");
    }
  } catch (error) {
    console.error("Profile creation failed with exception:", error);
  }
}
