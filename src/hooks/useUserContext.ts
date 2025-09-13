import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';

interface UserContext {
  user_type: 'shopper' | 'vendor' | 'employee';
  signup_source: 'header_cta' | 'vendor_portal' | 'trunkline' | 'social_auth' | 'direct' | 'invite';
  is_employee: boolean;
  is_vendor: boolean;
  is_shopper: boolean;
  signup_metadata: Record<string, any>;
  source_attribution: Record<string, any>;
}

export const useUserContext = () => {
  const { user } = useAuth();
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserContext = async () => {
      if (!user) {
        setUserContext(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_user_context', { check_user_id: user.id });

        if (error) {
          console.error('Error fetching user context:', error);
          // Return default context for shoppers
          setUserContext({
            user_type: 'shopper',
            signup_source: 'direct',
            is_employee: false,
            is_vendor: false,
            is_shopper: true,
            signup_metadata: {},
            source_attribution: {}
          });
        } else {
          setUserContext(data as unknown as UserContext);
        }
      } catch (error) {
        console.error('Error in useUserContext:', error);
        setUserContext(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserContext();
  }, [user]);

  return {
    userContext,
    isLoading,
    isEmployee: userContext?.is_employee || false,
    isVendor: userContext?.is_vendor || false,
    isShopper: userContext?.is_shopper || true,
    userType: userContext?.user_type || 'shopper',
    signupSource: userContext?.signup_source || 'direct'
  };
};