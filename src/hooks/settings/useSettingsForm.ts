
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { formSchema, SettingsFormValues } from "./settingsFormSchema";
import { toast } from "sonner";
import { useEffect } from "react";

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
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        profile_image: profile.profile_image,
        birthday: profile.dob ? new Date(profile.dob) : null,
        address: profile.shipping_address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: ""
        },
        interests: profile.gift_preferences?.map(pref => 
          typeof pref === 'string' ? pref : pref.category
        ) || [],
        importantDates: profile.important_dates?.map(date => ({
          date: new Date(date.date),
          description: date.description
        })) || [],
        data_sharing_settings: profile.data_sharing_settings || {
          dob: "private",
          shipping_address: "private",
          gift_preferences: "friends"
        }
      });
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
        data_sharing_settings: data.data_sharing_settings
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
