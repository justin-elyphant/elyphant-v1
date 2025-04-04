
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  recipientFirstName: z.string().min(1, "First name is required"),
  recipientLastName: z.string().min(1, "Last name is required"),
  recipientEmail: z.string().email("Please enter a valid email"),
  recipientPhone: z.string().optional(),
  recipientAddress: z.string().min(1, "Address is required"),
  recipientCity: z.string().min(1, "City is required"),
  recipientState: z.string().min(1, "State is required"),
  recipientZip: z.string().min(1, "ZIP code is required"),
});

type RecipientInfoFormData = z.infer<typeof formSchema>;

interface RecipientInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RecipientInfoFormData) => void;
  productName: string;
}

const RecipientInfoDialog: React.FC<RecipientInfoDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  productName,
}) => {
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
        // In a real implementation, we would call an edge function here
        // to send the invitation email and SMS
        console.log("Sending invitation to:", data.recipientEmail);
        
        toast.success(`Invitation will be sent to ${data.recipientEmail}`);
      } else {
        console.log("Recipient already has an account");
      }
      
      onSubmit(data);
    } catch (error) {
      console.error("Error processing recipient info:", error);
      toast.error("Failed to process recipient information");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gift Recipient Details</DialogTitle>
          <DialogDescription>
            Enter information about who will receive "{productName}". We'll notify them about their gift.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipientFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="recipientCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Continue to Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RecipientInfoDialog;
