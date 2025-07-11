
import * as z from "zod";

// Define important date type
export interface ImportantDate {
  date: Date;
  description: string;
}

// Define birthday type as month/day only
export interface BirthdayData {
  month: number;
  day: number;
}

export const formSchema = z.object({
  // Mandatory fields for enhanced onboarding
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  birth_year: z.number().min(1900).max(new Date().getFullYear(), { message: "Birth year is required" }),
  
  // Profile image is now mandatory
  profile_image: z.string().min(1, { message: "Profile photo is required" }),
  
  // Date of birth fields (mandatory)
  birthday: z.object({
    month: z.number().min(1).max(12),
    day: z.number().min(1).max(31)
  }).refine((data) => data.month && data.day, { 
    message: "Complete date of birth is required" 
  }),
  
  // Legacy compatibility field (optional now)
  name: z.string().optional(),
  
  // Optional fields
  bio: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    line2: z.string().optional(),
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
    email: z.enum(["private", "friends", "public"]),
  })
});

export type SettingsFormValues = z.infer<typeof formSchema>;

// Alias for backward compatibility
export const settingsFormSchema = formSchema;
