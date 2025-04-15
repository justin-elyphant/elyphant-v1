
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { formSchema, SettingsFormValues } from "./settingsFormSchema";
import { toast } from "sonner";
import { useEffect } from "react";
import { DataSharingSettings, SharingLevel } from "@/types/supabase";

// Define the valid importance values
type Importance = "low" | "medium" | "high";

export const useSettingsForm = () => {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      profile_image: null,
      birthday: null,
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      },
      interests: [],
      importantDates: [],
      data_sharing_settings: {
        dob: "private",
        shipping_address: "private",
        gift_preferences: "friends"
      }
    }
  });

  // Load profile data into form when available
  useEffect(() => {
    if (profile && !profileLoading) {
      console.log("Setting form values from profile:", profile);
      
      // Convert birthday string to Date if available
      let birthdayDate = null;
      if (profile.dob) {
        try {
          birthdayDate = new Date(profile.dob);
          // Check if date is valid
          if (isNaN(birthdayDate.getTime())) {
            console.warn("Invalid date format for birthday:", profile.dob);
            birthdayDate = null;
          }
        } catch (e) {
          console.error("Error parsing birthday date:", e);
          birthdayDate = null;
        }
      }
      
      // Extract interests from gift preferences
      const interests: string[] = [];
      if (profile.gift_preferences && Array.isArray(profile.gift_preferences)) {
        profile.gift_preferences.forEach(pref => {
          if (typeof pref === 'string') {
            interests.push(pref);
          } else if (pref && typeof pref === 'object' && 'category' in pref) {
            interests.push(pref.category);
          }
        });
      }
      
      // Extract important dates if available
      const importantDates = [];
      if (profile.important_dates && Array.isArray(profile.important_dates)) {
        for (const date of profile.important_dates) {
          if (date && date.date && date.description) {
            try {
              const parsedDate = new Date(date.date);
              if (!isNaN(parsedDate.getTime())) {
                importantDates.push({
                  date: parsedDate,
                  description: date.description
                });
              }
            } catch (e) {
              console.error("Error parsing important date:", e);
            }
          }
        }
      }

      // Ensure we have a valid shipping address object
      const address = {
        street: profile.shipping_address?.street || "",
        city: profile.shipping_address?.city || "",
        state: profile.shipping_address?.state || "",
        zipCode: profile.shipping_address?.zipCode || "",
        country: profile.shipping_address?.country || ""
      };

      // Ensure we have valid data sharing settings
      const dataSharingSettings = {
        dob: (profile.data_sharing_settings?.dob || "private") as SharingLevel,
        shipping_address: (profile.data_sharing_settings?.shipping_address || "private") as SharingLevel,
        gift_preferences: (profile.data_sharing_settings?.gift_preferences || "friends") as SharingLevel
      };

      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        profile_image: profile.profile_image,
        birthday: birthdayDate,
        address: address,
        interests: interests,
        importantDates: importantDates,
        data_sharing_settings: dataSharingSettings
      });
      
      console.log("Form reset with profile data");
    }
  }, [profile, profileLoading, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      // Format the data for storage
      const formattedData = {
        name: data.name,
        email: data.email,
        bio: data.bio || `Hi, I'm ${data.name}`,
        profile_image: data.profile_image,
        dob: data.birthday?.toISOString(),
        shipping_address: {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          zipCode: data.address.zipCode,
          country: data.address.country
        },
        gift_preferences: data.interests.map(interest => ({
          category: interest,
          importance: "medium" as Importance // Explicitly type as Importance
        })),
        important_dates: data.importantDates.map(date => ({
          date: date.date.toISOString(),
          description: date.description
        })),
        // Ensure all required properties are defined in data_sharing_settings
        data_sharing_settings: {
          dob: data.data_sharing_settings.dob as SharingLevel,
          shipping_address: data.data_sharing_settings.shipping_address as SharingLevel,
          gift_preferences: data.data_sharing_settings.gift_preferences as SharingLevel
        } as DataSharingSettings
      };

      await updateProfile(formattedData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to save profile changes");
    }
  };

  return {
    form,
    onSubmit,
    isLoading: profileLoading
  };
};
