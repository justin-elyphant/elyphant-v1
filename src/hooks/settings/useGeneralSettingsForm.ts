
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";

// Define the form schema with safe defaults
const settingsFormSchema = z.object({
  name: z.string().min(1, "Name is required").default(""),
  email: z.string().email("Invalid email").default(""),
  bio: z.string().default(""),
  birthday: z.date().optional(),
  address: z.object({
    street: z.string().default(""),
    city: z.string().default(""),
    state: z.string().default(""),
    zipCode: z.string().default(""),
    country: z.string().default(""),
  }).default({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  }),
  interests: z.array(z.string()).default([]),
  importantDates: z.array(z.object({
    date: z.date(),
    description: z.string(),
  })).default([]),
  data_sharing_settings: z.object({
    dob: z.enum(["private", "friends", "public"]).default("private"),
    shipping_address: z.enum(["private", "friends", "public"]).default("private"),
    gift_preferences: z.enum(["private", "friends", "public"]).default("friends"),
    email: z.enum(["private", "friends", "public"]).default("private"),
  }).default({
    dob: "private",
    shipping_address: "private",
    gift_preferences: "friends",
    email: "private",
  }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const useGeneralSettingsForm = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [newImportantDate, setNewImportantDate] = useState({ date: new Date(), description: "" });

  // Setup form with safe defaults
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      birthday: undefined,
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      interests: [],
      importantDates: [],
      data_sharing_settings: {
        dob: "private",
        shipping_address: "private",
        gift_preferences: "friends",
        email: "private",
      },
    },
  });

  // Load profile data with error handling
  useEffect(() => {
    if (profile && !profileLoading) {
      try {
        console.log("Loading profile data into settings form:", profile);
        
        // Safely extract birthday
        let birthdayDate = undefined;
        if (profile.dob) {
          try {
            birthdayDate = new Date(profile.dob);
            if (isNaN(birthdayDate.getTime())) {
              console.warn("Invalid birthday date format:", profile.dob);
              birthdayDate = undefined;
            }
          } catch (e) {
            console.error("Error parsing birthday:", e);
            birthdayDate = undefined;
          }
        }
        
        // Safely extract address
        const address = {
          street: profile.shipping_address?.address_line1 || profile.shipping_address?.street || "",
          city: profile.shipping_address?.city || "",
          state: profile.shipping_address?.state || "",
          zipCode: profile.shipping_address?.zip_code || profile.shipping_address?.zipCode || "",
          country: profile.shipping_address?.country || "",
        };
        
        // Safely extract interests
        let interests: string[] = [];
        if (Array.isArray(profile.interests)) {
          interests = profile.interests.filter(Boolean);
        } else if (Array.isArray(profile.gift_preferences)) {
          interests = profile.gift_preferences
            .map((pref: any) => typeof pref === 'string' ? pref : pref?.category)
            .filter(Boolean);
        }
        
        // Safely extract important dates
        const importantDates: { date: Date; description: string }[] = [];
        if (Array.isArray(profile.important_dates)) {
          profile.important_dates.forEach((dateItem: any) => {
            if (dateItem?.date) {
              try {
                const parsedDate = new Date(dateItem.date);
                if (!isNaN(parsedDate.getTime())) {
                  importantDates.push({
                    date: parsedDate,
                    description: dateItem.description || dateItem.title || "",
                  });
                }
              } catch (e) {
                console.error("Error parsing important date:", e);
              }
            }
          });
        }
        
        // Reset form with safe data
        form.reset({
          name: profile.name || "",
          email: profile.email || user?.email || "",
          bio: profile.bio || "",
          birthday: birthdayDate,
          address,
          interests,
          importantDates,
          data_sharing_settings: {
            dob: profile.data_sharing_settings?.dob || "private",
            shipping_address: profile.data_sharing_settings?.shipping_address || "private",
            gift_preferences: profile.data_sharing_settings?.gift_preferences || "friends",
            email: profile.data_sharing_settings?.email || "private",
          },
        });
        
        console.log("Profile data loaded successfully into form");
      } catch (error) {
        console.error("Error loading profile data:", error);
        toast.error("Error loading profile data");
      }
    }
  }, [profile, profileLoading, form, user?.email]);

  // Form submission
  const onSubmit = async (data: SettingsFormValues) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData = {
        name: data.name,
        email: data.email,
        bio: data.bio,
        dob: data.birthday ? data.birthday.toISOString() : null,
        shipping_address: {
          address_line1: data.address.street,
          city: data.address.city,
          state: data.address.state,
          zip_code: data.address.zipCode,
          country: data.address.country,
          street: data.address.street,
          zipCode: data.address.zipCode,
        },
        interests: data.interests,
        important_dates: data.importantDates.map(date => ({
          date: date.date.toISOString(),
          description: date.description,
          title: date.description,
          type: "custom",
        })),
        data_sharing_settings: data.data_sharing_settings,
        updated_at: new Date().toISOString(),
      };

      await updateProfile(updateData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Interest management
  const handleAddInterest = () => {
    if (newInterest.trim()) {
      const currentInterests = form.getValues("interests");
      if (!currentInterests.includes(newInterest.trim())) {
        form.setValue("interests", [...currentInterests, newInterest.trim()]);
        setNewInterest("");
      }
    }
  };

  const handleRemoveInterest = (index: number) => {
    const currentInterests = form.getValues("interests");
    form.setValue("interests", currentInterests.filter((_, i) => i !== index));
  };

  // Important dates management
  const handleAddImportantDate = () => {
    if (newImportantDate.description.trim()) {
      const currentDates = form.getValues("importantDates");
      form.setValue("importantDates", [...currentDates, newImportantDate]);
      setNewImportantDate({ date: new Date(), description: "" });
    }
  };

  const handleRemoveImportantDate = (index: number) => {
    const currentDates = form.getValues("importantDates");
    form.setValue("importantDates", currentDates.filter((_, i) => i !== index));
  };

  return {
    form,
    isSaving,
    loading: profileLoading,
    newInterest,
    setNewInterest,
    newImportantDate,
    setNewImportantDate,
    onSubmit,
    handleAddInterest,
    handleRemoveInterest,
    handleAddImportantDate,
    handleRemoveImportantDate,
  };
};
