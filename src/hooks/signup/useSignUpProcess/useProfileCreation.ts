
import { supabase } from "@/integrations/supabase/client";

export async function createUserProfile(userId: string, email: string, name: string) {
  try {
    const response = await supabase.functions.invoke('create-profile', {
      body: {
        user_id: userId,
        profile_data: {
          email: email,
          name: name,
          updated_at: new Date().toISOString()
        }
      }
    });
    
    if (response.error) {
      console.error("Error creating profile:", response.error);
      
      // Fallback to direct profile creation
      try {
        const { error: directError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: userId,
              email: email,
              name: name,
              updated_at: new Date().toISOString()
            }
          ]);
          
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
