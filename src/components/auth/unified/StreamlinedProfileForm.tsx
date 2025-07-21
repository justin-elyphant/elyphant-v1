
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/contexts/auth";
import { useProfileCreate } from "@/hooks/profile/useProfileCreate";
import { toast } from "sonner";
import ProfileBubble from "@/components/ui/profile-bubble";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"), 
  username: z.string().min(3, "Username must be at least 3 characters"),
  profile_image: z.string().nullable().optional(),
  date_of_birth: z.date({
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
  })
});

type FormData = z.infer<typeof formSchema>;

interface StreamlinedProfileFormProps {
  onComplete: () => void;
}

const StreamlinedProfileForm: React.FC<StreamlinedProfileFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { createProfile, isCreating } = useProfileCreate();
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      profile_image: null,
      address: {
        street: "",
        line2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US"
      }
    }
  });

  // Auto-generate username from first and last name
  const firstName = form.watch("first_name");
  const lastName = form.watch("last_name");

  useEffect(() => {
    if (firstName && lastName && !form.getValues("username")) {
      const generatedUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
      form.setValue("username", generatedUsername);
    }
  }, [firstName, lastName, form]);

  const handleImageSelect = async (file: File) => {
    setProfileImageFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setProfileImageUrl(previewUrl);

    try {
      if (!user) return;

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      form.setValue('profile_image', publicUrl);
      setProfileImageUrl(publicUrl);
      toast.success('Profile photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile photo');
    }
  };

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

  const onSubmit = async (data: FormData) => {
    try {
      const profileData = {
        name: `${data.first_name} ${data.last_name}`,
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        email: user?.email || "",
        profile_image: data.profile_image,
        date_of_birth: data.date_of_birth,
        address: {
          street: data.address.street,
          line2: data.address.line2,
          city: data.address.city,
          state: data.address.state,
          zipCode: data.address.zipCode,
          country: data.address.country
        },
        interests: [],
        importantDates: [],
        data_sharing_settings: {
          dob: "friends" as const,
          shipping_address: "private" as const,
          gift_preferences: "public" as const,
          email: "private" as const
        }
      };

      await createProfile(profileData);
      onComplete();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <p className="text-muted-foreground">Just a few quick details to get you started</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center space-y-4">
          <ProfileBubble
            imageUrl={profileImageUrl}
            userName={fullName}
            onImageSelect={handleImageSelect}
            size="lg"
          />
          <p className="text-sm text-muted-foreground">Click to add a profile photo</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
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
                name="last_name"
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

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Birthday */}
            <FormField
              control={form.control}
              name="date_of_birth"
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
              <Label className="text-base font-medium">Shipping Address</Label>
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={form.watch('address.country')} onValueChange={(value) => form.setValue('address.country', value)}>
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
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isCreating}
            >
              {isCreating ? "Creating Profile..." : "Complete Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StreamlinedProfileForm;
