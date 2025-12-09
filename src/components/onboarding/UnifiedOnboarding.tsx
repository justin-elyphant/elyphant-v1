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
import { useOnboardingCompletion } from "@/hooks/onboarding/useOnboardingCompletion";
import { AddressValidationResult, unifiedLocationService } from "@/services/location/UnifiedLocationService";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHapticFeedback } from "@/utils/haptics";

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

// Animation variants for step transitions
const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const UnifiedOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
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

    triggerHapticFeedback('selection');

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
      triggerHapticFeedback('success');
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
    
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      toast.error("Please complete all required address fields");
      return false;
    }
    
    if (isAddressVerified && addressVerificationData) {
      console.log("✅ Address already verified");
      return true;
    }
    
    console.log("🔍 Triggering address verification before save...");
    toast.info("Verifying your address...");
    
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
      
      const verifyData = {
        address: standardizedAddress,
        confidence: validation.isValid 
          ? validation.confidence 
          : (validation.confidence || 'low' as const),
        method: (validation.isValid && validation.confidence === 'high') 
          ? 'automatic' as const 
          : 'user_confirmed' as const
      };
      
      if (!validation.isValid) {
        console.log("⚠️ Address validation failed, marking as user_confirmed");
        toast.warning("Address couldn't be automatically verified. Proceeding with manual confirmation.");
      } else {
        console.log("✅ Address verified successfully");
      }
      
      setIsAddressVerified(true);
      setAddressVerificationData(verifyData);
      return true;
      
    } catch (error) {
      console.error("❌ Address verification error:", error);
      toast.warning("Couldn't verify address automatically. Proceeding with manual confirmation.");
      
      const verifyData = {
        address: standardizedAddress,
        confidence: 'low' as const,
        method: 'user_confirmed' as const
      };
      
      setIsAddressVerified(true);
      setAddressVerificationData(verifyData);
      return true;
    }
  };

  const handleProfileStepComplete = async () => {
    triggerHapticFeedback('selection');
    
    const isValid = await form.trigger();
    if (!isValid) {
      triggerHapticFeedback('error');
      toast.error("Please fix the form errors before continuing");
      return;
    }
    
    const addressVerified = await ensureAddressVerified();
    if (!addressVerified) {
      return;
    }
    
    console.log('✅ Profile step validated and address verified, moving to interests');
    triggerHapticFeedback('success');
    setCurrentStep('interests');
  };

  // Step 2: Interests handlers
  const toggleInterest = (interest: string) => {
    triggerHapticFeedback('selection');
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
      triggerHapticFeedback('success');
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
    triggerHapticFeedback('selection');
    console.log('✅ Interests step completed');
    if (pendingConnections.length > 0) {
      setCurrentStep('connections');
    } else {
      handleFinalSubmit();
    }
  };

  const handleBackToProfile = () => {
    triggerHapticFeedback('light');
    setCurrentStep('profile');
  };

  const handleBackToInterests = () => {
    triggerHapticFeedback('light');
    setCurrentStep('interests');
  };

  // Step 3: Connections handlers
  const handleAcceptConnection = async (connectionId: string) => {
    triggerHapticFeedback('success');
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
      triggerHapticFeedback('error');
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
    triggerHapticFeedback('warning');
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
      triggerHapticFeedback('error');
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

    triggerHapticFeedback('medium');
    setIsSubmitting(true);
    try {
      const formData = form.getValues();

      const firstName = user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User';
      const lastName = user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Name';
      const fullName = user.user_metadata?.name || `${firstName} ${lastName}`.trim();
      
      const username = user.user_metadata?.username || user.email?.split('@')[0] || `user${Date.now()}`;

      const completeProfileData = {
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        email: user.email,
        username: username,
        profile_image: formData.profile_image,
        dob: formData.date_of_birth,
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
        ...(isAddressVerified && addressVerificationData?.method && 
            (addressVerificationData.method === 'automatic' || addressVerificationData.method === 'user_confirmed') 
          ? (() => {
              const verifiedAt = new Date().toISOString();
              return {
                address_verified: true,
                address_verification_method: addressVerificationData.method,
                address_verified_at: verifiedAt,
                address_last_updated: verifiedAt
              };
            })()
          : {
              address_last_updated: new Date().toISOString()
            }
        ),
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
      console.log("🔍 Address verification state:", {
        isAddressVerified,
        hasValidMethod: addressVerificationData?.method && 
          (addressVerificationData.method === 'automatic' || addressVerificationData.method === 'user_confirmed'),
        method: addressVerificationData?.method,
        willIncludeVerification: !!(isAddressVerified && addressVerificationData?.method && 
          (addressVerificationData.method === 'automatic' || addressVerificationData.method === 'user_confirmed'))
      });
      
      await updateProfile(completeProfileData as any, { skipLegacyMapping: true });
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('dob, shipping_address, interests, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log("🔍 Post-save verification result:", verifyProfile);
      
      if (verifyError || !verifyProfile?.onboarding_completed) {
        console.error("❌ Save verification FAILED:", { verifyError, verifyProfile });
        throw new Error("Profile data failed to persist to database");
      }
      
      const interestsArray = Array.isArray(verifyProfile.interests) ? verifyProfile.interests : [];
      
      if (!verifyProfile.dob || !verifyProfile.shipping_address || interestsArray.length === 0) {
        console.error("❌ Save verification FAILED - missing critical fields:", {
          has_dob: !!verifyProfile.dob,
          has_address: !!verifyProfile.shipping_address,
          has_interests: interestsArray.length > 0,
          actual_data: verifyProfile
        });
        throw new Error("Critical profile fields missing after save");
      }
      
      triggerHapticFeedback('success');
      toast.success("Profile saved!");
      
      await handleOnboardingComplete();

      try {
        console.log('✅ Profile interests saved for user:', user.id);
      } catch (emailError) {
        console.error('Non-blocking: Welcome email scheduling failed:', emailError);
      }

      toast.success("Welcome! Your profile is complete.", {
        description: isAddressVerified ? "Your address has been verified for delivery" : "You can verify your address later in settings"
      });

      const signupContext = localStorage.getItem("signupContext");
      let destination = "/";
      
      if (signupContext === "gift_recipient") {
        destination = "/wishlists";
      } else if (signupContext === "gift_giver") {
        destination = "/gifting";
      }
      
      console.log(`🎯 Routing ${signupContext || 'existing user'} to ${destination}`);
      
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileCompletionState");
      localStorage.removeItem("signupContext");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate(destination, { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      triggerHapticFeedback('error');
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <Card className="w-full pb-safe">
      <CardContent className="p-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{getStepLabel()}</span>
            <span className="text-sm font-medium text-primary">{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Profile Setup */}
          {currentStep === 'profile' && (
            <motion.div
              key="profile"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
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
                            <Input placeholder="Apt, suite, unit, etc." {...field} className="min-h-[44px]" />
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
                              <Input placeholder="San Francisco" {...field} className="min-h-[44px]" />
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
                              <Input placeholder="California" {...field} className="min-h-[44px]" />
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
                              <Input placeholder="94103" {...field} className="min-h-[44px]" />
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

                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button 
                      type="button"
                      onClick={handleProfileStepComplete}
                      className="w-full min-h-[44px]"
                    >
                      Continue to Interests
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </Form>
            </motion.div>
          )}

          {/* Step 2: Interests Selection */}
          {currentStep === 'interests' && (
            <motion.div
              key="interests"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
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
                {QUICK_INTERESTS.map((interest, index) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <motion.div
                      key={interest}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`
                          h-auto min-h-[44px] py-3 px-4 w-full relative
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
                    </motion.div>
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
                      className="w-full min-h-[44px]"
                    />
                  </div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      type="button"
                      onClick={addCustomInterest}
                      disabled={!newInterest.trim() || isDuplicateInterest(newInterest.trim())}
                      size="sm"
                      className="px-3 min-h-[44px]"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Selected interests count */}
              {selectedInterests.length > 0 && (
                <motion.div 
                  className="flex justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Badge variant="secondary" className="text-sm">
                    {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                  </Badge>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToProfile}
                    className="w-full min-h-[44px]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                  <Button
                    type="button"
                    onClick={handleInterestsStepComplete}
                    className="w-full min-h-[44px]"
                  >
                    {pendingConnections.length > 0 ? 'Continue' : 'Complete Setup'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Pending Connections */}
          {currentStep === 'connections' && (
            <motion.div
              key="connections"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
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
                  {pendingConnections.map((connection, index) => (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <Card>
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
                                <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptConnection(connection.id)}
                                    disabled={processingIds.has(connection.id)}
                                    className="w-full min-h-[44px]"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                </motion.div>
                                <motion.div whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeclineConnection(connection.id)}
                                    disabled={processingIds.has(connection.id)}
                                    className="min-h-[44px]"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToInterests}
                    className="w-full min-h-[44px]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="w-full min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default UnifiedOnboarding;
