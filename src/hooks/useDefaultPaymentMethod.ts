import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface DefaultPaymentMethod {
  id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  stripe_payment_method_id: string;
  stripe_customer_id: string | null;
  is_default: boolean;
}

export const useDefaultPaymentMethod = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<DefaultPaymentMethod | null>(null);

  useEffect(() => {
    if (!user) {
      setDefaultPaymentMethod(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        // Try default first
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();

        if (!error && data) {
          setDefaultPaymentMethod(data as DefaultPaymentMethod);
        } else {
          // Fallback to any card
          const { data: any_card } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          setDefaultPaymentMethod(any_card ? (any_card as DefaultPaymentMethod) : null);
        }
      } catch {
        setDefaultPaymentMethod(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return { defaultPaymentMethod, loading };
};
