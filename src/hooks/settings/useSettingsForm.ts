
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";
import { formSchema, SettingsFormValues } from "./settingsFormSchema";

export const useSettingsForm = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  // Setup form with default values
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      profile_image: null,
      birthday: undefined,
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
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        profile_image: profile.profile_image || null,
        birthday: profile.dob ? new Date(profile.dob) : undefined,
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
          description: date.description
        })) || [],
        data_sharing_settings: profile.data_sharing_settings || {
          dob: "private",
          shipping_address: "private",
          gift_preferences: "friends",
          email: "private"
        }
      });
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
      
      // Format the data for Supabase
      const updateData = {
        name: data.name,
        bio: data.bio,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: data.address,
        interests: data.interests,
        important_dates: data.importantDates.map(date => ({
          date: date.date.toISOString(),
          description: date.description
        })),
        data_sharing_settings: data.data_sharing_settings
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
