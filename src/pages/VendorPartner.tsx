
import React from "react";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Store, Utensils, Shirt, Golf, Spa, CheckCircle, BarChart, Wallet, Globe } from "lucide-react";

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

const VendorPartner = () => {
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
    <MainLayout>
      <div className="bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Grow Your Business with Elyphant
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join our marketplace and connect with customers looking for meaningful gifts
            </p>
            <Button 
              size="lg"
              className="text-lg px-8 py-6" 
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Become a Partner Today
            </Button>
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Expand Your Reach</h3>
                </div>
                <p className="text-gray-600">
                  Access our growing network of gift-givers looking for unique products from businesses like yours.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <BarChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Boost Your Sales</h3>
                </div>
                <p className="text-gray-600">
                  Our gift recommendation engine promotes your products to the perfect customers at the right time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <Wallet className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Simple Revenue Model</h3>
                </div>
                <p className="text-gray-600">
                  We handle the customer experience while you focus on your products, with a straightforward 30% marketplace fee.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Types Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-10">Perfect For All Types of Businesses</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div className="flex flex-col items-center p-4">
                <Store className="h-10 w-10 text-purple-600 mb-2" />
                <span className="font-medium">Retailers</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <Utensils className="h-10 w-10 text-purple-600 mb-2" />
                <span className="font-medium">Restaurants</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <Shirt className="h-10 w-10 text-purple-600 mb-2" />
                <span className="font-medium">Fashion</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <Golf className="h-10 w-10 text-purple-600 mb-2" />
                <span className="font-medium">Golf Shops</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <Spa className="h-10 w-10 text-purple-600 mb-2" />
                <span className="font-medium">Spas</span>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-700">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Apply to Join</h3>
                <p className="text-gray-600">
                  Fill out the form below and our team will review your application
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-700">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Integrate Your Products</h3>
                <p className="text-gray-600">
                  Connect your inventory through our easy integration options
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-700">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Selling</h3>
                <p className="text-gray-600">
                  We handle marketing, payments, and customer service while you focus on fulfilment
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials (placeholder) */}
          <div className="mb-16 bg-purple-50 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-center mb-8">What Our Partners Say</h2>
            <div className="max-w-3xl mx-auto">
              <blockquote className="italic text-gray-700 text-lg text-center">
                "Since joining Elyphant, we've seen a 30% increase in sales with minimal extra work on our part. Their integration was seamless and the team is incredibly supportive."
                <footer className="text-gray-600 mt-4 font-medium">
                  — Sarah Johnson, Local Boutique Owner
                </footer>
              </blockquote>
            </div>
          </div>

          {/* Contact Form */}
          <div id="contact-form" className="max-w-2xl mx-auto">
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
                              <SelectItem value="golf">Golf Shop</SelectItem>
                              <SelectItem value="spa">Spa & Wellness</SelectItem>
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
        </div>
      </div>
    </MainLayout>
  );
};

export default VendorPartner;
