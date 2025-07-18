
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

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

    try {
      const action: PostSignupAction = JSON.parse(storedAction);
      
      // Clear the stored action
      sessionStorage.removeItem('elyphant-post-signup-action');

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
  }, [user]);
};
