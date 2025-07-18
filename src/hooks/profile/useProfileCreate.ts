
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { formatProfileForSubmission, formatBirthdayForStorage } from "@/utils/dataFormatUtils";
import { ProfileData } from "@/components/profile-setup/hooks/types";

export const useProfileCreate = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createProfile = async (profileData: ProfileData) => {
    if (!user?.id) {
      throw new Error("User must be authenticated to create profile");
    }

    setIsCreating(true);
    console.log("Creating profile for user:", user.id);
    console.log("Profile data:", JSON.stringify(profileData, null, 2));

    try {
      // Format and validate the profile data
      const formattedData = formatProfileForSubmission(profileData);
      
      // Map onboarding data to database format with proper field mapping
      const nameParts = formattedData.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Extract birth year from birthday if available
      let birthYear = new Date().getFullYear() - 25; // Default
      if (formattedData.birthday?.month && formattedData.birthday?.day) {
        // For birthday (month/day), we estimate birth year based on current age
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const birthdayThisYear = new Date(currentYear, formattedData.birthday.month - 1, formattedData.birthday.day);
        
        // If birthday hasn't happened this year yet, assume they're one year older
        if (birthdayThisYear > currentDate) {
          birthYear = currentYear - 25 - 1;
        } else {
          birthYear = currentYear - 25;
        }
      }
      
      const profileRecord = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        name: formattedData.name,
        email: formattedData.email,
        username: formattedData.username || `user_${user.id.substring(0, 8)}`,
        bio: formattedData.bio || "",
        profile_image: formattedData.profile_image || null,
        dob: formatBirthdayForStorage(formattedData.birthday),
        birth_year: birthYear,
        shipping_address: {
          address_line1: formattedData.address?.street || "",
          city: formattedData.address?.city || "",
          state: formattedData.address?.state || "",
          zip_code: formattedData.address?.zipCode || "",
          country: formattedData.address?.country || "US",
          // Add aliases for compatibility
          street: formattedData.address?.street || "",
          zipCode: formattedData.address?.zipCode || ""
        },
        interests: formattedData.interests || [],
        important_dates: (formattedData.importantDates || []).map(date => ({
          title: date.description,
          date: date.date.toISOString(),
          type: "custom",
          description: date.description
        })),
        data_sharing_settings: formattedData.data_sharing_settings,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      console.log("Formatted profile record:", JSON.stringify(profileRecord, null, 2));

      // Insert the profile record
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileRecord, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        throw error;
      }

      console.log("Profile created successfully:", data);
      return data;
    } catch (error) {
      console.error("Failed to create profile:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProfile,
    isCreating
  };
};
