import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WelcomeWishlistTriggerData {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName?: string;
  birthYear?: number;
  interests?: string[];
  inviterName?: string;
  profileData?: {
    gender?: string;
    lifestyle?: string;
    favoriteCategories?: string[];
  };
}

export const useWelcomeWishlist = () => {
  const [isLoading, setIsLoading] = useState(false);

  const triggerWelcomeWishlist = async (data: WelcomeWishlistTriggerData) => {
    setIsLoading(true);
    
    try {
      console.log('🎁 Triggering welcome wishlist for user:', data.userId);

      const { data: result, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'wishlist_welcome',
          customData: data
        }
      });

      if (error) {
        console.error('❌ Failed to trigger welcome wishlist:', error);
        throw error;
      }

      console.log('✅ Welcome wishlist triggered successfully:', result);
      
      toast.success("Welcome email sent! 📧 Nicole has sent you a curated starter wishlist to get you started.");

      return { success: true, data: result };
    } catch (error: any) {
      console.error('❌ Welcome wishlist trigger error:', error);
      
      toast.info("Welcome email delayed - Don't worry, you'll receive your personalized recommendations shortly!");

      return { success: false, error: error.message || 'Failed to send welcome wishlist' };
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleDelayedWelcomeEmail = async (data: WelcomeWishlistTriggerData, delayMinutes = 15) => {
    try {
      // Store the welcome email trigger data for delayed processing
      const { error } = await supabase.from('email_queue').insert({
        recipient_email: data.userEmail,
        recipient_name: data.userFirstName,
        template_id: null, // We'll use custom template
        template_variables: {
          welcomeWishlistData: data as any,
          source: 'delayed_signup'
        } as any,
        scheduled_for: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(),
        status: 'pending',
        max_attempts: 2
      });

      if (error) {
        console.error('❌ Failed to schedule delayed welcome email:', error);
        // Fallback to immediate sending
        return await triggerWelcomeWishlist(data);
      }

      console.log(`📅 Welcome email scheduled for ${delayMinutes} minutes from now`);
      return { success: true, scheduled: true };
    } catch (error) {
      console.error('❌ Scheduling error, falling back to immediate send:', error);
      return await triggerWelcomeWishlist(data);
    }
  };

  return {
    triggerWelcomeWishlist,
    scheduleDelayedWelcomeEmail,
    isLoading
  };
};