
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
  // New mandatory fields
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  // Legacy compatibility field
  name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  bio: z.string().optional(),
  profile_image: z.string().nullable().optional(),
  birthday: z.object({
    month: z.number().min(1).max(12),
    day: z.number().min(1).max(31)
  }).nullable().optional(),
  birth_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
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
