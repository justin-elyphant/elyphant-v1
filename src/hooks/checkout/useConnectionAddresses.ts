import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

interface ConnectionWithAddress {
  id: string;
  connected_user_id: string | null;
  name: string;
  relationship_type: string;
  status: string;
  email?: string;
  shipping_address?: {
    name: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    // Allow additional fields for flexible address handling
    [key: string]: any;
  };
  has_address: boolean;
}

export const useConnectionAddresses = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectionAddresses = useCallback(async () => {
    if (!user) {
      setConnections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch both accepted and pending connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          status,
          pending_recipient_name,
          pending_recipient_email,
          pending_shipping_address,
          profiles!user_connections_connected_user_id_fkey(
            id,
            name,
            email
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['accepted', 'pending_invitation']);

      if (connectionsError) throw connectionsError;

      if (!connectionsData || connectionsData.length === 0) {
        setConnections([]);
        return;
      }

      // Fetch addresses for accepted connections only
      const acceptedConnections = connectionsData.filter(conn => 
        conn.status === 'accepted' && conn.connected_user_id
      );
      const connectedUserIds = acceptedConnections.map(conn => conn.connected_user_id);
      
      let addressesData: any[] = [];
      if (connectedUserIds.length > 0) {
        const { data, error: addressesError } = await supabase
          .from('user_addresses')
          .select('user_id, name, address, is_default')
          .in('user_id', connectedUserIds);

        if (addressesError) {
          console.error('Error fetching addresses:', addressesError);
        } else {
          addressesData = data || [];
        }
      }

      // Process all connections (both accepted and pending)
      const formattedConnections: ConnectionWithAddress[] = connectionsData.map(conn => {
        if (conn.status === 'pending_invitation') {
          // Handle pending connections using pending_* fields
          let formattedAddress = null;
          if (conn.pending_shipping_address) {
            const addressData = conn.pending_shipping_address as any;
            formattedAddress = {
            name: conn.pending_recipient_name || 'Unknown User',
            email: conn.pending_recipient_email, // Explicitly set email for pending connections
              address: addressData.address || addressData.street || addressData.address_line1 || '',
              address2: addressData.address2 || addressData.address_line2 || '',
              city: addressData.city || '',
              state: addressData.state || '',
              zipCode: addressData.zipCode || addressData.zip_code || '',
              country: addressData.country || 'United States',
              ...addressData
            };
          }

          return {
            id: conn.id,
            connected_user_id: null, // No connected user for pending
            name: conn.pending_recipient_name || 'Unknown User',
            email: conn.pending_recipient_email,
            relationship_type: conn.relationship_type,
            status: conn.status,
            shipping_address: formattedAddress,
            has_address: Boolean(conn.pending_shipping_address)
          };
        } else {
          // Handle accepted connections using profiles and user_addresses
          const profile = conn.profiles as any;
          const userAddress = addressesData?.find(addr => 
            addr.user_id === conn.connected_user_id && addr.is_default
          ) || addressesData?.find(addr => addr.user_id === conn.connected_user_id);

          let formattedAddress = null;
          if (userAddress?.address) {
            const addressData = userAddress.address as any;
            formattedAddress = {
              name: userAddress.name || profile?.name || 'Unknown User',
              address: addressData.street || addressData.address_line1 || addressData.address || '',
              address2: addressData.address2 || addressData.address_line2 || '',
              city: addressData.city || '',
              state: addressData.state || '',
              zipCode: addressData.zipCode || addressData.zip_code || '',
              country: addressData.country || 'United States',
              ...addressData
            };
          }

          return {
            id: conn.id,
            connected_user_id: conn.connected_user_id,
            name: profile?.name || 'Unknown User',
            email: profile?.email,
            relationship_type: conn.relationship_type,
            status: conn.status,
            shipping_address: formattedAddress,
            has_address: Boolean(userAddress)
          };
        }
      });

      console.log('Fetched connections:', formattedConnections);
      setConnections(formattedConnections);
    } catch (err) {
      console.error('Error fetching connection addresses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load connections');
      toast.error('Failed to load connection addresses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnectionAddresses();
  }, [fetchConnectionAddresses]);

  const getConnectionAddress = useCallback((connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    return connection?.shipping_address || null;
  }, [connections]);

  const getConnectionByUserId = useCallback((userId: string) => {
    return connections.find(conn => conn.connected_user_id === userId) || null;
  }, [connections]);

  const hasValidAddress = useCallback((connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (!connection?.shipping_address) return false;

    const address = connection.shipping_address;
    return Boolean(
      address.name &&
      address.address &&
      address.city &&
      address.state &&
      address.zipCode &&
      address.country
    );
  }, [connections]);

  const refreshConnection = useCallback(async (connectionId: string) => {
    try {
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) return;

      // Re-fetch the specific connection's address
      const { data: addressData, error } = await supabase
        .from('user_addresses')
        .select('name, address, is_default')
        .eq('user_id', connection.connected_user_id)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing connection address:', error);
        return;
      }

      // Format the address properly
      let formattedAddress = null;
      if (addressData?.address) {
        const addressInfo = addressData.address as any;
        formattedAddress = {
          name: addressData.name || connection.name,
          address: addressInfo.street || addressInfo.address_line1 || addressInfo.address || '',
          city: addressInfo.city || '',
          state: addressInfo.state || '',
          zipCode: addressInfo.zipCode || addressInfo.zip_code || '',
          country: addressInfo.country || 'United States',
          // Include additional fields for flexible access
          ...addressInfo
        };
      }

      // Update the connection in state
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId
          ? { 
              ...conn, 
              shipping_address: formattedAddress,
              has_address: Boolean(addressData)
            }
          : conn
      ));

      toast.success('Connection address updated');
    } catch (err) {
      console.error('Error refreshing connection:', err);
      toast.error('Failed to refresh connection address');
    }
  }, [connections]);

  return {
    connections,
    loading,
    error,
    fetchConnectionAddresses,
    getConnectionAddress,
    getConnectionByUserId,
    hasValidAddress,
    refreshConnection
  };
};