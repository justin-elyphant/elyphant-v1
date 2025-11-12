import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";
import { PasswordInput } from "@/components/ui/password-input";

const betaSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  birthday: z.date({
    required_error: "Date of birth is required",
  }).refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, "You must be between 13 and 120 years old"),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(4, "Valid zip code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  interests: z.array(z.string()).optional(),
});

type BetaSignupFormData = z.infer<typeof betaSignupSchema>;

interface StreamlinedSignUpFormProps {
  onComplete: (formData: BetaSignupFormData) => void;
}

const StreamlinedSignUpForm: React.FC<StreamlinedSignUpFormProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BetaSignupFormData>({
    resolver: zodResolver(betaSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      address: {
        street: "",
        line2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US"
      },
      interests: []
    }
  });

  // Load stored data from localStorage on component mount
  useEffect(() => {
    const completionState = LocalStorageService.getProfileCompletionState();
    if (completionState?.firstName || completionState?.lastName || completionState?.email) {
      console.log('Pre-populating form with stored data:', completionState);
      
      form.setValue('firstName', completionState.firstName || "");
      form.setValue('lastName', completionState.lastName || "");
      form.setValue('email', completionState.email || "");
    }
  }, [form]);

  const handleAddressSelect = (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    form.setValue('address.street', address.address);
    form.setValue('address.city', address.city);
    form.setValue('address.state', address.state);
    form.setValue('address.zipCode', address.zipCode);
    form.setValue('address.country', address.country);
  };

  const onSubmit = async (data: BetaSignupFormData) => {
    try {
      setIsLoading(true);
      console.log("🚀 Beta profile form completed:", data);
      
      // Store all collected data in localStorage
      LocalStorageService.setProfileCompletionState({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        step: 'completed',
        source: 'email'
      });
      
      // Store additional profile data temporarily
      localStorage.setItem('beta_signup_data', JSON.stringify({
        ...data,
        birthday: data.birthday // Send Date object - useProfileUpdate will normalize to MM-DD
      }));
      
      toast.success("Profile collected! Creating your account...");
      onComplete(data);
      
    } catch (error: any) {
      console.error("Beta profile form error:", error);
      toast.error("Something went wrong", {
        description: "Please try again or contact support."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Create a secure password" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Birthday */}
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  disabled={(date) => 
                    date > new Date() || 
                    date < new Date(new Date().getFullYear() - 120, 0, 1)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Your Shipping Address</Label>
          <AddressAutocomplete
            value={form.watch('address.street')}
            onChange={(value) => form.setValue('address.street', value)}
            onAddressSelect={handleAddressSelect}
          />

          <div className="grid gap-2">
            <Label htmlFor="line2">Apartment, Suite, Unit, etc. (optional)</Label>
            <Input
              id="line2"
              placeholder="Apt 2B, Suite 100, Unit 4..."
              {...form.register('address.line2')}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="California" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP/Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="94103" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address preview */}
          {(form.watch('address.street') || form.watch('address.city')) && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2">Address Preview:</p>
              <div className="space-y-1 text-sm">
                {form.watch('address.street') && <p>{form.watch('address.street')}</p>}
                {form.watch('address.line2') && <p>{form.watch('address.line2')}</p>}
                {(form.watch('address.city') || form.watch('address.state') || form.watch('address.zipCode')) && (
                  <p>
                    {[form.watch('address.city'), form.watch('address.state'), form.watch('address.zipCode')]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                {form.watch('address.country') && <p>{form.watch('address.country')}</p>}
              </div>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account & Complete Setup"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default StreamlinedSignUpForm;