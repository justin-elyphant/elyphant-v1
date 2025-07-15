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
    
    if (user) {
      // If user is authenticated and came here to complete profile, allow them to continue
      if (intentParam === 'complete-profile') {
        setStep('profile');
        return;
      }
      
      // Check if profile setup is completed using centralized service
      import('@/services/localStorage/LocalStorageService').then(({ LocalStorageService }) => {
        const isCompleted = LocalStorageService.isProfileSetupCompleted();
        
        if (!isCompleted && user.app_metadata?.provider) {
          // OAuth user needs profile completion - stay on profile step
          setStep('profile');
          return;
        }
        
        // Don't redirect if user is in the middle of the signup flow
        if (step !== 'signup') {
          return; // Let them continue with profile setup or intent selection
        }
        
        // Only redirect to dashboard if they landed on the signup step while already authenticated
        if (isCompleted) {
          navigate('/dashboard', { replace: true });
        }
      });
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
    setStep('intent');
  };

  const handleIntentSelection = async (intent: 'giftor' | 'giftee') => {
    if (!user?.id) {
      console.error("❌ No user ID available for profile creation");
      toast.error('Authentication error', {
        description: 'Please refresh and try again.'
      });
      return;
    }

    console.log("🎯 Starting intent selection process:", intent);
    setLoading(true);
    
    try {
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
        profileType: intent
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
      });
      
      toast.success('Welcome to Elyphant!', {
        description: 'Your account is ready to go.'
      });

      console.log("🚀 Navigating based on intent:", intent);

      // Enhanced intent-based routing with Nicole integration
      setTimeout(() => {
        if (intent === 'giftor') {
          navigate('/marketplace?mode=nicole&open=true&greeting=personalized&source=signup', { replace: true });
        } else {
          navigate('/marketplace?mode=wishlist&source=signup', { replace: true });
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

  if (user && step !== 'intent' && step !== 'oauth-complete' && step !== 'profile') return null;

  return (
    <MainLayout>
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleSignUp}
                  disabled={loading || !profileData.email || !profileData.password || !profileData.firstName}
                  className="w-full"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button variant="link" className="p-0" onClick={() => navigate('/signin')}>
                    Sign in
                  </Button>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Profile Setup */}
          {(step === 'profile' || step === 'oauth-complete') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  {step === 'oauth-complete' ? 'Complete Your Profile' : 'Set Up Your Profile'}
                </CardTitle>
                <p className="text-center text-muted-foreground">
                  {step === 'oauth-complete' 
                    ? 'Please complete all required fields to continue' 
                    : 'All fields are required to personalize your experience'
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo - Now Required */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileData.photo} />
                      <AvatarFallback className="bg-purple-100 text-purple-800 text-xl font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                    {profileData.photo && (
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Profile photo
                    </p>
                    <p className="text-xs text-muted-foreground">Optional</p>
                  </div>
                </div>

                {/* First & Last Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className={cn(
                      "font-medium",
                      mandatoryValidation.firstName ? "text-green-600" : "text-red-600"
                    )}>
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, firstName: e.target.value }));
                        setMandatoryValidation(prev => ({ ...prev, firstName: e.target.value.trim().length > 0 }));
                      }}
                      className={cn(
                        mandatoryValidation.firstName ? "border-green-300" : "border-red-300"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className={cn(
                      "font-medium",
                      mandatoryValidation.lastName ? "text-green-600" : "text-red-600"
                    )}>
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, lastName: e.target.value }));
                        setMandatoryValidation(prev => ({ ...prev, lastName: e.target.value.trim().length > 0 }));
                      }}
                      className={cn(
                        mandatoryValidation.lastName ? "border-green-300" : "border-red-300"
                      )}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                {step !== 'oauth-complete' && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className={cn(
                      "font-medium",
                      mandatoryValidation.email ? "text-green-600" : "text-red-600"
                    )}>
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => {
                        setProfileData(prev => ({ ...prev, email: e.target.value }));
                        setMandatoryValidation(prev => ({ ...prev, email: e.target.value.trim().length > 0 }));
                      }}
                      className={cn(
                        mandatoryValidation.email ? "border-green-300" : "border-red-300"
                      )}
                      required
                    />
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className={cn(
                    "font-medium",
                    mandatoryValidation.username ? "text-green-600" : "text-red-600"
                  )}>
                    Username * (minimum 3 characters)
                  </Label>
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    value={profileData.username}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, username: e.target.value }));
                      setMandatoryValidation(prev => ({ ...prev, username: e.target.value.trim().length >= 3 }));
                    }}
                    className={cn(
                      mandatoryValidation.username ? "border-green-300" : "border-red-300"
                    )}
                    required
                  />
                </div>

                {/* Date of Birth - Now Required */}
                <div className="space-y-2">
                  <Label className={cn(
                    "font-medium",
                    mandatoryValidation.dateOfBirth ? "text-green-600" : "text-red-600"
                  )}>
                    Date of Birth *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !profileData.dateOfBirth && "text-muted-foreground",
                          mandatoryValidation.dateOfBirth ? "border-green-300" : "border-red-300"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {profileData.dateOfBirth ? (
                          format(profileData.dateOfBirth, "PPP")
                        ) : (
                          <span>Pick your date of birth</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={profileData.dateOfBirth}
                        onSelect={(date) => {
                          setProfileData(prev => ({ 
                            ...prev, 
                            dateOfBirth: date
                          }));
                          setMandatoryValidation(prev => ({ 
                            ...prev, 
                            dateOfBirth: !!date
                          }));
                        }}
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        captionLayout="dropdown"
                        initialFocus
                        className="pointer-events-auto p-4"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4 w-full",
                          caption: "flex justify-center pt-1 relative items-center mb-4",
                          caption_label: "text-sm font-medium hidden", // Hide when using dropdowns
                          caption_dropdowns: "flex items-center justify-center gap-2 w-full",
                          dropdown: "h-8 text-sm bg-background border border-input rounded-md px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          dropdown_month: "min-w-[120px]",
                          dropdown_year: "min-w-[80px]",
                          nav: "space-x-1 flex items-center absolute top-0 w-full justify-between",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input rounded-sm hover:bg-accent hover:text-accent-foreground",
                          nav_button_previous: "left-0",
                          nav_button_next: "right-0",
                          table: "w-full border-collapse space-y-1 mt-2",
                          head_row: "flex w-full",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 flex items-center justify-center",
                          row: "flex w-full mt-1",
                          cell: "h-8 w-8 text-center text-sm p-0 relative flex-1 flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground",
                          day_range_end: "day-range-end",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-medium",
                          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>


                <div className="space-y-2">
                  <Label className={cn(
                    "font-medium",
                    mandatoryValidation.address ? "text-green-600" : "text-red-600"
                  )}>
                    Shipping Address *
                  </Label>
                  <GooglePlacesAutocomplete
                    value={profileData.address}
                    onChange={(value) => {
                      setProfileData(prev => ({ ...prev, address: value }));
                      setMandatoryValidation(prev => ({ 
                        ...prev, 
                        address: value.trim().length > 0
                      }));
                    }}
                    onAddressSelect={(address) => {
                      setProfileData(prev => ({ ...prev, address: address.formatted_address }));
                      setMandatoryValidation(prev => ({ 
                        ...prev, 
                        address: true
                      }));
                    }}
                    placeholder="Enter your address"
                    className={cn(
                      mandatoryValidation.address ? "border-green-300" : "border-red-300"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2" className="font-medium text-muted-foreground">
                    Apartment, Suite, Unit (optional)
                  </Label>
                  <Input
                    id="addressLine2"
                    value={profileData.addressLine2}
                    onChange={(e) => setProfileData(prev => ({ ...prev, addressLine2: e.target.value }))}
                    placeholder="Apt, Suite, Unit, Building, Floor, etc."
                    className="w-full"
                  />
                </div>

                {/* Validation Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Required Fields:</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(mandatoryValidation).map(([field, isValid]) => (
                      <div key={field} className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          isValid ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className={isValid ? "text-green-700" : "text-red-700"}>
                          {field === 'firstName' && 'First Name'}
                          {field === 'lastName' && 'Last Name'}
                          {field === 'email' && 'Email'}
                          {field === 'username' && 'Username'}
                          {field === 'dateOfBirth' && 'Date of Birth'}
                          {field === 'address' && 'Shipping Address'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleProfileSetup}
                  disabled={!Object.values(mandatoryValidation).every(Boolean)}
                  className="w-full"
                >
                  {Object.values(mandatoryValidation).every(Boolean) 
                    ? 'Continue to Intent Selection' 
                    : 'Complete All Required Fields'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Intent Discovery */}
          {step === 'intent' && (
            <Dialog open={true} modal={true}>
              <DialogContent className="sm:max-w-md animate-fade-in p-6 max-w-[90vw]">
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-xl font-semibold text-center">
                    Welcome! What brings you to Elyphant?
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-5 mt-4">
                  <Button
                    variant="outline"
                    className="flex items-center justify-start gap-3 p-4 w-full h-auto text-left hover:bg-purple-50 hover:border-purple-300 border-2 disabled:opacity-50"
                    onClick={() => handleIntentSelection("giftor")}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 text-purple-600 flex-shrink-0 animate-spin" />
                    ) : (
                      <Gift className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-foreground">
                        I'm here to <span className="font-semibold text-purple-700">give a gift</span>
                      </span>
                      <span className="text-sm text-muted-foreground font-normal mt-0.5">
                        Buy a gift for someone else (no wishlist needed)
                      </span>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-start gap-3 p-4 w-full h-auto text-left hover:bg-indigo-50 hover:border-indigo-300 border-2 disabled:opacity-50"
                    onClick={() => handleIntentSelection("giftee")}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 text-indigo-600 flex-shrink-0 animate-spin" />
                    ) : (
                      <List className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-foreground">
                        I want to <span className="font-semibold text-indigo-700">set up a wishlist</span>
                      </span>
                      <span className="text-sm text-muted-foreground font-normal mt-0.5">
                        Create &amp; share your wishlist for perfect gifting
                      </span>
                    </div>
                  </Button>
                </div>
                {loading && (
                  <div className="text-center mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">Setting up your account...</p>
                    </div>
                    <p className="text-xs text-muted-foreground">This may take a few moments</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default StreamlinedSignUp;