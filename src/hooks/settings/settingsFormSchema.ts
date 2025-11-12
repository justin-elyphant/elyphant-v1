
import * as z from "zod";

// Define important date type
export interface ImportantDate {
  date: Date;
  description: string;
}

export const formSchema = z.object({
  // Mandatory fields for enhanced onboarding
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
  
  // Profile image is optional and can be null
  profile_image: z.string().nullable().optional(),
  
  // Date of birth is now optional - only required during onboarding
  date_of_birth: z.date({
    invalid_type_error: "Please select a valid date"
  }).optional().refine((date) => {
    if (!date) return true; // Allow empty
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, { 
    message: "You must be between 13 and 120 years old" 
  }),
  
  // Legacy compatibility field (optional now)
  name: z.string().optional(),
  
  // Optional fields
  bio: z.string().optional(),
  address: z.object({
    street: z.string().nullable().optional(),
    line2: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    zipCode: z.string().nullable().optional(),
    country: z.string().optional().default("US"),
  }),
  interests: z.array(z.string()),
  importantDates: z.array(z.object({
    date: z.date(), 
    description: z.string()
  })),
  data_sharing_settings: z.object({
    dob: z.enum(["private", "friends", "public"]).optional(),
    shipping_address: z.enum(["private", "friends", "public"]).optional(),
    interests: z.enum(["private", "friends", "public"]).optional(),
    gift_preferences: z.enum(["private", "friends", "public"]).optional(),
    email: z.enum(["private", "friends", "public"]).optional(),
  }).optional()
});

export type SettingsFormValues = z.infer<typeof formSchema>;

// Alias for backward compatibility
export const settingsFormSchema = formSchema;
