
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import HomeContent from "@/components/home/HomeContent";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import Footer from "@/components/home/Footer";
import MinimalSignInView from "@/components/auth/signin/MinimalSignInView";
import SteppedAuthFlow from "@/components/auth/stepped/SteppedAuthFlow";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INVITATION_TOKEN_STORAGE_KEY = 'elyphant_invitation_token';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { profileData } = useProfileRetrieval();

  const mode = searchParams.get('mode') as 'signin' | 'signup' | null;
  const initialMode = mode || 'signup';
  const preFilledEmail = location.state?.email;
  
  const inviteToken = searchParams.get('invite') || searchParams.get('invitation_token');
  const inviteUserId = searchParams.get('invite_user');
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
      localStorage.setItem(INVITATION_TOKEN_STORAGE_KEY, inviteToken);
      
      try {
        const { data, error } = await supabase.functions.invoke('validate-invite', {
          body: { token: inviteToken }
        });
        
        if (error || !data) {
          console.error('[Auth] Failed to validate invitation:', error);
          if (data?.type === 'cancelled') {
            toast.error(data.message || 'This invitation was cancelled');
          } else {
            toast.error('Invalid or expired invitation link');
          }
          return;
        }
        
        if (data.type === 'connection') {
          setInvitationData({
            connectionId: data.connectionId,
            recipientEmail: data.recipientEmail || '',
            recipientName: data.recipientName || '',
            senderName: data.senderName || 'Your friend'
          });
          toast.success(`${data.senderName || 'Your friend'} invited you to connect on Elyphant!`);
          return;
        }
        
        if (data.type === 'gift') {
          setInvitationData({
            connectionId: data.connectionId,
            recipientEmail: data.recipientEmail || '',
            recipientName: data.recipientName || '',
            senderName: data.senderName || 'Someone'
          });
          toast.success(`🎁 You've been invited to join Elyphant!`);
          return;
        }
        
        toast.error('Invalid invitation link');
      } catch (error) {
        console.error('[Auth] Failed to validate invitation:', error);
        toast.error('Failed to validate invitation');
      }
    };
    
    validateInvitation();
  }, [inviteToken]);

  // Handle already-authenticated users — redirect immediately without full linking flow
  useEffect(() => {
    if (!user || isLoading) return;

    // Check if this is a fresh post-signup (has invitation tokens to process)
    const storedToken = localStorage.getItem(INVITATION_TOKEN_STORAGE_KEY);
    const storedInviteUser = inviteUserId || sessionStorage.getItem('elyphant_invite_user');
    const hasPendingLinking = storedToken || storedInviteUser;

    if (!hasPendingLinking) {
      // Already logged in, no pending invitations — just redirect
      const redirectPath = searchParams.get('redirect');
      navigate(redirectPath || '/', { replace: true });
      return;
    }

    // Post-signup linking flow (only runs when there are pending invitations)
    const handlePostSignupLinking = async () => {
      let inviterProfileId: string | null = null;
      
      try {
        if (storedToken) {
          const { data: tokenLinkResult, error: tokenLinkError } = await supabase
            .rpc('accept_invitation_by_token' as any, {
              p_user_id: user.id,
              p_token: storedToken
            });
          
          const linkResult = tokenLinkResult as { linked?: boolean; connection_id?: string; inviter_id?: string } | null;
          if (!tokenLinkError && linkResult?.linked) {
            inviterProfileId = linkResult.inviter_id || null;
            toast.success('🤝 Connection established!', {
              description: 'You are now connected with your friend'
            });
          }
          
          localStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
        }
        
        if (storedInviteUser && storedInviteUser !== user.id) {
          try {
            const { sendConnectionRequest } = await import(
              "@/services/connections/connectionService"
            );
            const result = await sendConnectionRequest(storedInviteUser, 'friend');
            if (result.success) {
              inviterProfileId = storedInviteUser;
              toast.success('🤝 Connection request sent!');
            }
          } catch (err) {
            console.error('[Auth] Error auto-connecting to inviter:', err);
          }
          sessionStorage.removeItem('elyphant_invite_user');
        }
        
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
      
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (inviterProfileId) {
        navigate(`/profile/${inviterProfileId}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    };
    
    handlePostSignupLinking();
  }, [user, isLoading, profileData, navigate, searchParams, inviteUserId]);

  const isSignupMode = initialMode === 'signup' && !preFilledEmail;
  const isOAuthResume = searchParams.get('oauth_resume') === 'true';

  const handleCloseModal = () => {
    navigate('/', { replace: true });
  };

  // Determine modal content
  const renderModalContent = () => {
    if (isSignupMode || isOAuthResume) {
      return <SteppedAuthFlow invitationData={invitationData} />;
    }
    
    // Sign-in mode
    return (
      <MinimalSignInView 
        preFilledEmail={preFilledEmail || invitationData?.recipientEmail}
        invitationData={invitationData}
      />
    );
  };

  return (
    <div className="min-h-screen surface-primary flex flex-col">
      {/* Homepage as backdrop — always rendered immediately, no flash */}
      <UnifiedShopperHeader mode="main" />
      <main className="flex-1">
        <HomeContent />
      </main>
      <Footer />

      {/* Auth modal overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-2xl border border-border/50 md:my-8 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute right-3 top-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {renderModalContent()}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Auth;
