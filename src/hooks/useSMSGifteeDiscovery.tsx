import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/contexts/auth/useAuthSession';
import { toast } from 'sonner';

interface TemporaryGifteeProfile {
  id: string;
  phone_number: string;
  recipient_name?: string;
  relationship?: string;
  occasion?: string;
  gift_date?: string;
  sms_conversation_state: {
    phase: string;
    responses: Array<{
      phase: string;
      message: string;
      timestamp: string;
    }>;
  };
  preferences_collected: {
    interests?: string;
    budget_preference?: string;
    brand_preferences?: string;
  };
  is_completed: boolean;
  created_at: string;
}

interface InitiateDiscoveryParams {
  phoneNumber: string;
  recipientName: string;
  relationship: string;
  occasion: string;
  giftDate?: string;
}

export const useSMSGifteeDiscovery = () => {
  const { user } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [activeDiscoveries, setActiveDiscoveries] = useState<TemporaryGifteeProfile[]>([]);

  const fetchActiveDiscoveries = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('temporary_giftee_profiles')
        .select('*')
        .eq('giftor_user_id', user.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveDiscoveries(data || []);
    } catch (error) {
      console.error('Error fetching active discoveries:', error);
      toast.error('Failed to fetch active discoveries');
    }
  }, [user]);

  const initiateDiscovery = useCallback(async (params: InitiateDiscoveryParams) => {
    if (!user) {
      toast.error('You must be logged in to initiate discovery');
      return null;
    }

    setLoading(true);
    try {
      // Create temporary giftee profile
      const { data: gifteeProfile, error: profileError } = await supabase
        .from('temporary_giftee_profiles')
        .insert({
          phone_number: params.phoneNumber,
          giftor_user_id: user.id,
          recipient_name: params.recipientName,
          relationship: params.relationship,
          occasion: params.occasion,
          gift_date: params.giftDate,
          sms_conversation_state: {
            phase: 'greeting',
            responses: []
          }
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Send initial SMS
      const initialMessage = `Hi! ${params.recipientName} is planning a surprise gift for you for ${params.occasion} and asked me to help find something you'd love. Would you like to help by sharing a few preferences? Reply YES or NO.`;

      const { error: smsError } = await supabase.functions.invoke('sms-giftee-discovery', {
        body: {
          phone: params.phoneNumber,
          message: initialMessage,
          gifteeProfileId: gifteeProfile.id
        }
      });

      if (smsError) throw smsError;

      toast.success('Discovery SMS sent successfully!');
      await fetchActiveDiscoveries();
      
      return gifteeProfile;
    } catch (error: any) {
      console.error('Error initiating discovery:', error);
      toast.error(error.message || 'Failed to initiate discovery');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchActiveDiscoveries]);

  const getDiscoveryById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('temporary_giftee_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching discovery by ID:', error);
      return null;
    }
  }, []);

  const getDiscoveryMessages = useCallback(async (gifteeProfileId: string) => {
    try {
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('temporary_giftee_id', gifteeProfileId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching discovery messages:', error);
      return [];
    }
  }, []);

  const completeDiscovery = useCallback(async (gifteeProfileId: string) => {
    try {
      const { error } = await supabase
        .from('temporary_giftee_profiles')
        .update({ is_completed: true })
        .eq('id', gifteeProfileId);

      if (error) throw error;
      
      toast.success('Discovery completed');
      await fetchActiveDiscoveries();
    } catch (error: any) {
      console.error('Error completing discovery:', error);
      toast.error(error.message || 'Failed to complete discovery');
    }
  }, [fetchActiveDiscoveries]);

  return {
    loading,
    activeDiscoveries,
    initiateDiscovery,
    fetchActiveDiscoveries,
    getDiscoveryById,
    getDiscoveryMessages,
    completeDiscovery
  };
};