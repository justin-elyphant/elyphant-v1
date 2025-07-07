
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { ProfileFormData } from "../types";

/**
 * UPDATED: Now uses ProfileContext for profile updates instead of direct database calls
 */
export const useProfileSave = () => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();

  // Save profile information through ProfileContext
  const saveProfile = async (data: ProfileFormData) => {
    if (!user) return null;
    
    try {
      console.log('Saving profile data through ProfileContext:', data);
      
      // Format gift preferences from interests
      const gift_preferences = data.interests.map(interest => ({
        category: interest,
        importance: "medium" as const
      }));
      
      // Format important dates
      const important_dates = data.importantDates.map(date => ({
        title: date.description,
        date: date.date.toISOString(),
        type: 'custom',
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
        data_sharing_settings: data.data_sharing_settings
      };
      
      // Use ProfileContext instead of direct database call
      const result = await updateProfile(updateData);
      
      console.log('Profile updated successfully through ProfileContext');
      return result;
    } catch (error) {
      console.error('Error saving profile through ProfileContext:', error);
      throw error;
    }
  };

  return { saveProfile };
};
