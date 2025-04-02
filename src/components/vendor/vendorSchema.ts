
import * as z from "zod";

export const vendorFormSchema = z.object({
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  website: z.string().url({
    message: "Please enter a valid URL.",
  }),
  integrationType: z.string({
    required_error: "Please select an integration type.",
  }),
  productCategories: z.string().min(2, {
    message: "Please specify your product categories.",
  }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions.",
  }),
  markupAcknowledgment: z.boolean().refine(val => val === true, {
    message: "You must acknowledge our markup model.",
  }),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;
