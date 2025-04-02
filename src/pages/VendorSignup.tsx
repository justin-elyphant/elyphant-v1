
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const formSchema = z.object({
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

const VendorSignup = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast.success("Vendor application submitted successfully! We'll begin the onboarding process to import your products.");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Become a Vendor</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
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
                  
                  <Card className="bg-muted/30 border-muted">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">Our Marketplace Model</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Elyphant handles all customer interactions, payments, and fulfillment coordination:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2 mb-3">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>We import your products and display them on our marketplace</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>Products are listed with a 30% markup as our convenience fee</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>We handle all customer payments through our integrated checkout</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>You receive orders directly and fulfill them to the customer</span>
                        </li>
                      </ul>
                      
                      <Collapsible className="w-full">
                        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-left">
                          <span>Payment Details</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="text-sm text-muted-foreground pt-2">
                          <p>We process the full payment from customers (including our 30% markup). Your share (70% of the original product price) is transferred to you within 3-5 business days of successful delivery.</p>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                  
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
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Benefits of Joining</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Expand Your Reach</h3>
                <p className="text-sm text-muted-foreground">Connect with new customers across our platform.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Focus on Your Products</h3>
                <p className="text-sm text-muted-foreground">We handle customer service, payments, and the shopping experience.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Easy Integration</h3>
                <p className="text-sm text-muted-foreground">Simple connection with Shopify or other platforms.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-1">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">Get insights into your products' performance on our platform.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;
