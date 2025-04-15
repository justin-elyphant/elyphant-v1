
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { formSchema } from "./settingsFormSchema";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export const useProfileForm = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile, refetchProfile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up the form with zod resolver
  const form = useForm({
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

  // Load profile data when it becomes available
  useEffect(() => {
    if (profile && !profileLoading) {
      console.log("Loading profile data into form:", profile);
      
      // Parse date strings into Date objects
      let birthdayDate = profile.dob ? new Date(profile.dob) : null;
      
      // Extract interests from gift preferences
      const interests = Array.isArray(profile.gift_preferences) 
        ? profile.gift_preferences.map(pref => 
            typeof pref === 'string' ? pref : pref.category
          )
        : [];
      
      // Format important dates
      const importantDates = Array.isArray(profile.important_dates)
        ? profile.important_dates.map(date => ({
            date: new Date(date.date),
            description: date.description
          }))
        : [];
      
      // Set form values
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        profile_image: profile.profile_image,
        birthday: birthdayDate,
        address: profile.shipping_address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: ""
        },
        interests: interests,
        importantDates: importantDates,
        data_sharing_settings: profile.data_sharing_settings || {
          dob: "private",
          shipping_address: "private",
          gift_preferences: "friends"
        }
      });
      
      console.log("Form reset with profile data");
    }
  }, [profile, profileLoading, form]);

  // Handle form submission with better logging
  const onSubmit = async (data) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting profile data:", data);
      
      // Format the data for storage
      const formattedData = {
        name: data.name,
        email: data.email,
        bio: data.bio || `Hi, I'm ${data.name}`,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: data.address,
        gift_preferences: data.interests.map(interest => ({
          category: interest,
          importance: "medium"
        })),
        important_dates: data.importantDates.map(date => ({
          date: date.date.toISOString(),
          description: date.description
        })),
        data_sharing_settings: data.data_sharing_settings,
        updated_at: new Date().toISOString(),
        // Set onboarding_completed to true to indicate profile is complete
        onboarding_completed: true
      };

      // Directly update the profiles table
      const { error } = await supabase
        .from('profiles')
        .update(formattedData)
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Refetch profile data after update
      await refetchProfile();
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isLoading: profileLoading || isSubmitting,
    user
  };
};

export default useProfileForm;
