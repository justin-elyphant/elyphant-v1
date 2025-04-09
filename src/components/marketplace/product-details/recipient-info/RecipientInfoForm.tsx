
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formSchema } from "./schema";
import { PersonalInfoFields } from "./PersonalInfoFields";
import { AddressFields } from "./AddressFields";
import { z } from "zod";

export type RecipientInfoFormData = z.infer<typeof formSchema>;

interface RecipientInfoFormProps {
  onSubmit: (data: RecipientInfoFormData) => void;
  onCancel: () => void;
  productName: string;
}

export const RecipientInfoForm: React.FC<RecipientInfoFormProps> = ({
  onSubmit,
  onCancel,
  productName
}) => {
  const { user } = useAuth();
  
  const form = useForm<RecipientInfoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientFirstName: "",
      recipientLastName: "",
      recipientEmail: "",
      recipientPhone: "",
      recipientAddress: "",
      recipientCity: "",
      recipientState: "",
      recipientZip: "",
    },
  });

  const handleSubmit = async (data: RecipientInfoFormData) => {
    try {
      // In a full implementation, we would send an invitation to the recipient via edge function
      toast.success(`Information saved for ${data.recipientFirstName}`);
      onSubmit(data);
    } catch (error) {
      console.error("Error processing recipient info:", error);
      toast.error("Failed to process recipient information");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <PersonalInfoFields control={form.control} />
        <AddressFields control={form.control} />

        <DialogFooter className="pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Continue to Payment</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
