
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PostSignupAction {
  type: 'follow' | 'message' | 'view_profile' | 'view_wishlists';
  targetUserId: string;
  targetName: string;
}

export const usePostSignupAction = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const storedAction = sessionStorage.getItem('elyphant-post-signup-action');
    if (!storedAction) return;

    const handlePostSignupAction = async () => {
      try {
        const action: PostSignupAction = JSON.parse(storedAction);
        
        // Clear the stored action
        sessionStorage.removeItem('elyphant-post-signup-action');

        // Trigger email orchestrator for new user onboarding
        try {
          await supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'user_welcomed',
              userId: user.id,
              metadata: {
                postSignupAction: action,
                welcomeContext: 'post_signup_flow'
              }
            }
          });
        } catch (emailError) {
          console.error('Non-blocking: Email orchestrator failed for post-signup:', emailError);
          // Don't block the user flow for email issues
        }

      // Execute the action after a short delay to ensure the user is fully authenticated
      setTimeout(() => {
        switch (action.type) {
          case 'follow':
            toast.success(`Welcome! You can now follow ${action.targetName}`, {
              action: {
                label: 'Go to Profile',
                onClick: () => window.location.href = `/profile/${action.targetUserId}`
              }
            });
            break;
          
          case 'message':
            toast.success(`Welcome! You can now message ${action.targetName}`, {
              action: {
                label: 'Send Message',
                onClick: () => window.location.href = `/messaging/${action.targetUserId}`
              }
            });
            break;
          
          case 'view_profile':
            window.location.href = `/profile/${action.targetUserId}`;
            break;
          
          case 'view_wishlists':
            toast.success(`Welcome! You can now view ${action.targetName}'s wishlists`, {
              action: {
                label: 'View Wishlists',
                onClick: () => window.location.href = `/profile/${action.targetUserId}`
              }
            });
            break;
        }
      }, 1000);

      } catch (error) {
        console.error('Error processing post-signup action:', error);
        sessionStorage.removeItem('elyphant-post-signup-action');
      }
    };

    handlePostSignupAction();
  }, [user]);
};
