import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { SmartInput } from "@/components/ui/smart-input";
import ProfileBubble from "@/components/ui/profile-bubble";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";
import InlineAddressVerification from "@/components/profile-setup/InlineAddressVerification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ArrowLeft, Check, Plus, Gift, X, Sparkles } from "lucide-react";
import { COMMON_INTERESTS } from "@/constants/commonInterests";
import { useWelcomeWishlist } from "@/hooks/useWelcomeWishlist";
import { useOnboardingCompletion } from "@/hooks/onboarding/useOnboardingCompletion";
import { AddressValidationResult, unifiedLocationService } from "@/services/location/UnifiedLocationService";

type OnboardingStep = 'profile' | 'interests' | 'connections';

const QUICK_INTERESTS = [
  "Technology",
  "Sports", 
  "Fashion",
  "Cooking",
  "Travel",
  "Fitness",
  "Music",
  "Gaming"
];

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

interface PendingConnection {
  id: string;
  user_id: string;
  sender_name?: string;
  sender_username?: string;
  sender_avatar?: string;
  has_pending_gift?: boolean;
  gift_occasion?: string;
  gift_message?: string;
  created_at: string;
}

const UnifiedOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { scheduleDelayedWelcomeEmail } = useWelcomeWishlist();
  const { handleOnboardingComplete } = useOnboardingCompletion();

  // Step state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Profile data
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [addressVerificationData, setAddressVerificationData] = useState<AddressVerificationData | null>(null);

  // Step 2: Interests data
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  // Step 3: Pending connections data
  const [pendingConnections, setPendingConnections] = useState<PendingConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

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

  // Fetch pending connections when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchPendingConnections();
    }
  }, [user?.id]);

  const fetchPendingConnections = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingConnections(true);
      
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          user_id,
          has_pending_gift,
          gift_occasion,
          gift_message,
          created_at
        `)
        .eq('connected_user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      if (data && data.length > 0) {
        const senderIds = data.map(conn => conn.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, username, profile_image')
          .in('id', senderIds);

        if (profileError) throw profileError;

        const enrichedConnections = data.map(conn => {
          const profile = profiles?.find(p => p.id === conn.user_id);
          return {
            ...conn,
            sender_name: profile?.name || 'Someone',
            sender_username: profile?.username || '@user',
            sender_avatar: profile?.profile_image || '/placeholder.svg'
          };
        });

        setPendingConnections(enrichedConnections);
      } else {
        setPendingConnections([]);
      }
    } catch (error) {
      console.error('Error fetching pending connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Step 1: Profile handlers
  const handleImageSelect = async (file: File) => {
    if (!user) {
      console.error('No user found for image upload');
      return;
    }

    if (!file.name) {
      console.log('Removing profile image');
      form.setValue('profile_image', null);
      setProfileImageUrl(null);
      toast.success('Profile photo removed');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-images/${user.id}/${user.id}-${Date.now()}.${fileExt}`;
      
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

  const handleVerificationChange = (verified: boolean, result: AddressVerificationData | null) => {
    console.log('🔍 Address verification changed:', { verified, result });
    setIsAddressVerified(verified);
    setAddressVerificationData(result);
  };

  const ensureAddressVerified = async (): Promise<boolean> => {
    const formData = form.getValues();
    const address = formData.address;
    
    // Check if address is complete
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      toast.error("Please complete all required address fields");
      return false;
    }
    
    // If already verified, we're good
    if (isAddressVerified && addressVerificationData) {
      console.log("✅ Address already verified");
      return true;
    }
    
    console.log("🔍 Triggering address verification before save...");
    toast.info("Verifying your address...");
    
    // Prepare standardized address before try block so it's accessible in catch
    const standardizedAddress = {
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country || 'US',
      formatted_address: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
    };
    
    try {
      const validation = await unifiedLocationService.validateAddressForDelivery(standardizedAddress);
      
      if (validation.isValid) {
        const verifyData = {
          address: standardizedAddress,
          confidence: validation.confidence,
          method: validation.confidence === 'high' ? 'automatic' as const : 'user_confirmed' as const
        };
        
        setIsAddressVerified(true);
        setAddressVerificationData(verifyData);
        console.log("✅ Address verified successfully");
        return true;
      } else {
        // Address has issues - set as user_confirmed to allow manual verification
        console.log("⚠️ Address validation failed, marking as user_confirmed");
        toast.warning("Address couldn't be automatically verified. Proceeding with manual confirmation.");
        
        // Set as verified with user_confirmed method
        const verifyData = {
          address: standardizedAddress,
          confidence: 'medium' as const,
          method: 'user_confirmed' as const
        };
        
        setIsAddressVerified(true);
        setAddressVerificationData(verifyData);
        return true; // Allow signup to proceed
      }
    } catch (error) {
      console.error("❌ Address verification error:", error);
      toast.warning("Couldn't verify address automatically. Proceeding with manual confirmation.");
      
      // Set as verified with user_confirmed method even on error
      const verifyData = {
        address: standardizedAddress,
        confidence: 'low' as const,
        method: 'user_confirmed' as const
      };
      
      setIsAddressVerified(true);
      setAddressVerificationData(verifyData);
      return true; // Don't block signup flow
    }
  };

  const handleProfileStepComplete = async () => {
    // Validate form first
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fix the form errors before continuing");
      return;
    }
    
    // Ensure address is verified before proceeding
    const addressVerified = await ensureAddressVerified();
    if (!addressVerified) {
      return; // Don't proceed if verification fails
    }
    
    console.log('✅ Profile step validated and address verified, moving to interests');
    setCurrentStep('interests');
  };

  // Step 2: Interests handlers
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const isDuplicateInterest = (interest: string) => {
    return selectedInterests.some(existing => 
      existing.toLowerCase().replace(/\s+/g, '') === interest.toLowerCase().replace(/\s+/g, '')
    );
  };

  const addCustomInterest = () => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest && !isDuplicateInterest(trimmedInterest)) {
      setSelectedInterests(prev => [...prev, trimmedInterest]);
      setNewInterest("");
      toast.success(`Added "${trimmedInterest}" to your interests!`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest();
    }
  };

  const handleInterestsStepComplete = () => {
    console.log('✅ Interests step completed');
    // Check if there are pending connections
    if (pendingConnections.length > 0) {
      setCurrentStep('connections');
    } else {
      // No pending connections, complete onboarding
      handleFinalSubmit();
    }
  };

  // Step 3: Connections handlers
  const handleAcceptConnection = async (connectionId: string) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;

      const conn = pendingConnections.find(c => c.id === connectionId);
      if (conn && user) {
        const { error: reciprocalError } = await supabase
          .from('user_connections')
          .insert({
            user_id: user.id,
            connected_user_id: conn.user_id,
            status: 'accepted',
            relationship_type: 'friend'
          });

        if (reciprocalError && !reciprocalError.message.includes('duplicate')) {
          throw reciprocalError;
        }
      }

      toast.success('Connection accepted! 🎉');
      setPendingConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    setProcessingIds(prev => new Set(prev).add(connectionId));
    
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Connection declined');
      setPendingConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (error) {
      console.error('Error declining connection:', error);
      toast.error('Failed to decline connection');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  // Final submission - ONE save operation with all data
  const handleFinalSubmit = async () => {
    if (!user) {
      toast.error("Please wait for authentication and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      
      // Format date of birth for storage
      const date = new Date(formData.date_of_birth);
      const formattedBirthday = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const birthYear = date.getFullYear();

      // Use existing name from auth metadata with fallbacks
      const firstName = user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User';
      const lastName = user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Name';
      const fullName = user.user_metadata?.name || `${firstName} ${lastName}`.trim();
      
      // Generate username from email if not provided
      const username = user.user_metadata?.username || user.email?.split('@')[0] || `user${Date.now()}`;

      // Construct complete profile data - ONE SAVE OPERATION
      const completeProfileData = {
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        email: user.email,
        username: username,
        profile_image: formData.profile_image,
        dob: formattedBirthday,
        birth_year: birthYear,
        shipping_address: {
          address_line1: formData.address.street,
          address_line2: formData.address.line2 || "",
          city: formData.address.city,
          state: formData.address.state,
          zip_code: formData.address.zipCode,
          country: formData.address.country,
          street: formData.address.street,
          zipCode: formData.address.zipCode
        },
        // Only include verification fields if address is actually verified
        ...(isAddressVerified && {
          address_verified: true,
          address_verification_method: addressVerificationData?.method || 'user_confirmed',
          address_verified_at: new Date().toISOString()
        }),
        address_last_updated: new Date().toISOString(),
        interests: selectedInterests,
        important_dates: [],
        data_sharing_settings: {
          dob: "friends" as const,
          shipping_address: "private" as const,
          gift_preferences: "friends" as const,
          email: "private" as const
        },
        onboarding_completed: true
      };

      console.log("🚀 Saving complete profile data:", completeProfileData);
      
      // ONE ProfileContext.updateProfile call with ALL data
      await updateProfile(completeProfileData);
      
      // Clear localStorage flags and refetch profile data
      await handleOnboardingComplete();

      // Trigger welcome email with user data and interests
      try {
        const emailInterests = selectedInterests.length > 0 ? selectedInterests : ['popular gifts', 'trending'];
        
        console.log('🎁 Triggering welcome email with interests:', emailInterests);
        
        await scheduleDelayedWelcomeEmail({
          userId: user.id,
          userEmail: user.email || '',
          userFirstName: firstName,
          userLastName: lastName,
          birthYear: birthYear,
          interests: emailInterests,
          inviterName: undefined,
          profileData: {
            gender: undefined,
            lifestyle: undefined,
            favoriteCategories: undefined
          }
        });
      } catch (emailError) {
        console.error('Non-blocking: Welcome email scheduling failed:', emailError);
      }

      toast.success("Welcome! Your profile is complete.", {
        description: isAddressVerified ? "Your address has been verified for delivery" : "You can verify your address later in settings"
      });

      // Smart routing based on signup context
      const signupContext = localStorage.getItem("signupContext");
      let destination = "/"; // Default for existing users
      
      if (signupContext === "gift_recipient") {
        destination = "/wishlists";
      } else if (signupContext === "gift_giver") {
        destination = "/gifting";
      }
      
      console.log(`🎯 Routing ${signupContext || 'existing user'} to ${destination}`);
      
      // Clean up signup flags
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileCompletionState");
      localStorage.removeItem("signupContext");
      
      // Before navigation, ensure profile update propagates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate(destination, { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress calculation
  const getProgress = () => {
    switch (currentStep) {
      case 'profile': return 33;
      case 'interests': return 66;
      case 'connections': return 100;
      default: return 33;
    }
  };

  const getStepLabel = () => {
    switch (currentStep) {
      case 'profile': return 'Step 1 of 3: Profile Setup';
      case 'interests': return 'Step 2 of 3: Your Interests';
      case 'connections': return 'Step 3 of 3: Connect with Friends';
      default: return 'Step 1 of 3';
    }
  };

  const userName = user?.user_metadata?.name || '';

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{getStepLabel()}</span>
            <span className="text-sm font-medium text-primary">{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        {/* Step 1: Profile Setup */}
        {currentStep === 'profile' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Complete Your Profile</h2>
              <p className="text-sm text-muted-foreground">
                Add your photo, birthday, and shipping address to get started
              </p>
            </div>

            {/* Profile Photo */}
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
              <div className="space-y-6">
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
                  <FormLabel className="text-base font-medium">Your Shipping Address</FormLabel>
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
                  type="button"
                  onClick={handleProfileStepComplete}
                  className="w-full"
                >
                  Continue to Interests
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* Step 2: Interests Selection */}
        {currentStep === 'interests' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Quick Setup</h2>
              <p className="text-sm text-muted-foreground">
                Pick a few interests to get better gift recommendations
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You can always add more later in settings
              </p>
            </div>

            {/* Interest Selection Grid */}
            <div className="grid grid-cols-2 gap-3">
              {QUICK_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Button
                    key={interest}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      h-auto py-3 px-4 relative transition-all duration-200
                      ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}
                    `}
                    onClick={() => toggleInterest(interest)}
                  >
                    <span className="text-center">
                      {interest}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 absolute top-2 right-2" />
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Custom Interest Input */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SmartInput
                    value={newInterest}
                    onChange={setNewInterest}
                    onKeyDown={handleKeyPress}
                    placeholder="Add a new interest (brands, hobbies, etc.)"
                    suggestions={COMMON_INTERESTS}
                    showSpellingSuggestions={true}
                    className="w-full"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addCustomInterest}
                  disabled={!newInterest.trim() || isDuplicateInterest(newInterest.trim())}
                  size="sm"
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected interests count */}
            {selectedInterests.length > 0 && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="text-sm">
                  {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                </Badge>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('profile')}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleInterestsStepComplete}
                className="flex-1"
              >
                {pendingConnections.length > 0 ? 'Continue' : 'Complete Setup'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Pending Connections */}
        {currentStep === 'connections' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold">Connection Requests</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Accept or decline connection requests from people who want to connect with you
              </p>
            </div>

            {loadingConnections ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {pendingConnections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={connection.sender_avatar} />
                          <AvatarFallback>
                            {connection.sender_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{connection.sender_name}</h4>
                            {connection.has_pending_gift && (
                              <Badge variant="secondary" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                Includes Gift
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {connection.sender_username}
                          </p>
                          
                          {connection.has_pending_gift && connection.gift_message && (
                            <div className="bg-muted/50 rounded-md p-3 mb-3">
                              <p className="text-sm italic">"{connection.gift_message}"</p>
                              {connection.gift_occasion && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  For: {connection.gift_occasion}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptConnection(connection.id)}
                              disabled={processingIds.has(connection.id)}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineConnection(connection.id)}
                              disabled={processingIds.has(connection.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('interests')}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Get Started'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedOnboarding;
