
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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

export type RecipientInfoFormData = React.ComponentProps<typeof RecipientInfoDialog>["onSubmit"] extends (data: infer T) => void ? T : never;

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
      // Check if the recipient already has an account
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.recipientEmail)
        .single();

      // Send invitation if the user doesn't exist
      if (!existingUser) {
        // Call the Edge Function to send invitation
        const response = await supabase.functions.invoke('send-gift-invitation', {
          body: {
            recipientFirstName: data.recipientFirstName,
            recipientLastName: data.recipientLastName,
            recipientEmail: data.recipientEmail,
            recipientPhone: data.recipientPhone,
            senderName: user?.user_metadata?.name || 'A friend',
            senderUserId: user?.id, // Include the sender's user ID
            productName
          }
        });

        if (response.error) {
          throw new Error(response.error);
        }
        
        toast.success(`Invitation sent to ${data.recipientEmail}`);
      } else {
        console.log("Recipient already has an account");
        // If the recipient already has an account, we could automatically create a connection here
        toast.success(`${data.recipientFirstName} already has an account. They'll be notified about their gift!`);
      }
      
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
