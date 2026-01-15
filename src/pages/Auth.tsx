
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INVITATION_TOKEN_STORAGE_KEY = 'elyphant_invitation_token';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { profileData } = useProfileRetrieval();

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

  // Validate invitation token on mount and store for post-signup linking
  useEffect(() => {
    const validateInvitation = async () => {
      if (!inviteToken) return;
      
      console.log('[Auth] Validating invite token:', inviteToken);
      
      // Store token in sessionStorage for post-signup linking (handles different email signup)
      sessionStorage.setItem(INVITATION_TOKEN_STORAGE_KEY, inviteToken);
      console.log('[Auth] Stored invitation token for post-signup linking');
      
      try {
        // Call edge function to validate invitation (bypasses RLS issues)
        const { data, error } = await supabase.functions.invoke('validate-invite', {
          body: { token: inviteToken }
        });
        
        console.log('[Auth] Edge function response:', data, error);
        
        if (error || !data) {
          console.error('[Auth] Failed to validate invitation:', error);
          // Check for cancelled invitation
          if (data?.type === 'cancelled') {
            toast.error(data.message || 'This invitation was cancelled');
          } else {
            toast.error('Invalid or expired invitation link');
          }
          return;
        }
        
        if (data.type === 'connection') {
          // This is a connection invitation
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
          // This is a gift invitation
          setInvitationData({
            connectionId: data.connectionId,
            recipientEmail: data.recipientEmail || '',
            recipientName: data.recipientName || '',
            senderName: data.senderName || 'Someone'
          });
          
          toast.success(`🎁 You've been invited to join Elyphant!`);
          return;
        }
        
        // Invalid response type
        toast.error('Invalid invitation link');
      } catch (error) {
        console.error('[Auth] Failed to validate invitation:', error);
        toast.error('Failed to validate invitation');
      }
    };
    
    validateInvitation();
  }, [inviteToken]);

  // Handle post-signup linking and redirect
  useEffect(() => {
    if (user && !isLoading) {
      const handlePostSignupLinking = async () => {
        try {
          // Check for stored invitation token (handles different email signup)
          const storedToken = sessionStorage.getItem(INVITATION_TOKEN_STORAGE_KEY);
          
          if (storedToken) {
            console.log('[Auth] Found stored invitation token, attempting to link by token...');
            
            // Try to link by token first (works even if user signed up with different email)
            const { data: tokenLinkResult, error: tokenLinkError } = await supabase
              .rpc('accept_invitation_by_token', {
                p_user_id: user.id,
                p_token: storedToken
              });
            
            if (!tokenLinkError && tokenLinkResult?.linked) {
              console.log('[Auth] Successfully linked connection by token:', tokenLinkResult);
              toast.success('🤝 Connection established!', {
                description: 'You are now connected with your friend'
              });
            } else {
              console.log('[Auth] Token-based linking failed or no match:', tokenLinkError);
            }
            
            // Clear stored token after attempting to use it
            sessionStorage.removeItem(INVITATION_TOKEN_STORAGE_KEY);
          }
          
          // Also try email-based linking for auto-gift rules
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
      
      handlePostSignupLinking();
      
      // Normal redirect flow
      const redirectPath = searchParams.get('redirect') || '/';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, profileData, navigate, searchParams]);

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
      <div className="container max-w-md mx-auto py-8 md:py-20 px-4 flex-grow flex items-center justify-center pt-safe pb-safe my-6 md:my-0">
        <UnifiedAuthView 
          initialMode={preFilledEmail ? 'signin' : initialMode} 
          preFilledEmail={preFilledEmail || invitationData?.recipientEmail}
          invitationData={invitationData}
        />
      </div>
    </MainLayout>
  );
};

export default Auth;
