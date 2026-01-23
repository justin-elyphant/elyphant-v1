
import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(4, "Valid postal/zip code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(10, "Phone required for delivery notifications").optional(),
});

export const dataSharingSchema = z.object({
  dob: z.enum(["public", "friends", "private"]),
  shipping_address: z.enum(["public", "friends", "private"]),
  gift_preferences: z.enum(["public", "friends", "private"]),
});

export const importantDateSchema = z.object({
  date: z.date(),
  description: z.string().min(1, "Description is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required").optional(),
  username: z.string().min(3, "Username is required").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  birthday: z.date().optional(),
  address: addressSchema,
  interests: z.array(z.string()),
  importantDates: z.array(importantDateSchema),
  profile_image: z.string().nullable().optional(),
  data_sharing_settings: dataSharingSchema,
});

export type ProfileFormSchema = z.infer<typeof profileSchema>;
export type ImportantDateType = z.infer<typeof importantDateSchema>;
