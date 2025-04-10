
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TextField } from "./form-fields/TextField";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  company: z.string().optional(),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface VendorContactFormProps {
  id?: string;
}

export const VendorContactForm = ({ id }: VendorContactFormProps) => {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });

  function onSubmit(values: ContactFormValues) {
    console.log(values);
    toast.success("Thank you for your message! Our team will get back to you soon.");
    form.reset();
  }

  return (
    <div id={id} className="py-16">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Contact Our Vendor Team</CardTitle>
          <CardDescription>
            Have questions about becoming a partner? Reach out to our vendor relations team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TextField
                control={form.control}
                name="name"
                label="Your Name"
                placeholder="John Doe"
              />
              
              <TextField
                control={form.control}
                name="email"
                label="Email Address"
                placeholder="john@example.com"
              />
              
              <TextField
                control={form.control}
                name="company"
                label="Company Name (Optional)"
                placeholder="Your Business"
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your business and what you'd like to know about our marketplace..." 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
