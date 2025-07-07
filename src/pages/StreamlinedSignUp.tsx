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
import { CalendarIcon, Upload, Gift, List, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import MainLayout from '@/components/layout/MainLayout';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  photo?: string;
  username: string;
  dateOfBirth?: Date;
  address: string;
}

type Step = 'signup' | 'profile' | 'intent';

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
    address: ''
  });

  // Handle user redirection and intent completion
  useEffect(() => {
    const intentParam = searchParams.get('intent');
    
    if (user) {
      // If user is authenticated and came here to complete profile, allow them to continue
      if (intentParam === 'complete-profile') {
        setStep('profile');
        return;
      }
      // Otherwise redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, searchParams]);

  const handleSignUp = async () => {
    if (!profileData.email || !profileData.password || !profileData.firstName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: profileData.email,
        password: profileData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Account already exists', {
            description: 'Please sign in instead.'
          });
          navigate('/signin');
          return;
        }
        throw error;
      }

      // Store profile data for later steps
      localStorage.setItem('pendingProfileData', JSON.stringify(profileData));
      localStorage.setItem('signupRedirectPath', redirectPath);
      
      toast.success('Account created!', {
        description: 'Let\'s set up your profile.'
      });
      
      setStep('profile');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error('Sign up failed', {
        description: error.message || 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = () => {
    if (!profileData.username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    setStep('intent');
  };

  const handleIntentSelection = async (intent: 'giftor' | 'giftee') => {
    setLoading(true);
    try {
      // Create/update profile with all collected data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          email: profileData.email,
          username: profileData.username,
          profile_image: profileData.photo,
          dob: profileData.dateOfBirth?.toISOString(),
          shipping_address: profileData.address ? { formatted_address: profileData.address } : null,
          profile_type: intent,
          onboarding_completed: true
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error('Profile setup failed', {
          description: 'Please try again.'
        });
        return;
      }

      // Clear stored data
      localStorage.removeItem('pendingProfileData');
      localStorage.removeItem('signupRedirectPath');
      
      toast.success('Welcome to Elyphant!', {
        description: 'Your account is ready to go.'
      });

      // Route based on intent
      if (intent === 'giftor') {
        navigate('/marketplace?mode=nicole&open=true&greeting=personalized', { replace: true });
      } else {
        navigate('/marketplace?mode=wishlist', { replace: true });
      }
    } catch (error: any) {
      console.error('Intent selection error:', error);
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const userInitials = profileData.firstName 
    ? `${profileData.firstName[0]}${profileData.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  if (user && step !== 'intent') return null;

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
          {step === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Set Up Your Profile</CardTitle>
                <p className="text-center text-muted-foreground">
                  Just a few quick details to personalize your experience
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
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
                  </div>
                  <p className="text-sm text-muted-foreground">Add a profile photo (optional)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !profileData.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {profileData.dateOfBirth ? (
                          format(profileData.dateOfBirth, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={profileData.dateOfBirth}
                        onSelect={(date) => setProfileData(prev => ({ ...prev, dateOfBirth: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Shipping Address (optional)</Label>
                  <GooglePlacesAutocomplete
                    value={profileData.address}
                    onChange={(value) => setProfileData(prev => ({ ...prev, address: value }))}
                    onAddressSelect={(address) => 
                      setProfileData(prev => ({ ...prev, address: address.formatted_address }))
                    }
                    placeholder="Enter your address"
                  />
                </div>

                <Button 
                  onClick={handleProfileSetup}
                  disabled={!profileData.username.trim()}
                  className="w-full"
                >
                  Continue
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
                    className="flex items-center justify-start gap-3 p-4 w-full h-auto text-left hover:bg-purple-50 hover:border-purple-300 border-2"
                    onClick={() => handleIntentSelection("giftor")}
                    disabled={loading}
                  >
                    <Gift className="w-6 h-6 text-purple-600 flex-shrink-0" />
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
                    className="flex items-center justify-start gap-3 p-4 w-full h-auto text-left hover:bg-indigo-50 hover:border-indigo-300 border-2"
                    onClick={() => handleIntentSelection("giftee")}
                    disabled={loading}
                  >
                    <List className="w-6 h-6 text-indigo-600 flex-shrink-0" />
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
                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">Setting up your account...</p>
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