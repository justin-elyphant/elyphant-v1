import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

interface ConnectionWithAddress {
  id: string;
  connected_user_id: string;
  name: string;
  relationship_type: string;
  email?: string;
  shipping_address?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
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

      // Fetch connections with their profile data and addresses
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          status,
          profiles!user_connections_connected_user_id_fkey(
            id,
            name,
            email
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (connectionsError) throw connectionsError;

      if (!connectionsData || connectionsData.length === 0) {
        setConnections([]);
        return;
      }

      // Fetch addresses for all connected users
      const connectedUserIds = connectionsData.map(conn => conn.connected_user_id);
      const { data: addressesData, error: addressesError } = await supabase
        .from('user_addresses')
        .select('user_id, name, address, is_default')
        .in('user_id', connectedUserIds);

      if (addressesError) {
        console.error('Error fetching addresses:', addressesError);
        // Continue without addresses instead of failing completely
      }

      // Combine connection data with address data
      const formattedConnections: ConnectionWithAddress[] = connectionsData.map(conn => {
        const profile = conn.profiles as any;
        const userAddress = addressesData?.find(addr => 
          addr.user_id === conn.connected_user_id && addr.is_default
        ) || addressesData?.find(addr => addr.user_id === conn.connected_user_id);

        return {
          id: conn.id,
          connected_user_id: conn.connected_user_id,
          name: profile?.name || 'Unknown User',
          email: profile?.email,
          relationship_type: conn.relationship_type,
          shipping_address: userAddress?.address || null,
          has_address: Boolean(userAddress)
        };
      });

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
        .select('address, is_default')
        .eq('user_id', connection.connected_user_id)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing connection address:', error);
        return;
      }

      // Update the connection in state
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId
          ? { 
              ...conn, 
              shipping_address: addressData?.address || null,
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