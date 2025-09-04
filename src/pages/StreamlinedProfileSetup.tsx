
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { useOnboardingCompletion } from "@/hooks/onboarding/useOnboardingCompletion";
import { useInvitationAnalytics } from "@/services/analytics/invitationAnalyticsService";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import StreamlinedProfileForm from "@/components/auth/unified/StreamlinedProfileForm";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleOnboardingComplete } = useOnboardingCompletion();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [invitationContext, setInvitationContext] = useState<any>(null);
  const { trackProfileSetupCompleted } = useInvitationAnalytics();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check for invitation context from URL params
    const isInvited = searchParams.get('invited') === 'true';
    const giftorName = searchParams.get('giftor');
    const occasion = searchParams.get('occasion');
    const relationship = searchParams.get('relationship');

    if (isInvited && giftorName) {
      setInvitationContext({
        isInvited: true,
        giftorName,
        occasion,
        relationship
      });
    }

    // Check if user needs profile setup
    const completionState = LocalStorageService.getProfileCompletionState();
    
    if (completionState?.step === 'profile') {
      // Show profile form
      setIsLoading(false);
    } else {
      // Already completed, redirect to homepage
      navigate('/');
    }
  }, [user, navigate, searchParams]);

  const handleProfileComplete = async () => {
    // Handle onboarding completion - syncs data and clears cache
    await handleOnboardingComplete();
    
    // Clear completion state
    LocalStorageService.clearProfileCompletionState();
    
    // Track profile setup completion for invited users
    if (invitationContext?.isInvited && user?.email) {
      await trackProfileSetupCompleted(user.email);
    }
    
    // Redirect invited users directly to marketplace (giftees)
    if (invitationContext?.isInvited) {
      navigate('/marketplace', { replace: true });
    } else {
      // Check for stored redirect path after profile setup
      const redirectPath = localStorage.getItem('post_auth_redirect');
      if (redirectPath) {
        localStorage.removeItem('post_auth_redirect');
        navigate(redirectPath, { replace: true });
      } else {
        // Regular profile setup, redirect to homepage
        navigate('/', { replace: true });
      }
    }
  };


  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="w-full">
          <Card className="w-full bg-background shadow-lg border border-border">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  {invitationContext?.isInvited ? 'Welcome to Elyphant!' : 'Complete Your Profile'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {invitationContext?.isInvited 
                    ? `${invitationContext.giftorName} invited you to get amazing gifts${invitationContext.occasion ? ` for your ${invitationContext.occasion}` : ''}!`
                    : 'Tell us about yourself to personalize your experience'
                  }
                </p>
              </div>
              
              <StreamlinedProfileForm onComplete={handleProfileComplete} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default StreamlinedProfileSetup;
