
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";

/**
 * UPDATED: Now uses ProfileContext for profile updates instead of direct database calls
 */
export const useProfileImage = () => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();

  // Handle profile image update through ProfileContext
  const handleProfileImageUpdate = async (imageUrl: string) => {
    if (!user) return null;

    try {
      // Use ProfileContext instead of direct database call
      await updateProfile({ profile_image: imageUrl });
      return imageUrl;
    } catch (error) {
      console.error("Error updating profile image:", error);
      throw error;
    }
  };

  // Handle removing an image through ProfileContext
  const handleRemoveImage = async () => {
    if (!user) return false;
    
    try {
      // Use ProfileContext instead of direct database call
      await updateProfile({ profile_image: null });
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
