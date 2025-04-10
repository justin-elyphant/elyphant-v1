
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema
const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  businessType: z.string().min(1, "Please select a business type"),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface VendorContactFormProps {
  id?: string;
}

export const VendorContactForm = ({ id }: VendorContactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      businessName: "",
      email: "",
      phone: "",
      businessType: "",
      message: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    // In a real implementation, this would send data to a backend
    console.log("Form values:", values);
    
    // Simulate API call
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Thanks for your interest! We'll be in touch soon.");
      form.reset();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id={id} className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-6">Get Started Today</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business LLC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="retail">Retail Store</SelectItem>
                        <SelectItem value="restaurant">Restaurant/Food Service</SelectItem>
                        <SelectItem value="fashion">Fashion & Clothing</SelectItem>
                        <SelectItem value="sports">Sports & Recreation</SelectItem>
                        <SelectItem value="wellness">Wellness & Spa</SelectItem>
                        <SelectItem value="experience">Experience Provider</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the category that best describes your business
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us more about your business and what you're looking for..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
              
              <p className="text-sm text-gray-500 text-center">
                By submitting, you'll be contacted by Justin at justin@elyphant.com to discuss next steps.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
