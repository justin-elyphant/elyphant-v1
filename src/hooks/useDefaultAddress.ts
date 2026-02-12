import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

export interface DefaultAddress {
  id: string;
  name: string;
  address: {
    street: string;
    address_line2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export const useDefaultAddress = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState<DefaultAddress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDefaultAddress = async () => {
    if (!user) {
      setDefaultAddress(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const parseAddress = (addr: any, id: string, name: string) => ({
        id,
        name,
        address: {
          street: addr?.street || addr?.address_line1 || addr?.address || '',
          address_line2: addr?.address_line2 || addr?.line2 || '',
          city: addr?.city || '',
          state: addr?.state || '',
          zipCode: addr?.zipCode || addr?.zip_code || '',
          country: addr?.country || 'US'
        }
      });

      // 1. Try user_addresses table (default first, then any)
      const { data: defaultData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (defaultData) {
        setDefaultAddress(parseAddress(defaultData.address, defaultData.id, defaultData.name));
        return;
      }

      // 2. Fallback to profiles.shipping_address
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, shipping_address')
        .eq('id', user.id)
        .single();

      if (profileData?.shipping_address) {
        const name = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ') || 'Home';
        setDefaultAddress(parseAddress(profileData.shipping_address, profileData.id, name));
        return;
      }

      setError('No addresses found');
      setDefaultAddress(null);
    } catch (err) {
      console.error('Error fetching default address:', err);
      setError(err instanceof Error ? err.message : 'Failed to load default address');
      toast.error('Failed to load your saved addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaultAddress();
  }, [user]);

  return {
    defaultAddress,
    loading,
    error,
    refresh: fetchDefaultAddress
  };
};