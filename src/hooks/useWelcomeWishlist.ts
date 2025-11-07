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
      console.log('🎁 Triggering welcome email for user:', data.userId);

      const { data: result, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'welcome_email',
          recipientEmail: data.userEmail,
          data: {
            first_name: data.userFirstName,
            gifting_url: 'https://app.elyphant.ai/gifting',
            wishlists_url: 'https://app.elyphant.ai/wishlists',
            signup_context: 'direct',
            user_id: data.userId,
            interests: data.interests,
            birth_year: data.birthYear,
            profile_data: data.profileData
          }
        }
      });

      if (error) {
        console.error('❌ Failed to trigger welcome email:', error);
        throw error;
      }

      console.log('✅ Welcome email sent successfully:', result);
      
      toast.success("Welcome email sent! 📧 Check your inbox for personalized recommendations.");

      return { success: true, data: result };
    } catch (error: any) {
      console.error('❌ Welcome email trigger error:', error);
      
      toast.info("Welcome email delayed - Don't worry, you'll receive your personalized recommendations shortly!");

      return { success: false, error: error.message || 'Failed to send welcome email' };
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleDelayedWelcomeEmail = async (data: WelcomeWishlistTriggerData, delayMinutes = 15) => {
    try {
      // Store the welcome email trigger data for delayed processing using modern format
      const { error } = await supabase.from('email_queue').insert({
        event_type: 'welcome_email',
        recipient_email: data.userEmail,
        scheduled_for: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(),
        priority: 'normal',
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
        metadata: {
          first_name: data.userFirstName,
          gifting_url: 'https://app.elyphant.ai/gifting',
          wishlists_url: 'https://app.elyphant.ai/wishlists',
          signup_context: 'direct',
          user_id: data.userId,
          interests: data.interests,
          birth_year: data.birthYear,
          profile_data: data.profileData,
          source: 'delayed_signup'
        }
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