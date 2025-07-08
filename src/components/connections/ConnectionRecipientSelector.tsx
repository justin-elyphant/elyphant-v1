import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Plus, MessageSquare } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddressCollectionDialog from './AddressCollectionDialog';

interface ConnectionWithAddress {
  id: string;
  connected_user_id: string;
  name: string;
  email?: string;
  profile_image?: string;
  relationship_type: string;
  has_address: boolean;
  address?: any;
  address_name?: string;
}

interface ConnectionRecipientSelectorProps {
  onRecipientSelect: (recipient: {
    id: string;
    name: string;
    address: any;
    email?: string;
  }) => void;
  selectedRecipientId?: string;
  title?: string;
  showAddressRequest?: boolean;
}

const ConnectionRecipientSelector: React.FC<ConnectionRecipientSelectorProps> = ({
  onRecipientSelect,
  selectedRecipientId,
  title = "Choose Recipient",
  showAddressRequest = true
}) => {
  const { profile } = useProfile();
  const [connections, setConnections] = useState<ConnectionWithAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionWithAddress | null>(null);

  useEffect(() => {
    fetchConnectionsWithAddresses();
  }, [profile]);

  const fetchConnectionsWithAddresses = async () => {
    if (!profile) return;
    
    try {
      // Fetch accepted connections with profile and address data
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          profiles!user_connections_connected_user_id_fkey(
            name,
            email,
            profile_image
          ),
          user_addresses!user_addresses_user_id_fkey(
            id,
            name,
            address,
            is_default
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedConnections: ConnectionWithAddress[] = (data || []).map(conn => {
        const connProfile = conn.profiles as any;
        const addresses = conn.user_addresses as any[];
        const primaryAddress = addresses?.find(addr => addr.is_default) || addresses?.[0];

        return {
          id: conn.id,
          connected_user_id: conn.connected_user_id,
          name: connProfile?.name || 'Unknown User',
          email: connProfile?.email,
          profile_image: connProfile?.profile_image,
          relationship_type: conn.relationship_type,
          has_address: Boolean(primaryAddress),
          address: primaryAddress?.address,
          address_name: primaryAddress?.name
        };
      });

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections with addresses:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipient = (connection: ConnectionWithAddress) => {
    if (!connection.has_address) {
      setSelectedConnection(connection);
      setAddressDialogOpen(true);
      return;
    }

    onRecipientSelect({
      id: connection.connected_user_id,
      name: connection.name,
      address: connection.address,
      email: connection.email
    });
  };

  const handleAddressCollected = (address: any) => {
    if (selectedConnection) {
      onRecipientSelect({
        id: selectedConnection.connected_user_id,
        name: selectedConnection.name,
        address: address,
        email: selectedConnection.email
      });
    }
    setSelectedConnection(null);
    fetchConnectionsWithAddresses(); // Refresh to show updated address status
  };

  const requestAddress = async (connection: ConnectionWithAddress) => {
    // TODO: Implement address request via messaging system
    toast.info(`Address request feature coming soon! For now, you can manually collect ${connection.name}'s address.`);
    setSelectedConnection(connection);
    setAddressDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading your connections...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No connections yet</p>
              <p className="text-sm">Connect with friends and family to send gifts easily</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    selectedRecipientId === connection.connected_user_id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectRecipient(connection)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={connection.profile_image} />
                        <AvatarFallback>
                          {connection.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{connection.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {connection.relationship_type}
                          </Badge>
                        </div>
                        {connection.has_address ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{connection.address_name || 'Address saved'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-amber-600">No address saved</span>
                            {showAddressRequest && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestAddress(connection);
                                }}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Request
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedRecipientId === connection.connected_user_id && (
                      <div className="text-primary">
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Collection Dialog */}
      {selectedConnection && (
        <AddressCollectionDialog
          open={addressDialogOpen}
          onOpenChange={setAddressDialogOpen}
          connectionName={selectedConnection.name}
          connectionId={selectedConnection.id}
          onAddressCollected={handleAddressCollected}
          title="Add Shipping Address"
          description="Save their address for easy gifting"
        />
      )}
    </>
  );
};

export default ConnectionRecipientSelector;