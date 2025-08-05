
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { useOnboardingCompletion } from "@/hooks/onboarding/useOnboardingCompletion";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import StreamlinedProfileForm from "@/components/auth/unified/StreamlinedProfileForm";
import NicolePopup from "@/components/ai/NicolePopup";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleOnboardingComplete } = useOnboardingCompletion();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showNicolePopup, setShowNicolePopup] = useState(false);
  const [invitationContext, setInvitationContext] = useState<any>(null);
  
  // Initialize Nicole AI for invitation context
  const { chatWithNicole } = useUnifiedNicoleAI({
    initialContext: { 
      capability: 'gift_advisor',
      conversationPhase: 'giftee_onboarding'
    }
  });

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
    
    // If this was an invitation, show Nicole popup for gift preference collection
    if (invitationContext?.isInvited) {
      setShowNicolePopup(true);
    } else {
      // Regular profile setup, redirect to homepage
      navigate('/', { replace: true });
    }
  };

  const handleNicoleClose = () => {
    setShowNicolePopup(false);
    navigate('/', { replace: true });
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
      
      {/* Nicole Popup for Invited Users */}
      {showNicolePopup && invitationContext?.isInvited && (
        <NicolePopup
          isOpen={showNicolePopup}
          onClose={handleNicoleClose}
          initialContext={{
            capability: 'gift_advisor',
            conversationPhase: 'giftee_preference_collection',
            userFirstName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'there',
            recipient: invitationContext.giftorName,
            occasion: invitationContext.occasion,
            relationship: invitationContext.relationship
          }}
          welcomeMessage={`Hey ${user?.user_metadata?.name || 'there'}! 👋 Welcome to Elyphant. As mentioned, ${invitationContext.giftorName} wants to get you a gift${invitationContext.occasion ? ` for your upcoming ${invitationContext.occasion}` : ''}. Briefly tell me about brands you like, hobbies, sizes, or anything that would help ${invitationContext.giftorName} get you the best gift possible!`}
        />
      )}
    </MainLayout>
  );
};

export default StreamlinedProfileSetup;
