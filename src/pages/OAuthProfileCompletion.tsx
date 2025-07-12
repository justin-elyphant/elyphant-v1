import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfileImageStep from "@/components/profile-setup/steps/ProfileImageStep";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const OAuthProfileCompletion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    dateOfBirth: ''
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    // Load existing profile data and OAuth metadata
    const loadProfileData = async () => {
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (existingProfile) {
          setProfile(existingProfile);
          
          // Pre-populate form with existing data or OAuth data
          setFormData({
            firstName: existingProfile.first_name || '',
            lastName: existingProfile.last_name || '',
            username: existingProfile.username || '',
            dateOfBirth: existingProfile.dob || ''
          });
          
          setProfileImageUrl(existingProfile.profile_image || null);

          // If profile is already complete (including profile image), redirect to dashboard
          if (existingProfile.first_name && 
              existingProfile.last_name && 
              existingProfile.username && 
              existingProfile.dob &&
              existingProfile.profile_image) {
            LocalStorageService.markProfileSetupCompleted();
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      }
    };

    loadProfileData();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Profile photo is now optional
    // if (!profileImageUrl) {
    //   toast.error("Profile photo is required", {
    //     description: "Please upload a profile photo to continue"
    //   });
    //   return;
    // }

    setLoading(true);
    try {
      // Extract birth year from date of birth
      const birthYear = formData.dateOfBirth ? new Date(formData.dateOfBirth).getFullYear() : new Date().getFullYear() - 25;
      
      // Update profile with mandatory fields including profile image
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          username: formData.username,
          birth_year: birthYear,
          dob: formData.dateOfBirth,
          profile_image: profileImageUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      // Mark profile setup as completed and trigger intent modal
      LocalStorageService.markProfileSetupCompleted();
      LocalStorageService.setProfileCompletionState({
        step: 'intent',
        source: 'oauth',
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: user.email || '',
        username: formData.username,
        photo: profileImageUrl || undefined
      });
      LocalStorageService.cleanupDeprecatedKeys();

      toast.success('Profile completed successfully!');
      // Instead of going directly to dashboard, redirect to trigger intent modal
      navigate('/profile-setup');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to complete profile setup');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.firstName && 
                     formData.lastName && 
                     formData.username && 
                     formData.dateOfBirth; // Profile photo is now optional

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please complete your profile to continue using the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mandatory Profile Photo */}
              <div className="space-y-2">
                <Label>Profile Photo (Optional)</Label>
                <ProfileImageStep
                  value={profileImageUrl}
                  onChange={setProfileImageUrl}
                  name={`${formData.firstName} ${formData.lastName}`.trim() || 'User'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>


              <Button 
                type="submit" 
                className="w-full" 
                disabled={!isFormValid || loading}
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
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default OAuthProfileCompletion;