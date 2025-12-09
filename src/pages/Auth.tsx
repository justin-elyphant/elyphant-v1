
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";
import { useProfileRetrieval } from "@/hooks/profile/useProfileRetrieval";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

  // Validate invitation token on mount
  useEffect(() => {
    const validateInvitation = async () => {
      if (!inviteToken) return;
      
      console.log('[Auth] Validating invite token:', inviteToken);
      
      try {
        // Call edge function to validate invitation (bypasses RLS issues)
        const { data, error } = await supabase.functions.invoke('validate-invite', {
          body: { token: inviteToken }
        });
        
        console.log('[Auth] Edge function response:', data, error);
        
        if (error || !data) {
          console.error('[Auth] Failed to validate invitation:', error);
          toast.error('Invalid or expired invitation link');
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
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center pt-safe pb-safe">
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
