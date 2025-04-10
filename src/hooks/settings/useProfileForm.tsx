
import { useState } from "react";
import { toast } from "sonner";
import { useProfileData } from "./profile/useProfileData";
import { useProfileImage } from "./profile/useProfileImage";
import { useInterestsManager } from "./profile/useInterestsManager";
import { useImportantDatesManager } from "./profile/useImportantDatesManager";
import { useProfileSave } from "./profile/useProfileSave";
import { ImportantDateType } from "./types";

export { type ShippingAddress, type DataSharingSettings, type ImportantDateType, type ProfileFormData } from "./types";

export const useProfileForm = () => {
  const { initialFormData, isLoading, user } = useProfileData();
  const { handleProfileImageUpdate: updateImage, handleRemoveImage } = useProfileImage();
  const { saveProfile } = useProfileSave();
  
  // State for managing form data
  const [formData, setFormData] = useState(initialFormData);
  
  // Initialize the interest and date managers with empty arrays initially
  // They'll be populated with the actual data once it's loaded
  const { addInterest, removeInterest } = useInterestsManager(formData.interests);
  const { addImportantDate, removeImportantDate } = useImportantDatesManager(formData.importantDates);

  // Handle profile image update
  const handleProfileImageUpdate = (imageUrl: string | null) => {
    if (imageUrl) {
      updateImage(imageUrl)
        .then(() => {
          setFormData(prev => ({
            ...prev,
            profile_image: imageUrl,
          }));
        })
        .catch(() => {
          toast.error("Failed to update profile image");
        });
    } else if (imageUrl === null) {
      handleRemoveImage()
        .then(() => {
          setFormData(prev => ({
            ...prev,
            profile_image: null,
          }));
        })
        .catch(() => {
          toast.error("Failed to remove profile image");
        });
    }
  };

  // Methods to manage interests
  const handleAddInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: [...prev.interests, interest]
    }));
    addInterest(interest);
  };

  const handleRemoveInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
    removeInterest(index);
  };

  // Methods to manage important dates
  const handleAddImportantDate = (date: ImportantDateType) => {
    setFormData(prev => ({
      ...prev,
      importantDates: [...prev.importantDates, date]
    }));
    addImportantDate(date);
  };

  const handleRemoveImportantDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      importantDates: prev.importantDates.filter((_, i) => i !== index)
    }));
    removeImportantDate(index);
  };

  // Method to save the profile
  const handleSaveProfile = async (data: any) => {
    try {
      await saveProfile(data);
      toast.success("Profile information updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      return false;
    }
  };

  return {
    initialFormData,
    isLoading,
    handleProfileImageUpdate,
    addInterest: handleAddInterest,
    removeInterest: handleRemoveInterest,
    addImportantDate: handleAddImportantDate,
    removeImportantDate: handleRemoveImportantDate,
    saveProfile: handleSaveProfile,
    user
  };
};
