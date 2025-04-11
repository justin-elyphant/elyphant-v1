
import * as z from "zod";

// Define form schema
export const formSchema = z.object({
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
