
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";
import { formSchema, SettingsFormValues } from "./settingsFormSchema";
import { useProfileData } from "./useProfileData";
import { mapSettingsFormToDatabase } from "@/utils/profileDataMapper";
import { isUsernameTaken, validateUsernameFormat } from "@/utils/usernameValidation";

export const useGeneralSettingsForm = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading, refetchProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [newImportantDate, setNewImportantDate] = useState({
    date: new Date(),
    description: ""
  });
  const [isAutoSavingInterests, setIsAutoSavingInterests] = useState(false);
  const [isAutoSavingDates, setIsAutoSavingDates] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<SettingsFormValues | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Setup form with proper default values
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      name: "",
      email: "",
      username: "",
      bio: "",
      profile_image: null,
      date_of_birth: undefined,
      address: {
        street: "",
        line2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US"
      },
      interests: [],
      importantDates: [],
      data_sharing_settings: {
        dob: "private",
        shipping_address: "private",
        interests: "private",
        gift_preferences: "friends",
        email: "private"
      }
    }
  });

  // Use the profile data hook for consistent data loading
  const {
    user: profileUser,
    profile: profileData,
    loading: profileLoading,
    loadProfileData,
    refetchProfile: refetchProfileData,
    dataLoadError
  } = useProfileData(form, setInitialFormValues);

  console.log("🔄 useGeneralSettingsForm - Profile data:", profileData);
  console.log("🔄 useGeneralSettingsForm - Form values:", form.getValues());
  console.log("🔄 useGeneralSettingsForm - Loading states:", { loading, profileLoading });

  // Force refresh profile data when component mounts
  useEffect(() => {
    const forceRefreshProfileData = async () => {
      console.log("🔄 Force refreshing profile data for settings");
      try {
        await refetchProfile();
        await refetchProfileData();
      } catch (error) {
        console.error("❌ Error force refreshing profile data:", error);
      }
    };

    if (user && !loading && !profileLoading) {
      forceRefreshProfileData();
    }
  }, [user, refetchProfile, refetchProfileData]);

  // Watch for form changes to detect unsaved changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === "change" && initialFormValues) {
        const currentValues = form.getValues();
        const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(initialFormValues);
        setHasUnsavedChanges(hasChanges);
        
        console.log("🔄 Form value changed:", { name, hasChanges });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, initialFormValues]);

  // Debug form reset effectiveness
  useEffect(() => {
    const currentValues = form.getValues();
    console.log("🔄 Current form values after potential reset:", {
      first_name: currentValues.first_name,
      last_name: currentValues.last_name,
      date_of_birth: currentValues.date_of_birth,
      address: currentValues.address,
      interests: currentValues.interests?.length || 0,
      importantDates: currentValues.importantDates?.length || 0
    });
  }, [form, profileData]);

  // Handle form submission with proper error handling
  const onSubmit = async (data: SettingsFormValues, activeTab?: string) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      setIsSaving(true);
      console.log("🔄 Submitting form data:", data);
      console.log("🔍 Form first_name:", data.first_name, "last_name:", data.last_name);
      
      // Check if username has changed and if it's already taken
      const currentUsername = profileData?.username;
      const newUsername = data.username?.trim();
      
      if (newUsername && newUsername !== currentUsername) {
        console.log("🔍 Checking username availability:", newUsername);
        
        // First validate format
        const formatValidation = validateUsernameFormat(newUsername);
        if (!formatValidation.isValid) {
          toast.error("Invalid username format", {
            description: formatValidation.error
          });
          form.setError("username", {
            type: "manual",
            message: formatValidation.error || "Invalid format"
          });
          setIsSaving(false);
          return { success: false };
        }
        
        // Then check availability
        try {
          const usernameTaken = await isUsernameTaken(newUsername, user.id);
          
          if (usernameTaken) {
            toast.error("Username already taken", {
              description: `The username "${newUsername}" is already in use. Please choose a different one.`
            });
            
            form.setError("username", {
              type: "manual",
              message: "This username is already taken"
            });
            
            setIsSaving(false);
            return { success: false };
          }
        } catch (error) {
          console.error("❌ Error checking username:", error);
          toast.error("Unable to verify username availability", {
            description: "Please try again in a moment."
          });
          setIsSaving(false);
          return { success: false };
        }
      }
      
      // Use the enhanced mapper to convert form data to database format
      const databaseData = mapSettingsFormToDatabase(data);
      console.log("🔄 Mapped database data:", databaseData);
      console.log("🔍 Database first_name:", databaseData.first_name, "last_name:", databaseData.last_name);
      
      const result = await updateProfile(databaseData);
      console.log("✅ Update profile result:", result);
      
      // Force a profile refresh to sync all components
      await refetchProfile();
      
      // Update initial values to reflect the save
      setInitialFormValues(data);
      setHasUnsavedChanges(false);
      console.log("🔄 Updated initial form values after save");
      
      // Show appropriate success message based on active tab
      if (activeTab === "address") {
        toast.success("Address saved successfully");
      } else {
        toast.success("Profile updated successfully");
      }
      
      return { success: true, result };
    } catch (error) {
      console.error("❌ Failed to update profile:", error);
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save interests
  const handleAddInterest = async () => {
    if (!newInterest.trim() || !user) return;
    
    try {
      setIsAutoSavingInterests(true);
      const currentInterests = form.getValues("interests") || [];
      const updatedInterests = [...currentInterests, newInterest.trim()];
      
      form.setValue("interests", updatedInterests);
      await updateProfile({ interests: updatedInterests });
      
      setNewInterest("");
      toast.success("Interest added successfully");
    } catch (error) {
      console.error("❌ Error adding interest:", error);
      toast.error("Failed to add interest");
    } finally {
      setIsAutoSavingInterests(false);
    }
  };

  const handleRemoveInterest = async (index: number) => {
    if (!user) return;
    
    try {
      setIsAutoSavingInterests(true);
      const currentInterests = form.getValues("interests") || [];
      const updatedInterests = currentInterests.filter((_, i) => i !== index);
      
      form.setValue("interests", updatedInterests);
      await updateProfile({ interests: updatedInterests });
      
      toast.success("Interest removed successfully");
    } catch (error) {
      console.error("❌ Error removing interest:", error);
      toast.error("Failed to remove interest");
    } finally {
      setIsAutoSavingInterests(false);
    }
  };

  // Auto-save important dates
  const handleAddImportantDate = async () => {
    if (!newImportantDate.description.trim() || !user) return;
    
    try {
      setIsAutoSavingDates(true);
      const currentDates = form.getValues("importantDates") || [];
      const updatedDates = [...currentDates, newImportantDate];
      
      form.setValue("importantDates", updatedDates);
      
      // Convert to API format for saving
      const apiDates = updatedDates.map(date => ({
        date: date.date.toISOString(),
        title: date.description,
        type: "custom"
      }));
      
      await updateProfile({ important_dates: apiDates });
      
      setNewImportantDate({ date: new Date(), description: "" });
      toast.success("Important date added successfully");
    } catch (error) {
      console.error("❌ Error adding important date:", error);
      toast.error("Failed to add important date");
    } finally {
      setIsAutoSavingDates(false);
    }
  };

  const handleRemoveImportantDate = async (index: number) => {
    if (!user) return;
    
    try {
      setIsAutoSavingDates(true);
      const currentDates = form.getValues("importantDates") || [];
      const updatedDates = currentDates.filter((_, i) => i !== index);
      
      form.setValue("importantDates", updatedDates);
      
      // Convert to API format for saving
      const apiDates = updatedDates.map(date => ({
        date: date.date.toISOString(),
        title: date.description,
        type: "custom"
      }));
      
      await updateProfile({ important_dates: apiDates });
      
      toast.success("Important date removed successfully");
    } catch (error) {
      console.error("❌ Error removing important date:", error);
      toast.error("Failed to remove important date");
    } finally {
      setIsAutoSavingDates(false);
    }
  };

  return {
    form,
    isSaving,
    loading: loading || profileLoading,
    newInterest,
    setNewInterest,
    newImportantDate,
    setNewImportantDate,
    onSubmit,
    handleAddInterest,
    handleRemoveInterest,
    handleAddImportantDate,
    handleRemoveImportantDate,
    hasUnsavedChanges,
    isAutoSavingInterests,
    isAutoSavingDates,
    refetchProfile: refetchProfileData,
    dataLoadError
  };
};
