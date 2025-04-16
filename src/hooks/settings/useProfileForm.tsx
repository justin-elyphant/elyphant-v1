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
      console.log("Loading profile data into form:", JSON.stringify(profile, null, 2));
      
      // Parse date strings into Date objects
      let birthdayDate = null;
      if (profile.dob) {
        try {
          birthdayDate = new Date(profile.dob);
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
      const interests = [];
      if (profile.gift_preferences) {
        if (Array.isArray(profile.gift_preferences)) {
          profile.gift_preferences.forEach(pref => {
            if (typeof pref === 'string') {
              interests.push(pref);
            } else if (pref && typeof pref === 'object' && 'category' in pref) {
              interests.push(pref.category);
            }
          });
        } else {
          console.warn("gift_preferences is not an array:", profile.gift_preferences);
        }
      }
      
      // Format important dates
      const importantDates = [];
      if (profile.important_dates) {
        if (Array.isArray(profile.important_dates)) {
          profile.important_dates.forEach(date => {
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
          });
        } else {
          console.warn("important_dates is not an array:", profile.important_dates);
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
        dob: profile.data_sharing_settings?.dob || "private",
        shipping_address: profile.data_sharing_settings?.shipping_address || "private",
        gift_preferences: profile.data_sharing_settings?.gift_preferences || "friends"
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

  // Handle form submission with better logging and retry mechanism
  const onSubmit = async (data) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting profile data:", JSON.stringify(data, null, 2));
      
      // Format the data for storage - ensure names match DB schema exactly
      const formattedData = {
        // Set ID to ensure proper RLS check 
        id: user.id,
        name: data.name,
        email: data.email,
        bio: data.bio || `Hi, I'm ${data.name}`,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: data.address || {},
        gift_preferences: data.interests.map(interest => ({
          category: interest,
          importance: "medium"
        })),
        important_dates: data.importantDates.map(date => ({
          date: date.date.toISOString(),
          description: date.description
        })),
        data_sharing_settings: data.data_sharing_settings || {
          dob: "private", 
          shipping_address: "private", 
          gift_preferences: "friends"
        },
        updated_at: new Date().toISOString(),
        // Set onboarding_completed to true to indicate profile is complete
        onboarding_completed: true
      };

      // Log the exact payload being sent to Supabase
      console.log("SETTINGS FORM: EXACT PAYLOAD FOR PROFILE UPDATE:", JSON.stringify(formattedData, null, 2));
      console.log("SETTINGS FORM: User ID for RLS:", user.id);
      console.log("SETTINGS FORM: Profile data keys:", Object.keys(formattedData));
      console.log("SETTINGS FORM: Has shipping_address:", !!formattedData.shipping_address);
      console.log("SETTINGS FORM: Has important_dates:", !!formattedData.important_dates && Array.isArray(formattedData.important_dates));
      console.log("SETTINGS FORM: Has gift_preferences:", !!formattedData.gift_preferences && Array.isArray(formattedData.gift_preferences));

      // Try multiple times to update the profile
      let attempts = 0;
      let success = false;
      
      while (attempts < 3 && !success) {
        attempts++;
        console.log(`SETTINGS FORM: Attempt ${attempts} to update profile`);
        
        try {
          // Update profile in Supabase
          const { data: responseData, error } = await supabase
            .from('profiles')
            .upsert(formattedData, { 
              onConflict: 'id' 
            });
          
          if (error) {
            console.error(`SETTINGS FORM: Error updating profile (attempt ${attempts}):`, error);
            if (attempts === 3) throw error;
          } else {
            console.log("Profile updated successfully from settings. Response:", responseData);
            success = true;
          }
        } catch (error) {
          console.error(`SETTINGS FORM: Error in upsert operation (attempt ${attempts}):`, error);
          // On last attempt, throw to exit the while loop
          if (attempts === 3) throw error;
          // Otherwise wait and try again
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (success) {
        // Refetch profile data after update
        await refetchProfile();
        
        toast.success("Profile updated successfully");
      } else {
        throw new Error("Failed to update profile after multiple attempts");
      }
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
