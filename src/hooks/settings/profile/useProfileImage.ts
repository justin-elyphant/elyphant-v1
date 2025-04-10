
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfileImage = () => {
  const { user } = useAuth();

  // Handle profile image update
  const handleProfileImageUpdate = async (imageUrl: string) => {
    if (!user) return null;

    try {
      // Update profile record
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_image: imageUrl
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      return imageUrl;
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  };

  // Handle removing an image
  const handleRemoveImage = async () => {
    if (!user) return false;
    
    try {
      // Update profile to remove image reference
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_image: null
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Error removing image:", error);
      throw error;
    }
  };

  return {
    handleProfileImageUpdate,
    handleRemoveImage
  };
};
