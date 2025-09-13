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

      const { data: defaultData, error: fetchError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (fetchError) {
        // If no default found, try to get any address
        const { data: anyAddress, error: anyAddressError } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (anyAddressError) {
          setError('No addresses found');
          setDefaultAddress(null);
          return;
        }

        // Use the first available address
        if (anyAddress) {
          setDefaultAddress({
            id: anyAddress.id,
            name: anyAddress.name,
            address: {
              street: (anyAddress.address as any)?.street || (anyAddress.address as any)?.address_line1 || (anyAddress.address as any)?.address || '',
              address_line2: (anyAddress.address as any)?.address_line2 || '',
              city: (anyAddress.address as any)?.city || '',
              state: (anyAddress.address as any)?.state === 'CA' ? 'California' : ((anyAddress.address as any)?.state || ''),
              zipCode: (anyAddress.address as any)?.zipCode || (anyAddress.address as any)?.zip_code || '',
              country: (anyAddress.address as any)?.country || 'United States'
            }
          });
        } else {
          setDefaultAddress(null);
        }
        return;
      }

      if (defaultData) {
          setDefaultAddress({
            id: defaultData.id,
            name: defaultData.name,
            address: {
              street: (defaultData.address as any)?.street || (defaultData.address as any)?.address_line1 || (defaultData.address as any)?.address || '',
              address_line2: (defaultData.address as any)?.address_line2 || '',
              city: (defaultData.address as any)?.city || '',
              state: (defaultData.address as any)?.state === 'CA' ? 'California' : ((defaultData.address as any)?.state || ''),
              zipCode: (defaultData.address as any)?.zipCode || (defaultData.address as any)?.zip_code || '',
              country: (defaultData.address as any)?.country || 'United States'
            }
          });
      } else {
        setDefaultAddress(null);
      }
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