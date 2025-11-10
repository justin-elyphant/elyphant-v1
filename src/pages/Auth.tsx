
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";
import QuickInterestsModal from "@/components/auth/QuickInterestsModal";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { profileData } = useProfileRetrieval();
  const [showQuickInterests, setShowQuickInterests] = useState(false);

  // Detect initial mode from URL parameters
  const mode = searchParams.get('mode') as 'signin' | 'signup' | null;
  const initialMode = mode || 'signup'; // Default to signup if no mode specified

  // Get pre-filled email from password reset navigation state
  const preFilledEmail = location.state?.email;
  
  // Handle invitation links (both connection invites and gift invitations)
  const inviteToken = searchParams.get('invite') || searchParams.get('invitation_token');
  const [invitationData, setInvitationData] = useState<{
    connectionId: string;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
  } | null>(null);

  // Validate invitation token on mount
  useEffect(() => {
    const validateInvitation = async () => {
      if (!inviteToken) return;
      
      console.log('[Auth] Validating invite token:', inviteToken);
      
      try {
        // First, try to find a connection invitation (without profile join to avoid RLS blocking)
        const { data: connectionData, error: connectionError } = await supabase
          .from('user_connections')
          .select('id, pending_recipient_email, pending_recipient_name, user_id')
          .eq('invitation_token', inviteToken)
          .eq('status', 'pending_invitation')
          .maybeSingle();
        
        console.log('[Auth] user_connections match:', !!connectionData, connectionData);
        
        if (connectionData) {
          // This is a connection invitation - use generic sender name initially
          setInvitationData({
            connectionId: connectionData.id,
            recipientEmail: connectionData.pending_recipient_email || '',
            recipientName: connectionData.pending_recipient_name || '',
            senderName: 'Your friend' // Generic initially to avoid RLS block
          });
          
          toast.success("You've been invited to join Elyphant!");
          
          // Optionally try to fetch sender name (non-blocking, may fail due to RLS)
          try {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('first_name, name')
              .eq('id', connectionData.user_id)
              .single();
            
            if (senderProfile) {
              const senderName = senderProfile.first_name || senderProfile.name || 'Your friend';
              setInvitationData(prev => prev ? { ...prev, senderName } : null);
              toast.success(`${senderName} invited you to connect on Elyphant!`);
            }
          } catch (profileError) {
            // Silently ignore - RLS likely blocked this for anonymous user
            console.log('[Auth] Could not fetch sender profile (expected for anonymous users)');
          }
          
          return;
        }
        
        // If not found in connections, check pending_gift_invitations
        const { data: giftInvitationData, error: giftError } = await supabase
          .from('pending_gift_invitations')
          .select('recipient_email, recipient_name')
          .eq('invitation_token', inviteToken)
          .eq('status', 'pending')
          .maybeSingle();
        
        console.log('[Auth] pending_gift_invitations match:', !!giftInvitationData, giftInvitationData);
        
        if (giftInvitationData) {
          // This is a gift invitation - sender info will be in the invitation context
          setInvitationData({
            connectionId: inviteToken, // Use token as ID for gift invitations
            recipientEmail: giftInvitationData.recipient_email || '',
            recipientName: giftInvitationData.recipient_name || '',
            senderName: 'Someone' // Gift invitation sender name handled separately
          });
          
          toast.success(`🎁 You've been invited to join Elyphant!`);
          return;
        }
        
        // Neither found - invalid or expired
        toast.error('Invalid or expired invitation link');
      } catch (error) {
        console.error('Failed to validate invitation:', error);
        toast.error('Failed to validate invitation');
      }
    };
    
    validateInvitation();
  }, [inviteToken]);

  // Handle post-signup interests modal and redirect
  useEffect(() => {
    if (user && !isLoading) {
      // NEW: Check for and link pending auto-gift rules
      const linkPendingRules = async () => {
        try {
          const { data, error } = await supabase
            .rpc('link_pending_rules_manual', {
              p_user_id: user.id,
              p_email: user.email
            });
          
          if (!error && data && typeof data === 'object' && 'linked_count' in data) {
            const linkedCount = (data as { linked_count: number }).linked_count;
            if (linkedCount > 0) {
              toast.success(`🎁 ${linkedCount} auto-gift rule(s) activated for you!`, {
                description: "Your friend has set up automatic gifting"
              });
            }
          }
        } catch (error) {
          console.error('Failed to link pending rules:', error);
        }
      };
      
      linkPendingRules();

      // Check if we should show the quick interests modal
      const shouldShowQuickInterests = localStorage.getItem("showQuickInterests") === "true";
      
      if (shouldShowQuickInterests) {
        // Wait for profile data to load before checking interests
        if (profileData !== null) {
          const hasNoInterests = !profileData.interests || profileData.interests.length === 0;
          const hasRedirect = searchParams.get('redirect');
          
          if (hasNoInterests && !hasRedirect) {
            // Clear the flag and show modal
            localStorage.removeItem("showQuickInterests");
            setShowQuickInterests(true);
            return;
          } else {
            // User already has interests or there's a redirect, skip modal
            localStorage.removeItem("showQuickInterests");
          }
        } else if (profileData === null) {
          // Still loading profile data, wait
          return;
        }
      }
      
      // Normal redirect flow
      const redirectPath = searchParams.get('redirect') || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, profileData, navigate, searchParams]);

  const handleInterestsComplete = () => {
    // After interests are set (or skipped), redirect to gifting
    navigate('/gifting', { replace: true });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <UnifiedAuthView 
          initialMode={preFilledEmail ? 'signin' : initialMode} 
          preFilledEmail={preFilledEmail || invitationData?.recipientEmail}
          invitationData={invitationData}
        />
      </div>
      
      {/* Quick Interests Modal */}
      <QuickInterestsModal
        isOpen={showQuickInterests}
        onClose={() => setShowQuickInterests(false)}
        onComplete={handleInterestsComplete}
      />
    </MainLayout>
  );
};

export default Auth;
