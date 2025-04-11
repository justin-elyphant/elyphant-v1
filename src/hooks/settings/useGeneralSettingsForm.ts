
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { ShippingAddress, DataSharingSettings, GiftPreference, ImportantDate } from "@/types/supabase";

// Define form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z.string().optional(),
  profile_image: z.string().nullable().optional(),
  birthday: z.date().nullable().optional(),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  interests: z.array(z.string()),
  importantDates: z.array(z.object({
    date: z.date(),
    description: z.string()
  })),
  data_sharing_settings: z.object({
    dob: z.enum(["private", "friends", "public"]),
    shipping_address: z.enum(["private", "friends", "public"]),
    gift_preferences: z.enum(["private", "friends", "public"]),
  })
});

export type SettingsFormValues = z.infer<typeof formSchema>;

// Define a type for our newImportantDate state that matches the required fields
export interface NewImportantDateState {
  date: Date | undefined;
  description: string;
}

export const useGeneralSettingsForm = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [newImportantDate, setNewImportantDate] = useState<NewImportantDateState>({
    date: undefined,
    description: ""
  });
  
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

  // Load profile data when available
  const loadProfileData = () => {
    if (profile && !loading) {
      console.log("Loading profile data into settings form:", profile);
      
      // Convert birthday string to Date if available
      let birthdayDate = undefined;
      if (profile.dob) {
        try {
          birthdayDate = new Date(profile.dob);
        } catch (e) {
          console.error("Error parsing birthday date:", e);
        }
      }
      
      // Convert important dates if available
      const importantDates: {date: Date, description: string}[] = [];
      if (profile.important_dates && Array.isArray(profile.important_dates)) {
        profile.important_dates.forEach((date: any) => {
          if (date.date && date.description) {
            importantDates.push({
              date: new Date(date.date),
              description: date.description
            });
          }
        });
      }
      
      // Extract interests from gift preferences if available
      let interests: string[] = [];
      if (profile.gift_preferences && Array.isArray(profile.gift_preferences)) {
        interests = profile.gift_preferences.map((pref: any) => 
          typeof pref === 'string' ? pref : (pref.category || '')
        ).filter(Boolean);
      }
      
      // Map shipping_address to address
      const address = profile.shipping_address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };
      
      form.reset({
        name: profile.name || '',
        email: profile.email || user?.email || '',
        bio: profile.bio || '',
        profile_image: profile.profile_image,
        birthday: birthdayDate,
        address: address,
        interests: interests,
        importantDates: importantDates,
        data_sharing_settings: profile.data_sharing_settings || {
          dob: "private",
          shipping_address: "private",
          gift_preferences: "friends"
        }
      });
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsSaving(true);
      console.log("Submitting profile data:", data);
      
      // Format gift preferences for storage, ensuring importance is one of the allowed values
      const gift_preferences: GiftPreference[] = data.interests.map(interest => ({
        category: interest,
        importance: "medium" as "high" | "medium" | "low" // Explicitly casting to the allowed literal types
      }));
      
      // Format important dates
      const important_dates: ImportantDate[] = data.importantDates.map(date => ({
        date: date.date.toISOString(),
        description: date.description
      }));
      
      // Prepare update data
      const updateData = {
        name: data.name,
        email: data.email,
        bio: data.bio,
        profile_image: data.profile_image,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: data.address as ShippingAddress,
        gift_preferences: gift_preferences,
        important_dates: important_dates,
        data_sharing_settings: data.data_sharing_settings as DataSharingSettings,
        updated_at: new Date().toISOString()
      };
      
      await updateProfile(updateData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    const currentInterests = form.getValues("interests");
    if (!currentInterests.includes(newInterest.trim())) {
      form.setValue("interests", [...currentInterests, newInterest.trim()]);
    }
    setNewInterest("");
  };

  const handleRemoveInterest = (index: number) => {
    const currentInterests = form.getValues("interests");
    form.setValue(
      "interests", 
      currentInterests.filter((_, i) => i !== index)
    );
  };

  const handleAddImportantDate = () => {
    if (!newImportantDate.date || !newImportantDate.description.trim()) return;
    
    const currentDates = form.getValues("importantDates");
    
    // Create a properly typed ImportantDate object
    const newDate: {date: Date, description: string} = {
      date: newImportantDate.date,
      description: newImportantDate.description.trim()
    };
    
    // Add the new date to the form
    form.setValue("importantDates", [...currentDates, newDate]);
    
    // Reset the form
    setNewImportantDate({
      date: undefined,
      description: ""
    });
  };

  const handleRemoveImportantDate = (index: number) => {
    const currentDates = form.getValues("importantDates");
    form.setValue(
      "importantDates", 
      currentDates.filter((_, i) => i !== index)
    );
  };

  return {
    user,
    form,
    isSaving,
    loading,
    newInterest,
    setNewInterest,
    newImportantDate,
    setNewImportantDate,
    loadProfileData,
    onSubmit,
    handleAddInterest,
    handleRemoveInterest,
    handleAddImportantDate,
    handleRemoveImportantDate
  };
};
