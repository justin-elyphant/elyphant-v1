import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Upload, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { unifiedProfileService } from '@/services/profiles/UnifiedProfileService';
import { LocalStorageService } from '@/services/localStorage/LocalStorageService';

interface OAuthProfileData {
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  username: string;
  dateOfBirth?: Date;
  birthYear?: number;
  address: string;
}

const OAuthProfileCompletion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<OAuthProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    address: ''
  });
  const [mandatoryValidation, setMandatoryValidation] = useState({
    firstName: false,
    lastName: false,
    email: false,
    photo: false,
    username: false,
    dateOfBirth: false,
    birthYear: false
  });

  // Initialize with OAuth data and completion state
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata || {};
      const completionState = LocalStorageService.getProfileCompletionState();
      
      // Pre-populate with OAuth data
      const initialData: OAuthProfileData = {
        firstName: metadata.first_name || metadata.given_name || completionState?.firstName || '',
        lastName: metadata.last_name || metadata.family_name || completionState?.lastName || '',
        email: user.email || completionState?.email || '',
        photo: metadata.avatar_url || metadata.picture || metadata.profile_image_url || completionState?.photo || '',
        username: metadata.preferred_username || completionState?.username || '',
        dateOfBirth: completionState?.dateOfBirth,
        birthYear: completionState?.birthYear,
        address: completionState?.address || ''
      };

      setProfileData(initialData);
      
      // Update completion state
      LocalStorageService.setProfileCompletionState({
        ...initialData,
        step: 'oauth-complete',
        source: 'oauth',
        oauthProvider: user.app_metadata?.provider
      });

      // Initial validation
      validateMandatoryFields(initialData);
    }
  }, [user]);

  // Process any stored invitation token for OAuth signups
  useEffect(() => {
    const processInvitation = async () => {
      if (!user?.id) return;
      
      const storedToken = sessionStorage.getItem('elyphant_invitation_token');
      if (!storedToken) return;
      
      console.log('[OAuth] Processing stored invitation token');
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'accept_invitation_by_token' as any,
          { p_token: storedToken, p_user_id: user.id }
        );
        
        if (!rpcError && rpcResult?.linked) {
          toast.success("Connection linked!", {
            description: "You're now connected with your friend!"
          });
        }
      } catch (error) {
        console.error('[OAuth] Error linking invitation:', error);
      } finally {
        sessionStorage.removeItem('elyphant_invitation_token');
      }
    };
    
    processInvitation();
  }, [user]);

  const validateMandatoryFields = (data: OAuthProfileData) => {
    const validation = {
      firstName: data.firstName.trim().length > 0,
      lastName: data.lastName.trim().length > 0,
      email: data.email.trim().length > 0,
      photo: !!data.photo,
      username: data.username.trim().length >= 3,
      dateOfBirth: !!data.dateOfBirth,
      birthYear: !!data.birthYear && data.birthYear >= 1900 && data.birthYear <= new Date().getFullYear()
    };
    
    setMandatoryValidation(validation);
    return Object.values(validation).every(Boolean);
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
        const newData = { ...profileData, photo: e.target?.result as string };
        setProfileData(newData);
        validateMandatoryFields(newData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    const newData = { ...profileData, photo: undefined };
    setProfileData(newData);
    validateMandatoryFields(newData);
  };

  const handleComplete = async () => {
    if (!validateMandatoryFields(profileData)) {
      toast.error('All fields are required', {
        description: 'Please complete all required fields before continuing.'
      });
      return;
    }

    if (!user?.id) {
      toast.error('Authentication error', {
        description: 'Please refresh and try again.'
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await unifiedProfileService.createEnhancedProfile(user.id, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        username: profileData.username,
        photo: profileData.photo,
        dateOfBirth: profileData.dateOfBirth,
        birthYear: profileData.birthYear,
        address: profileData.address
      });

      if (!result.success) {
        throw new Error(result.error || 'Profile creation failed');
      }

      // Verify profile creation
      const profileExists = await unifiedProfileService.verifyProfileExists(user.id);
      if (!profileExists) {
        throw new Error('Profile verification failed');
      }

      // Mark completion and clean up
      LocalStorageService.markProfileSetupCompleted();
      LocalStorageService.cleanupDeprecatedKeys();
      
      toast.success('Profile completed!', {
        description: 'Welcome to Elyphant!'
      });

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });

    } catch (error: any) {
      console.error('OAuth profile completion error:', error);
      toast.error('Setup failed', {
        description: error.message || 'Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const userInitials = profileData.firstName 
    ? `${profileData.firstName[0]}${profileData.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <p className="text-center text-muted-foreground">
            Please complete all required fields to finish setting up your account
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mandatory Profile Photo */}
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
              <p className={cn(
                "text-sm font-medium",
                mandatoryValidation.photo ? "text-green-600" : "text-red-600"
              )}>
                Profile photo
              </p>
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>

          {/* Mandatory Fields */}
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
                  const newData = { ...profileData, firstName: e.target.value };
                  setProfileData(newData);
                  validateMandatoryFields(newData);
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
                  const newData = { ...profileData, lastName: e.target.value };
                  setProfileData(newData);
                  validateMandatoryFields(newData);
                }}
                className={cn(
                  mandatoryValidation.lastName ? "border-green-300" : "border-red-300"
                )}
                required
              />
            </div>
          </div>

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
                const newData = { ...profileData, email: e.target.value };
                setProfileData(newData);
                validateMandatoryFields(newData);
              }}
              className={cn(
                mandatoryValidation.email ? "border-green-300" : "border-red-300"
              )}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className={cn(
              "font-medium",
              mandatoryValidation.username ? "text-green-600" : "text-red-600"
            )}>
              Username *
            </Label>
            <Input
              id="username"
              type="text"
              value={profileData.username}
              onChange={(e) => {
                const newData = { ...profileData, username: e.target.value };
                setProfileData(newData);
                validateMandatoryFields(newData);
              }}
              className={cn(
                mandatoryValidation.username ? "border-green-300" : "border-red-300"
              )}
              placeholder="At least 3 characters"
              required
            />
          </div>

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
                  {profileData.dateOfBirth ? format(profileData.dateOfBirth, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={profileData.dateOfBirth}
                  onSelect={(date) => {
                    const newData = { 
                      ...profileData, 
                      dateOfBirth: date,
                      birthYear: date ? date.getFullYear() : undefined
                    };
                    setProfileData(newData);
                    validateMandatoryFields(newData);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthYear" className={cn(
              "font-medium",
              mandatoryValidation.birthYear ? "text-green-600" : "text-red-600"
            )}>
              Birth Year *
            </Label>
            <Input
              id="birthYear"
              type="number"
              value={profileData.birthYear || ''}
              onChange={(e) => {
                const year = e.target.value ? parseInt(e.target.value) : undefined;
                const newData = { ...profileData, birthYear: year };
                setProfileData(newData);
                validateMandatoryFields(newData);
              }}
              className={cn(
                mandatoryValidation.birthYear ? "border-green-300" : "border-red-300"
              )}
              placeholder="YYYY"
              min="1900"
              max={new Date().getFullYear()}
              required
            />
          </div>

          <Button 
            onClick={handleComplete}
            disabled={loading || !Object.values(mandatoryValidation).every(Boolean)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing Profile...
              </>
            ) : (
              'Complete Profile'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthProfileCompletion;