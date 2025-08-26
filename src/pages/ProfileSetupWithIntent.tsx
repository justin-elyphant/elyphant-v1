import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import StreamlinedProfileForm from "@/components/auth/unified/StreamlinedProfileForm";
// Legacy modal removed - using Nicole unified interface
import { Loader2 } from "lucide-react";
import { createBirthdayImportantDate } from "@/utils/profileDataMapper";
import { supabase } from "@/integrations/supabase/client";

const ProfileSetupWithIntent = () => {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);

  const intentFromUrl = searchParams.get('intent');
  const invitationId = searchParams.get('invitation_id');
  const invitationSource = searchParams.get('source');

  useEffect(() => {
    // Redirect if not logged in
    if (!user && !loading) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if profile exists and redirect if it does
    if (user && profile) {
      navigate('/dashboard');
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    // Check if we have an intent (from URL or stored)
    const nicoleContext = LocalStorageService.getNicoleContext();
    const storedIntent = nicoleContext?.selectedIntent;
    const hasIntent = intentFromUrl || storedIntent;

    console.log("ProfileSetupWithIntent - Intent check:", {
      intentFromUrl,
      storedIntent,
      hasIntent,
      profile: !!profile
    });

    if (intentFromUrl) {
      LocalStorageService.setNicoleContext({ selectedIntent: intentFromUrl });
    }

    // Legacy modal removed - Nicole handles intent selection now
    if (profile && hasIntent && !hasCompletedProfile) {
      console.log("Profile complete with intent - navigating to dashboard with Nicole");
      navigate('/dashboard?nicole=true&intent=' + (intentFromUrl || storedIntent));
    }
  }, [user, profile, intentFromUrl, navigate, hasCompletedProfile]);

  const handleProfileSubmit = async (data: any) => {
    if (!user) return;
    
    setIsLoading(true);
    console.log('📝 Profile setup submission:', data);
    
    try {
      // Prepare the profile data with proper formatting
      const profileData = {
        first_name: data.first_name,
        last_name: data.last_name,
        name: `${data.first_name} ${data.last_name}`.trim(),
        email: data.email,
        username: data.username,
        bio: data.bio,
        profile_image: data.profile_image,
        dob: data.date_of_birth ? 
          `${(data.date_of_birth.getMonth() + 1).toString().padStart(2, '0')}-${data.date_of_birth.getDate().toString().padStart(2, '0')}` : 
          null,
        birth_year: data.date_of_birth ? data.date_of_birth.getFullYear() : null,
        shipping_address: data.address,
        interests: data.interests || [],
        gift_preferences: (data.interests || []).map((interest: string) => ({
          category: interest,
          importance: "medium" as const
        })),
        data_sharing_settings: data.data_sharing_settings
      };

      // Auto-add birthday to important dates if date_of_birth is provided
      let importantDates = data.importantDates || [];
      if (data.date_of_birth) {
        const birthdayEvent = createBirthdayImportantDate(profileData.dob!, profileData.birth_year);
        if (birthdayEvent) {
          // Check if birthday is not already in the list
          const hasBirthday = importantDates.some((date: any) => 
            date.description && date.description.toLowerCase().includes('birthday')
          );
          
          if (!hasBirthday) {
            console.log("🎂 Auto-adding birthday to important dates during profile setup");
            importantDates = [birthdayEvent, ...importantDates];
          }
        }
      }

      // Format important dates for API
      (profileData as any).important_dates = importantDates.map((date: any) => ({
        title: date.description,
        date: date.date.toISOString(),
        type: "custom",
        description: date.description
      }));

      await updateProfile(profileData);
      setHasCompletedProfile(true);

      // Handle invitation completion tracking
      if (invitationId && invitationSource === 'invitation') {
        try {
          await supabase.from("invitation_conversion_events").insert({
            invitation_id: invitationId,
            event_type: "profile_setup_completed",
            event_data: { 
              completion_time: new Date().toISOString(),
              has_auto_gift_intent: intentFromUrl === 'auto-gift'
            }
          });
          console.log('ProfileSetupWithIntent: Tracked invitation profile completion');
          toast.success("Welcome to Elyphant! Your connection has been established.");
          navigate('/connections', { replace: true });
          return;
        } catch (error) {
          console.error('Error tracking invitation completion:', error);
        }
      }

      // Check if we have an intent to navigate directly
      const storedIntent = LocalStorageService.getNicoleContext()?.selectedIntent;
      if (storedIntent || intentFromUrl) {
        console.log("Profile completed, navigating to dashboard with Nicole");
        navigate('/dashboard?nicole=true&intent=' + (storedIntent || intentFromUrl));
      } else {
        // No intent, go directly to dashboard
        toast.success("Profile setup completed!");
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile setup failed:', error);
      toast.error('Failed to complete profile setup');
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy intent handlers removed - Nicole handles all intent selection now

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!hasCompletedProfile && (
        <StreamlinedProfileForm 
          onComplete={() => handleProfileSubmit({})}
        />
      )}
      
      {/* Legacy modal removed - Nicole handles all intent selection now */}
    </div>
  );
};

export default ProfileSetupWithIntent;
