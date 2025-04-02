
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { vendorFormSchema, type VendorFormValues } from "./vendorSchema";
import { MarketplaceModelCard } from "./MarketplaceModelCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const VendorApplicationForm = () => {
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      companyName: "",
      email: "",
      website: "",
      integrationType: "",
      productCategories: "",
      acceptTerms: false,
      markupAcknowledgment: false,
    },
  });

  function onSubmit(values: VendorFormValues) {
    console.log(values);
    toast.success("Vendor application submitted successfully! We'll begin the onboarding process to import your products.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Application</CardTitle>
        <CardDescription>
          Apply to have your products featured on the Elyphant marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="integrationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Integration Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an integration type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="shopify">Shopify Store</SelectItem>
                      <SelectItem value="directapi">Direct API</SelectItem>
                      <SelectItem value="manual">Manual Product Upload</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how we'll import your products to our marketplace.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="productCategories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Categories</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Electronics, Clothing, Home Goods" {...field} />
                  </FormControl>
                  <FormDescription>
                    List the main categories of products you sell.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <MarketplaceModelCard />
            
            <FormField
              control={form.control}
              name="markupAcknowledgment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I understand the 30% markup model
                    </FormLabel>
                    <FormDescription>
                      I acknowledge that Elyphant will list my products with a 30% 
                      markup and handle all customer interactions and payments.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I accept the terms and conditions
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you agree to our terms of service,
                      privacy policy, and vendor agreement.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">Submit Application</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
