
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
import ContextualHelp from "@/components/help/ContextualHelp";
import { GiftSchedulingOptions } from "@/components/marketplace/checkout/GiftScheduling";

export type RecipientInfoFormData = z.infer<typeof formSchema>;

interface RecipientInfoFormProps {
  onSubmit: (data: RecipientInfoFormData & { giftScheduling?: GiftSchedulingOptions }) => void;
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

  // Gift scheduling options state
  const [giftScheduling, setGiftScheduling] = React.useState<GiftSchedulingOptions>({
    scheduleDelivery: false,
    sendGiftMessage: false,
    isSurprise: false,
  });

  const handleSubmit = async (data: RecipientInfoFormData) => {
    try {
      // In a full implementation, we would send an invitation to the recipient via edge function
      toast.success(`Information saved for ${data.recipientFirstName}`);
      
      // Include gift scheduling options with the form data
      onSubmit({
        ...data,
        giftScheduling,
      });
    } catch (error) {
      console.error("Error processing recipient info:", error);
      toast.error("Failed to process recipient information");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Recipient Information</h3>
          <ContextualHelp
            id="recipient-info"
            title="Recipient Information"
            content="Enter the details of the person who will receive this gift. Their shipping address and contact information are required for delivery."
          />
        </div>
        
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

export default RecipientInfoForm;
