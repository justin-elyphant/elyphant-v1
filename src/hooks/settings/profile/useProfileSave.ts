
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { ProfileFormData } from "../types";

export const useProfileSave = () => {
  const { user } = useAuth();

  // Save profile information
  const saveProfile = async (data: ProfileFormData) => {
    if (!user) return null;
    
    try {
      console.log('Saving profile data:', data);
      
      // Format gift preferences from interests
      const gift_preferences = data.interests.map(interest => ({
        category: interest,
        importance: "medium"
      }));
      
      // Format important dates
      const important_dates = data.importantDates.map(date => ({
        date: date.date.toISOString(),
        description: date.description
      }));
      
      // Prepare data for update
      const updateData = {
        name: data.name,
        email: data.email,
        bio: data.bio,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: data.address,
        gift_preferences: gift_preferences,
        important_dates: important_dates,
        data_sharing_settings: data.data_sharing_settings,
        updated_at: new Date().toISOString()
      };
      
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select();
        
      if (error) throw error;
      
      console.log('Profile updated successfully:', updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  return { saveProfile };
};
