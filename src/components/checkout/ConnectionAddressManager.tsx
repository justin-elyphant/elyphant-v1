import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, User, Mail, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddressBookSelector from './AddressBookSelector';
import AddressVerificationBadge from '@/components/ui/AddressVerificationBadge';

interface Connection {
  id: string;
  connected_user_id: string;
  name: string;
  relationship_type: string;
  email?: string;
  shipping_address?: any;
  has_address: boolean;
  address_verified?: boolean;
  address_verification_method?: string;
  address_verified_at?: string;
  address_last_updated?: string;
}

interface ConnectionAddressManagerProps {
  onConnectionSelect: (connection: Connection) => void;
  selectedConnectionId?: string;
  title?: string;
}

const ConnectionAddressManager: React.FC<ConnectionAddressManagerProps> = ({
  onConnectionSelect,
  selectedConnectionId,
  title = "Choose Recipient"
}) => {
  const { profile } = useProfile();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAddressDialog, setShowAddAddressDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [addressRequest, setAddressRequest] = useState({
    email: '',
    message: '',
    sending: false
  });

  useEffect(() => {
    fetchConnections();
  }, [profile]);

  const fetchConnections = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          status,
          profiles!user_connections_connected_user_id_fkey(
            name, 
            email, 
            address_verified,
            address_verification_method,
            address_verified_at,
            address_last_updated
          ),
          user_addresses!user_addresses_user_id_fkey(*)
        `)
        .eq('user_id', profile.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const formattedConnections = data?.map(conn => ({
        id: conn.id,
        connected_user_id: conn.connected_user_id,
        name: (conn.profiles as any)?.name || 'Unknown',
        email: (conn.profiles as any)?.email,
        relationship_type: conn.relationship_type,
        shipping_address: (conn.user_addresses as any)?.[0]?.address,
        has_address: Boolean((conn.user_addresses as any)?.length),
        address_verified: (conn.profiles as any)?.address_verified,
        address_verification_method: (conn.profiles as any)?.address_verification_method,
        address_verified_at: (conn.profiles as any)?.address_verified_at,
        address_last_updated: (conn.profiles as any)?.address_last_updated
      })) || [];

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAddress = async () => {
    if (!selectedConnection || !addressRequest.email) return;
    
    setAddressRequest(prev => ({ ...prev, sending: true }));
    
    try {
      // Call the orchestrator for address request
      const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'address_request',
          recipientEmail: addressRequest.email,
          data: {
            recipientId: selectedConnection.connected_user_id,
            recipientEmail: addressRequest.email,
            recipientName: selectedConnection.name,
            requesterName: 'You',
            message: addressRequest.message || 'Could you please share your address for gift delivery?',
            requestUrl: window.location.origin + '/address-request'
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send address request');
      }
      
      toast.success(`Address request sent to ${selectedConnection.name}`);
      setShowAddAddressDialog(false);
      setSelectedConnection(null);
      setAddressRequest({ email: '', message: '', sending: false });
    } catch (error) {
      console.error('Error sending address request:', error);
      toast.error('Failed to send address request');
    } finally {
      setAddressRequest(prev => ({ ...prev, sending: false }));
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return '';
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading connections...</div>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <p>No connections found</p>
            <p className="text-sm">Add friends and family to enable gifting</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                  selectedConnectionId === connection.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => connection.has_address && onConnectionSelect(connection)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{connection.name}</span>
                        <Badge 
                          variant="outline" 
                          className="text-xs capitalize"
                        >
                          {connection.relationship_type}
                        </Badge>
                        {connection.has_address ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="default" className="text-xs">
                              Address Saved
                            </Badge>
                            <AddressVerificationBadge
                              verified={connection.address_verified}
                              verificationMethod={connection.address_verification_method}
                              verifiedAt={connection.address_verified_at}
                              lastUpdated={connection.address_last_updated}
                              size="sm"
                              showText={false}
                            />
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No Address
                          </Badge>
                        )}
                      </div>
                      
                      {connection.has_address ? (
                        <p className="text-sm text-muted-foreground">
                          {formatAddress(connection.shipping_address)}
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-amber-600">
                            Address needed for delivery
                          </span>
                          <Dialog 
                            open={showAddAddressDialog && selectedConnection?.id === connection.id} 
                            onOpenChange={(open) => {
                              setShowAddAddressDialog(open);
                              if (open) setSelectedConnection(connection);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedConnection(connection);
                                  setAddressRequest(prev => ({ 
                                    ...prev, 
                                    email: connection.email || '' 
                                  }));
                                }}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Request Address
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Request Address</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  Send a private request to {connection.name} for their shipping address.
                                </p>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={addressRequest.email}
                                    onChange={(e) => setAddressRequest(prev => ({ 
                                      ...prev, 
                                      email: e.target.value 
                                    }))}
                                    placeholder="Enter email address"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="message">Message (Optional)</Label>
                                  <Input
                                    id="message"
                                    value={addressRequest.message}
                                    onChange={(e) => setAddressRequest(prev => ({ 
                                      ...prev, 
                                      message: e.target.value 
                                    }))}
                                    placeholder="Hi! I'd like to send you a gift..."
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleRequestAddress}
                                    disabled={!addressRequest.email || addressRequest.sending}
                                    className="flex-1"
                                  >
                                    {addressRequest.sending ? 'Sending...' : 'Send Request'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowAddAddressDialog(false)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedConnectionId === connection.id && connection.has_address && (
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
  );
};

export default ConnectionAddressManager;