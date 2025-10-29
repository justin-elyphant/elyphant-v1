
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";
import { formSchema, SettingsFormValues } from "./settingsFormSchema";
import { normalizeDataSharingSettings } from "@/utils/privacyUtils";
import { ShippingAddress, DataSharingSettings } from "@/types/profile";
import { parseBirthdayFromStorage, formatBirthdayForStorage, mapDatabaseToSettingsForm } from "@/utils/dataFormatUtils";

export const useSettingsForm = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  // Setup form with default values
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
        gift_preferences: "friends",
        email: "private"
      }
    }
  });

  // Load profile data when available
  useEffect(() => {
    if (profile && !loading) {
      // Use mapped data from the profile data hook which handles the conversion
      const mappedData = mapDatabaseToSettingsForm(profile);
      if (mappedData) {
        form.reset(mappedData);
      } else {
        form.reset({
          first_name: profile.name?.split(' ')[0] || "",
          last_name: profile.name?.split(' ').slice(1).join(' ') || "",
          name: profile.name || "",
          email: profile.email || "",
          username: profile.username || "",
          bio: profile.bio || "",
          profile_image: profile.profile_image || null,
          date_of_birth: undefined,
          address: profile.shipping_address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
          },
          interests: profile.interests || [],
          importantDates: profile.important_dates?.map(date => ({
            date: new Date(date.date),
            description: date.title || date.description || ""
          })) || [],
          data_sharing_settings: normalizeDataSharingSettings(profile.data_sharing_settings)
        });
      }
    }
  }, [profile, loading, form]);

  // Handle form submission
  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      setIsLoading(true);
      
      // Ensure all required fields in data_sharing_settings are provided
      const dataSharingSettings: DataSharingSettings = {
        dob: data.data_sharing_settings.dob || "private",
        shipping_address: data.data_sharing_settings.shipping_address || "private",
        interests: data.data_sharing_settings.interests || data.data_sharing_settings.gift_preferences || "friends",
        gift_preferences: data.data_sharing_settings.gift_preferences || data.data_sharing_settings.interests || "friends",
        email: data.data_sharing_settings.email || "private"
      };
      
      // Convert form address to API format
      const shippingAddress: ShippingAddress = {
        address_line1: data.address.street || "",
        city: data.address.city || "",
        state: data.address.state || "",
        zip_code: data.address.zipCode || "",
        country: data.address.country || "",
        // Also keep aliases for compatibility
        street: data.address.street || "",
        zipCode: data.address.zipCode || ""
      };
      
      // Format date of birth for storage
      let formattedBirthday: string | null = null;
      let birthYear: number | null = null;
      if (data.date_of_birth) {
        const date = new Date(data.date_of_birth);
        formattedBirthday = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        birthYear = date.getFullYear();
      }
      
      // Format the data for Supabase
      const updateData = {
        first_name: data.first_name,
        last_name: data.last_name,
        name: data.name || `${data.first_name} ${data.last_name}`.trim(),
        username: data.username,
        bio: data.bio,
        profile_image: data.profile_image,
        dob: formattedBirthday,
        birth_year: birthYear,
        shipping_address: shippingAddress,
        interests: data.interests,
        important_dates: data.importantDates.map(date => ({
          date: date.date.toISOString(),
          title: date.description, // Map description to title
          type: "custom"
        })),
        data_sharing_settings: dataSharingSettings
      };
      
      await updateProfile(updateData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    onSubmit,
    isLoading
  };
};
