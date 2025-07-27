
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
      
      // Extract birth year and format birthday from the full date
      let birthYear = new Date().getFullYear() - 25; // Default
      let formattedBirthday: string | null = null;
      let fullBirthdayDate: Date | null = null;
      
      if (formattedData.date_of_birth) {
        const birthDate = new Date(formattedData.date_of_birth);
        birthYear = birthDate.getFullYear();
        formattedBirthday = `${(birthDate.getMonth() + 1).toString().padStart(2, '0')}-${birthDate.getDate().toString().padStart(2, '0')}`;
        fullBirthdayDate = birthDate;
      }
      
      // Generate a unique username by checking for conflicts
      let uniqueUsername = formattedData.username || `user_${user.id.substring(0, 8)}`;
      let usernameExists = true;
      let attempt = 0;
      
      while (usernameExists && attempt < 10) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', uniqueUsername)
          .single();
        
        if (!existingUser) {
          usernameExists = false;
        } else {
          attempt++;
          // Add a number suffix to make it unique
          const baseUsername = formattedData.username || `user_${user.id.substring(0, 8)}`;
          uniqueUsername = `${baseUsername}_${attempt}`;
        }
      }
      
      if (usernameExists) {
        // Fallback to a guaranteed unique username using user ID
        uniqueUsername = `user_${user.id.substring(0, 8)}_${Date.now()}`;
      }
      
      const profileRecord = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        name: formattedData.name,
        email: formattedData.email,
        username: uniqueUsername,
        bio: formattedData.bio || "",
        profile_image: formattedData.profile_image || null,
        dob: formattedBirthday,
        birth_year: birthYear,
        shipping_address: {
          address_line1: formattedData.address?.street || "",
          address_line2: formattedData.address?.line2 || "",
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

      // Insert the profile record with conflict resolution
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

      // Automatically create birthday entry in user_special_dates if birthday was provided
      if (fullBirthdayDate && formattedBirthday) {
        try {
          console.log("Creating birthday entry in user_special_dates");
          
          // Create the birthday date for this year (or next year if already passed)
          const today = new Date();
          const currentYear = today.getFullYear();
          const thisYearBirthday = new Date(currentYear, fullBirthdayDate.getMonth(), fullBirthdayDate.getDate());
          
          // If this year's birthday has passed, use next year's
          const birthdayDateToUse = thisYearBirthday < today 
            ? new Date(currentYear + 1, fullBirthdayDate.getMonth(), fullBirthdayDate.getDate())
            : thisYearBirthday;

          const birthdaySpecialDate = {
            user_id: user.id,
            date_type: 'birthday',
            date: birthdayDateToUse.toISOString().split('T')[0], // YYYY-MM-DD format
            visibility: 'friends', // Default visibility for birthdays
            is_recurring: true,
            recurring_type: 'yearly'
          };

          const { data: birthdayData, error: birthdayError } = await supabase
            .from('user_special_dates')
            .insert(birthdaySpecialDate)
            .select()
            .single();

          if (birthdayError) {
            console.error("Error creating birthday special date:", birthdayError);
            // Don't throw error - we don't want to fail profile creation if birthday creation fails
            toast.error("Profile created but couldn't add birthday to events");
          } else {
            console.log("Birthday special date created successfully:", birthdayData);
            toast.success("Profile created and birthday added to My Events!");
          }
        } catch (birthdayCreationError) {
          console.error("Failed to create birthday special date:", birthdayCreationError);
          // Don't throw - profile creation should succeed even if birthday creation fails
        }
      }

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
