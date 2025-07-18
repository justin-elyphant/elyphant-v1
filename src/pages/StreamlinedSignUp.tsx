import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, Gift, List, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import MainLayout from '@/components/layout/MainLayout';
import { ProfileCreationService } from '@/services/profile/profileCreationService';
import OnboardingIntentModal from '@/components/auth/signup/OnboardingIntentModal';
import { GiftSetupWizard } from '@/components/gifting/GiftSetupWizard';
import CreateWishlistDialog from '@/components/gifting/wishlist/CreateWishlistDialog';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  photo?: string;
  username: string;
  dateOfBirth?: Date;
  address: string;
  addressLine2: string;
}

type Step = 'signup' | 'profile' | 'intent' | 'oauth-complete';

const StreamlinedSignUp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  
  const [step, setStep] = useState<Step>('signup');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    username: '',
    address: '',
    addressLine2: ''
  });
  const [mandatoryValidation, setMandatoryValidation] = useState({
    firstName: false,
    lastName: false,
    email: false,
    username: false,
    dateOfBirth: false,
    address: false
  });
  
  // Modal states for gift wizard and wishlist creation
  const [showGiftWizard, setShowGiftWizard] = useState(false);
  const [showCreateWishlist, setShowCreateWishlist] = useState(false);

  // Handle OAuth data loading and validation
  useEffect(() => {
    if (user && user.app_metadata?.provider) {
      // Load OAuth data from user metadata
      const firstName = user.user_metadata?.first_name || user.user_metadata?.given_name || '';
      const lastName = user.user_metadata?.last_name || user.user_metadata?.family_name || '';
      const email = user.email || '';
      const photo = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

      if (firstName || lastName || email) {
        setProfileData(prev => ({
          ...prev,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: email || prev.email,
          photo: photo || prev.photo
        }));
      }
    }

    // Also check localStorage for any saved data
    import('@/services/localStorage/LocalStorageService').then(({ LocalStorageService }) => {
      const savedState = LocalStorageService.getProfileCompletionState();
      if (savedState) {
        setProfileData(prev => ({
          ...prev,
          firstName: savedState.firstName || prev.firstName,
          lastName: savedState.lastName || prev.lastName,
          email: savedState.email || prev.email,
          photo: savedState.photo || prev.photo,
          username: savedState.username || prev.username,
          address: savedState.address || prev.address,
          dateOfBirth: savedState.dateOfBirth ? new Date(savedState.dateOfBirth) : prev.dateOfBirth
        }));
      }
    });
  }, [user]);

  // Validate fields whenever profileData changes
  useEffect(() => {
    const validation = {
      firstName: profileData.firstName.trim().length > 0,
      lastName: profileData.lastName.trim().length > 0,
      email: profileData.email.trim().length > 0,
      username: profileData.username.trim().length >= 3,
      dateOfBirth: !!profileData.dateOfBirth,
      address: profileData.address.trim().length > 0
    };
    
    setMandatoryValidation(validation);
  }, [profileData]);

  // Handle user redirection and OAuth completion with centralized storage
  useEffect(() => {
    const intentParam = searchParams.get('intent');
    
    console.log("👤 User state change:", { 
      hasUser: !!user, 
      intentParam, 
      currentStep: step,
      sessionChecked 
    });
    
    if (user) {
      // If user is authenticated and came here to complete profile, allow them to continue
      if (intentParam === 'complete-profile') {
        console.log("✅ User completing profile from email verification");
        setStep('profile');
        setSessionChecked(true);
        return;
      }
      
      // Check if profile setup is completed using centralized service
      import('@/services/localStorage/LocalStorageService').then(({ LocalStorageService }) => {
        const isCompleted = LocalStorageService.isProfileSetupCompleted();
        
        console.log("📊 Profile completion check:", { isCompleted, hasOAuthProvider: !!user.app_metadata?.provider });
        
        if (!isCompleted && user.app_metadata?.provider && step === 'signup') {
          // OAuth user needs profile completion - but only if they're starting fresh
          console.log("🔄 OAuth user needs profile completion");
          setStep('profile');
          setSessionChecked(true);
          return;
        }
        
        // Don't redirect if user is in the middle of the signup flow
        if (step !== 'signup') {
          console.log("🚫 User in middle of signup flow, not redirecting");
          setSessionChecked(true);
          return; // Let them continue with profile setup or intent selection
        }
        
        // Only redirect to dashboard if they landed on the signup step while already authenticated
        if (isCompleted) {
          console.log("🏠 Redirecting completed user to dashboard");
          navigate('/dashboard', { replace: true });
        } else {
          console.log("📝 Authenticated user without completed profile - allowing signup");
          setSessionChecked(true);
        }
      });
    } else {
      // No user, make sure we're on signup step
      if (step !== 'signup') {
        console.log("🔄 No user but not on signup step, resetting to signup");
        setStep('signup');
      }
      setSessionChecked(true);
    }
  }, [user, navigate, searchParams, step]);

  const handleSignUp = async () => {
    if (!profileData.email || !profileData.password || !profileData.firstName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log("🔐 Starting signup process...");
      
      const { data, error } = await supabase.auth.signUp({
        email: profileData.email,
        password: profileData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup?intent=complete-profile`,
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
          }
        }
      });

      if (error) {
        console.error("❌ Signup error:", error);
        if (error.message.includes('already registered')) {
          toast.error('Account already exists', {
            description: 'Please sign in instead.'
          });
          navigate('/signin');
          return;
        }
        throw error;
      }

      console.log("✅ Signup response:", data);

      // Check if user needs email confirmation
      if (data.user && !data.session) {
        console.log("📧 Email confirmation required");
        
        // Store profile data for after email confirmation
        import('@/services/localStorage/LocalStorageService').then(({ LocalStorageService }) => {
          LocalStorageService.setProfileCompletionState({
            ...profileData,
            step: 'profile',
            source: 'email'
          });
        });

        toast.success('Please check your email', {
          description: 'Click the link in your email to verify your account, then return here to complete your profile.'
        });
        
        // Don't proceed to profile step yet - wait for email confirmation
        return;
      }

      // If user is immediately authenticated (email confirmation disabled)
      if (data.session) {
        console.log("✅ User immediately authenticated");
        
        // Store profile data using centralized service
        import('@/services/localStorage/LocalStorageService').then(({ LocalStorageService }) => {
          LocalStorageService.setProfileCompletionState({
            ...profileData,
            step: 'profile',
            source: 'email'
          });
        });
        
        toast.success('Account created!', {
          description: 'Let\'s set up your profile.'
        });
        
        setStep('profile');
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      toast.error('Sign up failed', {
        description: error.message || 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateMandatoryFields = () => {
    const validation = {
      firstName: profileData.firstName.trim().length > 0,
      lastName: profileData.lastName.trim().length > 0,
      email: profileData.email.trim().length > 0,
      username: profileData.username.trim().length >= 3,
      dateOfBirth: !!profileData.dateOfBirth,
      address: profileData.address.trim().length > 0
    };
    
    setMandatoryValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handleProfileSetup = () => {
    if (!validateMandatoryFields()) {
      toast.error('All fields are required', {
        description: 'Please complete all required fields before continuing.'
      });
      return;
    }
    
    console.log("✅ Profile setup complete, proceeding to intent selection");
    setStep('intent');
  };

  const handleIntentSelection = async (userIntent: "quick-gift" | "browse-shop" | "create-wishlist") => {
    if (!user?.id) {
      console.error("❌ No user ID available for profile creation");
      toast.error('Authentication error', {
        description: 'Please refresh and try again.'
      });
      return;
    }

    console.log("🎯 Starting intent selection process:", userIntent);
    setLoading(true);
    
    try {
      // Map new intent types to profile types
      const profileType = userIntent === 'create-wishlist' ? 'giftee' : 'giftor';
      
      // Use the enhanced ProfileCreationService with new mandatory fields
      const result = await ProfileCreationService.createEnhancedProfile(user.id, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        username: profileData.username,
        photo: profileData.photo,
        dateOfBirth: profileData.dateOfBirth,
        birthYear: profileData.dateOfBirth?.getFullYear(),
        address: profileData.address,
        addressLine2: profileData.addressLine2,
        profileType: profileType
      });

      if (!result.success) {
        console.error("❌ Profile creation failed:", result.error);
        toast.error('Profile setup failed', {
          description: result.error || 'Please try again.'
        });
        return;
      }

      console.log("✅ Profile creation successful, verifying...");
      
      // Verify the profile was actually created
      const profileExists = await ProfileCreationService.verifyProfileExists(user.id);
      if (!profileExists) {
        console.error("❌ Profile verification failed - profile not found after creation");
        toast.error('Profile verification failed', {
          description: 'Please try again.'
        });
        return;
      }

      console.log("✅ Profile verified successfully");

      // Mark profile as completed using centralized service
      import('@/services/localStorage/LocalStorageService').then(({ LocalStorageService }) => {
        LocalStorageService.markProfileSetupCompleted();
        // Store the selected intent in Nicole context for guidance
        LocalStorageService.setNicoleContext({
          userIntent: userIntent,
          source: 'signup'
        });
      });
      
      toast.success('Welcome to Elyphant!', {
        description: 'Your account is ready to go.'
      });

      console.log("🚀 Navigating based on intent:", userIntent);

      // Enhanced intent-based routing with new intent types
      setTimeout(() => {
        switch (userIntent) {
          case 'quick-gift':
            setShowGiftWizard(true);
            break;
          case 'browse-shop':
            navigate('/marketplace?source=signup', { replace: true });
            break;
          case 'create-wishlist':
            setShowCreateWishlist(true);
            break;
          default:
            navigate('/dashboard', { replace: true });
        }
      }, 500);

    } catch (error: any) {
      console.error('❌ Intent selection error:', error);
      toast.error('Setup failed', {
        description: 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGiftWizardClose = () => {
    setShowGiftWizard(false);
    navigate('/dashboard', { replace: true });
  };

  const handleCreateWishlistSubmit = async (values: any) => {
    try {
      // TODO: Implement actual wishlist creation logic
      console.log("Creating wishlist with values:", values);
      
      toast.success("Wishlist created successfully!");
      setShowCreateWishlist(false);
      navigate('/wishlists', { replace: true });
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast.error("Failed to create wishlist. Please try again.");
    }
  };

  const handleCreateWishlistClose = () => {
    setShowCreateWishlist(false);
    navigate('/dashboard', { replace: true });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large', {
          description: 'Please choose an image smaller than 5MB.'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileData(prev => ({ ...prev, photo: undefined }));
  };

  const userInitials = profileData.firstName 
    ? `${profileData.firstName[0]}${profileData.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  // Show loading state while checking session
  if (!sessionChecked) {
    return (
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (user && step !== 'intent' && step !== 'oauth-complete' && step !== 'profile') return null;

  return (
    <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Redirect context */}
        {searchParams.get('redirect') && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              Create an account to access this feature
            </p>
          </div>
        )}

        {/* Step 1: Sign Up */}
        {step === 'signup' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Join Elyphant</CardTitle>
              <p className="text-center text-muted-foreground">
                Create your account to get started
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={profileData.password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button onClick={handleSignUp} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/signin')}>
                    Sign in
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Profile Setup */}
        {step === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
              <p className="text-center text-muted-foreground">
                Tell us a bit more about yourself
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.photo} />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  {profileData.photo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileFirstName">First Name *</Label>
                  <Input
                    id="profileFirstName"
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={!mandatoryValidation.firstName ? 'border-red-500' : ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileLastName">Last Name *</Label>
                  <Input
                    id="profileLastName"
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={!mandatoryValidation.lastName ? 'border-red-500' : ''}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileEmail">Email *</Label>
                <Input
                  id="profileEmail"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className={!mandatoryValidation.email ? 'border-red-500' : ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Choose a unique username"
                  className={!mandatoryValidation.username ? 'border-red-500' : ''}
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum 3 characters</p>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !profileData.dateOfBirth && "text-muted-foreground",
                        !mandatoryValidation.dateOfBirth && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {profileData.dateOfBirth ? format(profileData.dateOfBirth, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={profileData.dateOfBirth}
                      onSelect={(date) => setProfileData(prev => ({ ...prev, dateOfBirth: date }))}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label>Address *</Label>
                <GooglePlacesAutocomplete
                  value={profileData.address}
                  onChange={(value) => setProfileData(prev => ({ ...prev, address: value }))}
                  onAddressSelect={(address) => setProfileData(prev => ({ ...prev, address: address.formatted_address }))}
                  placeholder="Enter your address"
                  className={!mandatoryValidation.address ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                <Input
                  id="addressLine2"
                  type="text"
                  value={profileData.addressLine2}
                  onChange={(e) => setProfileData(prev => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <Button onClick={handleProfileSetup} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Intent Selection */}
        {step === 'intent' && (
          <OnboardingIntentModal
            open={true}
            onSelect={handleIntentSelection}
            onSkip={() => navigate('/dashboard')}
          />
        )}
      </div>

      {/* Gift Wizard Modal */}
      <GiftSetupWizard
        open={showGiftWizard}
        onOpenChange={setShowGiftWizard}
      />

      {/* Create Wishlist Modal */}
      <CreateWishlistDialog
        open={showCreateWishlist}
        onOpenChange={setShowCreateWishlist}
        onSubmit={handleCreateWishlistSubmit}
      />
    </div>
  );
};

export default StreamlinedSignUp;