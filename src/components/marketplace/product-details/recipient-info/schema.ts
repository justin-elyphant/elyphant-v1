
import { z } from "zod";

export const formSchema = z.object({
  recipientFirstName: z.string().min(1, "First name is required"),
  recipientLastName: z.string().min(1, "Last name is required"),
  recipientEmail: z.string().email("Please enter a valid email"),
  recipientPhone: z.string().optional(),
  recipientAddress: z.string().min(1, "Address is required"),
  recipientCity: z.string().min(1, "City is required"),
  recipientState: z.string().min(1, "State is required"),
  recipientZip: z.string().min(1, "ZIP code is required"),
});
