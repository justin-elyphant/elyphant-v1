import * as z from "zod";

export const vendorProductSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  price: z.coerce.number().positive("Price must be greater than 0").max(99999, "Price must be less than $99,999"),
  category: z.string().min(1, "Please select a category"),
  brand: z.string().trim().min(1, "Brand is required").max(100),
  sku: z.string().trim().max(50).optional(),
  image_url: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  fulfillment_type: z.enum(["physical", "digital", "pickup"]).default("physical"),
  status: z.enum(["active", "draft"]).default("draft"),
});

export type VendorProductFormValues = z.infer<typeof vendorProductSchema>;

export const PRODUCT_CATEGORIES = [
  "Flowers & Plants",
  "Food & Beverages",
  "Clothing & Apparel",
  "Accessories & Jewelry",
  "Home & Decor",
  "Beauty & Wellness",
  "Electronics",
  "Books & Stationery",
  "Toys & Games",
  "Art & Crafts",
  "Sports & Outdoors",
  "Pet Supplies",
  "Other",
] as const;

// CSV template columns matching the schema
export const CSV_COLUMNS = [
  "title",
  "description",
  "price",
  "category",
  "brand",
  "sku",
  "image_url",
  "fulfillment_type",
  "status",
] as const;
