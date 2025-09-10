import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";
import ProfileBubble from "@/components/ui/profile-bubble";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { AddressVerificationModal } from "./AddressVerificationModal";
import { useProfileSubmission } from "./hooks/useProfileSubmission";
import { ProfileData } from "./hooks/types";
import { standardizedToForm } from "@/utils/addressStandardization";
import { StandardizedAddress } from "@/services/googlePlacesService";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  birthday: z.date().optional(),
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
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      email: user?.email || "",
      username: "",
      bio: "",
      phone: "",
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

  const { isLoading, handleComplete } = useProfileSubmission({ 
    onComplete, 
    onSkip: undefined 
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [addressToVerify, setAddressToVerify] = useState<StandardizedAddress | null>(null);
  const [verificationData, setVerificationData] = useState<{
    verified: boolean;
    method: string;
    verifiedAt: string;
  } | null>(null);

  // Debug logs
  console.log("🔍 Modal state:", { showVerificationModal, verificationData });

  const handleImageSelect = async (file: File) => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileImage(publicUrl);
    } catch (error) {
      console.error('Error uploading profile image:', error);
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
    console.log("🚀 Form submitted with data:", data);
    console.log("🔍 Current verification data:", verificationData);
    
    // Check if address needs verification
    const addressToCheck: StandardizedAddress = {
      street: data.address.street,
      city: data.address.city,
      state: data.address.state,
      zipCode: data.address.zipCode,
      country: data.address.country
    };

    console.log("📍 Address to check:", addressToCheck);

    // If address hasn't been verified yet, show verification modal
    if (!verificationData) {
      console.log("✅ Showing verification modal");
      setAddressToVerify(addressToCheck);
      setShowVerificationModal(true);
      return;
    }

    const profileData: ProfileData = {
      name: data.name,
      email: data.email,
      bio: data.bio || "",
      profile_image: profileImage,
      interests: [],
      importantDates: [],
      data_sharing_settings: {
        dob: "private" as const,
        shipping_address: "private" as const,
        gift_preferences: "private" as const,
        email: "private" as const,
      },
      address: {
        street: data.address.street,
        line2: data.address.line2,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode,
        country: data.address.country,
      },
      date_of_birth: data.birthday || null,
      birth_month: data.birthday?.getMonth() !== undefined ? (data.birthday.getMonth() + 1) : null,
      birth_day: data.birthday?.getDate() || null,
      birth_year: data.birthday?.getFullYear() || null,
      username: data.username,
      phone: data.phone
    };

    // Get current birth year from form data
    const birthYear = data.birthday?.getFullYear() || null;

    // Transform the form data to match the API schema with verification data
    const profileDataWithAddress: ProfileData = {
      ...profileData,
      shipping_address: {
        address_line1: data.address.street,
        address_line2: data.address.line2 || "",
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zipCode,
        country: data.address.country,
      },
      address: {
        street: data.address.street,
        line2: data.address.line2,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zipCode,
        country: data.address.country,
      },
      // Include verification data
      address_verified: verificationData.verified,
      address_verification_method: verificationData.method,
      address_verified_at: verificationData.verifiedAt,
    };

    await handleComplete(profileDataWithAddress);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <ProfileBubble
                  imageUrl={profileImage}
                  userName={user?.user_metadata?.name || ''}
                  onImageSelect={handleImageSelect}
                  size="lg"
                />
                <p className="text-sm text-muted-foreground">Click to add a profile photo</p>
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Birthday */}
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>When's your birthday? (optional)</FormLabel>
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

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Shipping Address</h3>
                
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
                  
                  <FormField
                    control={form.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="US" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {!verificationData && (
                  <div className="text-sm text-muted-foreground text-center">
                    Address verification required before completing profile
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Setting up your profile..." : "Complete Profile & Get Started"}
                </Button>
              </div>
            </form>
          </Form>

          <AddressVerificationModal
            open={showVerificationModal}
            onOpenChange={(open) => {
              console.log("🔄 Modal open change:", open);
              setShowVerificationModal(open);
            }}
            address={addressToVerify || { street: '', city: '', state: '', zipCode: '', country: '' }}
            onVerified={(data) => {
              console.log("✅ Address verified:", data);
              setVerificationData(data);
              setShowVerificationModal(false);
              // Automatically submit form after verification
              form.handleSubmit(onSubmit)();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleProfileForm;