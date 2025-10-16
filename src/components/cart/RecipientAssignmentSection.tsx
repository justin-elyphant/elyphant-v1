
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Gift, Users, Plus, Calendar, Clock, Search, UserPlus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { RecipientAssignment } from '@/types/recipient';
import { toast } from 'sonner';
import { useFriendSearch } from '@/hooks/useFriendSearch';
import { unifiedRecipientService } from '@/services/unifiedRecipientService';

interface Connection {
  id: string;
  connected_user_id: string;
  name: string;
  relationship_type: string;
  upcoming_events?: any[];
}

// Mock connections for testing
const mockConnections: Connection[] = [
  {
    id: 'mock-1',
    connected_user_id: 'mock-user-1',
    name: 'Sarah Johnson',
    relationship_type: 'friend'
  },
  {
    id: 'mock-2',
    connected_user_id: 'mock-user-2',
    name: 'Mike Chen',
    relationship_type: 'family'
  },
  {
    id: 'mock-3',
    connected_user_id: 'mock-user-3',
    name: 'Emily Rodriguez',
    relationship_type: 'colleague'
  },
  {
    id: 'mock-4',
    connected_user_id: 'mock-user-4',
    name: 'Alex Thompson',
    relationship_type: 'friend'
  },
  {
    id: 'mock-5',
    connected_user_id: 'mock-user-5',
    name: 'Jessica Wilson',
    relationship_type: 'family'
  }
];

const RecipientAssignmentSection: React.FC = () => {
  const { user } = useAuth();
  const { 
    cartItems, 
    deliveryGroups, 
    getUnassignedItems,
    assignItemToRecipient,
    updateRecipientAssignment 
  } = useCart();
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showFindMoreRecipients, setShowFindMoreRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryStates, setDeliveryStates] = useState<{[groupId: string]: {
    type: 'now' | 'scheduled';
    scheduledDate?: string;
    scheduledTime?: string;
  }}>({});

  // Friend search hook for finding new recipients
  const { results: searchResults, isLoading: searchLoading, searchForFriends, sendFriendRequest } = useFriendSearch();

  useEffect(() => {
    if (user) {
      fetchConnections();
    } else {
      // If no user, still show mock connections for testing
      setConnections(mockConnections);
      setIsLoading(false);
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      const { data: connectionsData, error } = await supabase
        .from('user_connections')
        .select(`
          id,
          connected_user_id,
          relationship_type,
          status,
          profiles!user_connections_connected_user_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const formattedConnections = connectionsData?.map(conn => ({
        id: conn.id,
        connected_user_id: conn.connected_user_id,
        name: (conn.profiles as any)?.name || 'Unknown',
        relationship_type: conn.relationship_type
      })) || [];

      // If no real connections, use mock data for testing
      const finalConnections = formattedConnections.length > 0 ? formattedConnections : mockConnections;
      setConnections(finalConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      // Fall back to mock connections on error
      setConnections(mockConnections);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToRecipient = async (connectionId: string, connectionName: string) => {
    try {
      // Fetch recipient details to get complete address
      const recipient = await unifiedRecipientService.getRecipientById(connectionId);
      
      if (!recipient) {
        toast.error('Recipient not found');
        return;
      }
      
      // Check if address is complete
      const addr = recipient.address;
      const isComplete = !!(
        addr?.name?.trim() &&
        (addr?.address || addr?.street)?.trim() &&
        addr?.city?.trim() &&
        addr?.state?.trim() &&
        (addr?.zipCode || addr?.zip_code || addr?.zipcode)?.trim()
      );
      
      if (!isComplete) {
        toast.error(`Complete address required for ${connectionName}. Please add their address first.`);
        return;
      }
      
      // Assign with complete address
      selectedItems.forEach(productId => {
        const recipientAssignment: RecipientAssignment = {
          connectionId,
          connectionName,
          deliveryGroupId: crypto.randomUUID(),
          shippingAddress: {
            name: addr.name || connectionName,
            address: addr.address || addr.street || '',
            addressLine2: addr.addressLine2 || addr.address_line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            zipCode: addr.zipCode || addr.zip_code || addr.zipcode || '',
            country: addr.country || 'US'
          }
        };
        assignItemToRecipient(productId, recipientAssignment);
      });
      
      toast.success(`Items assigned to ${connectionName}`);
      setSelectedItems([]);
      setShowAssignmentModal(false);
      setShowFindMoreRecipients(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error assigning recipient:', error);
      toast.error('Failed to assign recipient. Please try again.');
    }
  };

  const handleAssignToSearchResult = async (friendId: string, friendName: string, canGift: boolean) => {
    if (!canGift) {
      toast.error('Cannot send gifts to this user due to privacy settings');
      return;
    }

    try {
      // Fetch recipient details to get complete address
      const recipient = await unifiedRecipientService.getRecipientById(friendId);
      
      if (!recipient) {
        toast.error('Recipient not found');
        return;
      }
      
      // Check if address is complete
      const addr = recipient.address;
      const isComplete = !!(
        addr?.name?.trim() &&
        (addr?.address || addr?.street)?.trim() &&
        addr?.city?.trim() &&
        addr?.state?.trim() &&
        (addr?.zipCode || addr?.zip_code || addr?.zipcode)?.trim()
      );
      
      if (!isComplete) {
        toast.error(`Complete address required for ${friendName}. Please add their address first.`);
        return;
      }
      
      // Assign with complete address
      selectedItems.forEach(productId => {
        const recipientAssignment: RecipientAssignment = {
          connectionId: friendId,
          connectionName: friendName,
          deliveryGroupId: crypto.randomUUID(),
          shippingAddress: {
            name: addr.name || friendName,
            address: addr.address || addr.street || '',
            addressLine2: addr.addressLine2 || addr.address_line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            zipCode: addr.zipCode || addr.zip_code || addr.zipcode || '',
            country: addr.country || 'US'
          }
        };
        assignItemToRecipient(productId, recipientAssignment);
      });
      
      toast.success(`Items assigned to ${friendName}`);
      setSelectedItems([]);
      setShowAssignmentModal(false);
      setShowFindMoreRecipients(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error assigning search result:', error);
      toast.error('Failed to assign recipient. Please try again.');
    }
  };

  const handleSearchForRecipients = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      await searchForFriends(query);
    }
  };

  const handleDeliveryTypeChange = (groupId: string, type: 'now' | 'scheduled') => {
    setDeliveryStates(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        type,
        scheduledDate: type === 'now' ? undefined : prev[groupId]?.scheduledDate,
        scheduledTime: type === 'now' ? undefined : prev[groupId]?.scheduledTime
      }
    }));

    if (type === 'now') {
      toast.success('Gift set for immediate delivery');
    }
  };

  const handleScheduledDateChange = (groupId: string, date: string) => {
    setDeliveryStates(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        scheduledDate: date
      }
    }));
  };

  const handleScheduledTimeChange = (groupId: string, time: string) => {
    setDeliveryStates(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        scheduledTime: time
      }
    }));
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const unassignedItems = getUnassignedItems();

  if (isLoading) {
    return <div className="text-center py-4">Loading connections...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Show info banner about mock data */}
      {connections === mockConnections && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Users className="h-4 w-4" />
              <span>Using mock connections for testing. In production, these would be your actual friends and family.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unassigned Items */}
      {unassignedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Unassigned Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unassignedItems.map(item => (
                <div key={item.product.product_id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.product.image || "/placeholder.svg"} 
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedItems([item.product.product_id]);
                      setShowAssignmentModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                </div>
              ))}
              
              {unassignedItems.length > 1 && (
                <Button 
                  onClick={() => {
                    setSelectedItems(unassignedItems.map(item => item.product.product_id));
                    setShowAssignmentModal(true);
                  }}
                  className="w-full"
                >
                  Assign All Items to Recipient
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Groups */}
      {deliveryGroups.map(group => {
        const deliveryState = deliveryStates[group.id] || { type: 'now' };
        
        return (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Items for {group.connectionName}
                </div>
                <Badge variant="secondary">{group.items.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.items.map(productId => {
                  const item = cartItems.find(i => i.product.product_id === productId);
                  if (!item) return null;
                  
                  return (
                    <div key={productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <img 
                        src={item.product.image || "/placeholder.svg"} 
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} • ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Gift Message */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2">Gift Message</label>
                  <Textarea
                    placeholder={`Add a personal message for ${group.connectionName}...`}
                    value={group.giftMessage || ''}
                    onChange={(e) => {
                      group.items.forEach(productId => {
                        updateRecipientAssignment(productId, { giftMessage: e.target.value });
                      });
                    }}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Delivery Scheduling */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-3">
                    <CalendarDays className="h-4 w-4 inline mr-1" />
                    Delivery Scheduling
                  </label>
                  
                  <div className="space-y-3">
                    {/* Delivery Type Selection */}
                    <div className="flex gap-2">
                      <Button 
                        variant={deliveryState.type === 'now' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleDeliveryTypeChange(group.id, 'now')}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Deliver Now
                      </Button>
                      <Button 
                        variant={deliveryState.type === 'scheduled' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleDeliveryTypeChange(group.id, 'scheduled')}
                        className="flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule for Later
                      </Button>
                    </div>

                    {/* Scheduled Delivery Options */}
                    {deliveryState.type === 'scheduled' && (
                      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`date-${group.id}`} className="text-sm font-medium">
                              Delivery Date
                            </Label>
                            <Input
                              id={`date-${group.id}`}
                              type="date"
                              min={getMinDate()}
                              value={deliveryState.scheduledDate || ''}
                              onChange={(e) => handleScheduledDateChange(group.id, e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`time-${group.id}`} className="text-sm font-medium">
                              Preferred Time (Optional)
                            </Label>
                            <Input
                              id={`time-${group.id}`}
                              type="time"
                              value={deliveryState.scheduledTime || ''}
                              onChange={(e) => handleScheduledTimeChange(group.id, e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        {deliveryState.scheduledDate && (
                          <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            Scheduled for: {new Date(deliveryState.scheduledDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                            {deliveryState.scheduledTime && ` at ${deliveryState.scheduledTime}`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Immediate Delivery Info */}
                    {deliveryState.type === 'now' && (
                      <div className="bg-green-50 p-3 rounded text-sm text-green-700">
                        <Clock className="h-4 w-4 inline mr-1" />
                        This gift will be processed and shipped as soon as possible (typically 1-2 business days).
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Assign Items to Recipient</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {/* Existing Connections */}
              {!showFindMoreRecipients && (
                <>
                  <div className="space-y-3">
                    {connections.map(connection => (
                      <Button
                        key={connection.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleAssignToRecipient(connection.id, connection.name)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">{connection.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {connection.relationship_type}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setShowFindMoreRecipients(true)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Find More People to Gift
                    </Button>
                  </div>
                </>
              )}

              {/* Search for New Recipients */}
              {showFindMoreRecipients && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search for People</Label>
                    <Input
                      placeholder="Search by name, username, or email..."
                      value={searchQuery}
                      onChange={(e) => handleSearchForRecipients(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searchLoading && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Searching...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map(friend => (
                        <Button
                          key={friend.id}
                          variant="outline"
                          className="w-full justify-start p-3"
                          onClick={() => handleAssignToSearchResult(friend.id, friend.name, friend.canGift || false)}
                          disabled={!friend.canGift}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4" />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-medium">{friend.name}</div>
                              <div className="text-xs text-muted-foreground">
                                @{friend.username}
                                {friend.connectionStatus === 'connected' && ' • Connected'}
                                {friend.connectionStatus === 'pending' && ' • Pending Connection'}
                                {!friend.canGift && ' • Cannot send gifts'}
                              </div>
                            </div>
                            {friend.connectionStatus === 'none' && friend.canGift && (
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No users found matching "{searchQuery}"
                    </div>
                  )}

                  <Button 
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowFindMoreRecipients(false);
                      setSearchQuery('');
                    }}
                  >
                    ← Back to Connections
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setShowFindMoreRecipients(false);
                    setSearchQuery('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RecipientAssignmentSection;
