import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";
import ProfileBubble from "@/components/ui/profile-bubble";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";
import InlineAddressVerification from "./InlineAddressVerification";
import { supabase } from "@/integrations/supabase/client";
import { AddressValidationResult } from "@/services/location/UnifiedLocationService";
import { useWelcomeWishlist } from "@/hooks/useWelcomeWishlist";

interface AddressVerificationData {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    formatted_address: string;
  };
  confidence: 'high' | 'medium' | 'low';
  method: 'automatic' | 'user_confirmed';
}

const formSchema = z.object({
  profile_image: z.string().nullable().optional(),
  date_of_birth: z.date({
    required_error: "Birthday is required",
  }),
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

interface SimpleProfileFormProps {
  onComplete: () => void;
}

const SimpleProfileForm: React.FC<SimpleProfileFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [addressVerificationData, setAddressVerificationData] = useState<AddressVerificationData | null>(null);
  const { triggerWelcomeWishlist } = useWelcomeWishlist();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  const handleImageSelect = async (file: File) => {
    if (!user) {
      console.error('No user found for image upload');
      return;
    }

    // Handle remove photo case (empty file)
    if (!file.name) {
      console.log('Removing profile image');
      form.setValue('profile_image', null);
      setProfileImageUrl(null);
      toast.success('Profile photo removed');
      return;
    }

    try {
      console.log('Starting image upload for file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        userId: user.id
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `profile-images/${user.id}/${user.id}-${Date.now()}.${fileExt}`;
      
      console.log('Uploading to path:', fileName);
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        toast.error('Failed to upload image');
        return;
      }

      console.log('Upload successful, getting public URL for:', fileName);
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // Test if the URL is accessible
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          throw new Error(`Image not accessible: ${testResponse.status}`);
        }
        console.log('Image URL verified as accessible');
      } catch (urlError) {
        console.error('Generated URL is not accessible:', urlError);
        toast.error('Image uploaded but not accessible. Please try again.');
        return;
      }

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

  const handleVerificationChange = (verified: boolean, result: AddressVerificationData | null) => {
    console.log('🔍 [SimpleProfileForm] Address verification changed:', { verified, result });
    setIsAddressVerified(verified);
    setAddressVerificationData(result);
  };

  const onSubmit = async (data: FormData) => {
    console.log('🔍 [SimpleProfileForm] Form submission - current address:', form.watch('address'));
    if (!user) {
      toast.error("Please wait for authentication and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use existing name from auth metadata with fallbacks
      const firstName = user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User';
      const lastName = user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Name';
      const fullName = user.user_metadata?.name || `${firstName} ${lastName}`.trim();
      
      // Generate username from email if not provided (required field in database)
      const username = user.user_metadata?.username || user.email?.split('@')[0] || `user${Date.now()}`;

      const profileData = {
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        email: user.email,
        username: username,
        profile_image: data.profile_image,
        dob: data.date_of_birth, // Send Date object - useProfileUpdate will normalize to MM-DD
        shipping_address: {
          address_line1: data.address.street,
          address_line2: data.address.line2 || "",
          city: data.address.city,
          state: data.address.state,
          zip_code: data.address.zipCode,
          country: data.address.country,
          street: data.address.street,
          zipCode: data.address.zipCode
        },
        address_verified: isAddressVerified,
        address_verification_method: addressVerificationData?.method || (isAddressVerified ? 'user_confirmed' : 'profile_setup'),
        address_verified_at: isAddressVerified ? new Date().toISOString() : null,
        address_last_updated: new Date().toISOString(),
        interests: [],
        important_dates: [],
        data_sharing_settings: {
          dob: "friends" as const,
          shipping_address: "private" as const,
          gift_preferences: "friends" as const,
          email: "private" as const
        }
      };

      console.log("🚀 Saving simple profile data with verification:", {
        verified: isAddressVerified,
        method: addressVerificationData?.method,
        confidence: addressVerificationData?.confidence
      });
      
      await updateProfile(profileData as any);
      
      // Welcome email will be triggered AFTER interests are collected in QuickInterestsModal
      
      toast.success("Profile completed successfully!", {
        description: isAddressVerified ? "Your address has been verified for delivery" : "You can verify your address later in settings"
      });
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userName = user?.user_metadata?.name || '';

  return (
    <div className="space-y-6">
      {/* Profile Photo Section */}
      <div className="flex flex-col items-center space-y-4">
        <ProfileBubble
          imageUrl={profileImageUrl}
          userName={userName}
          onImageSelect={handleImageSelect}
          size="lg"
        />
        <p className="text-sm text-muted-foreground">Click to add a profile photo</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Birthday */}
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>When's your birthday?</FormLabel>
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

            <FormField
              control={form.control}
              name="address.line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt, suite, unit, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco" {...field} />
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
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="California" {...field} />
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
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="94103" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inline Address Verification */}
            <InlineAddressVerification
              address={form.watch('address')}
              onVerificationChange={handleVerificationChange}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving Profile..." : 
             isAddressVerified ? "Complete Profile & Get Started" : 
             "Complete Profile (Verify Address Later)"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SimpleProfileForm;