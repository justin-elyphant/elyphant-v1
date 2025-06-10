
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Gift, Users, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { RecipientAssignment } from '@/types/recipient';

interface Connection {
  id: string;
  connected_user_id: string;
  name: string;
  relationship_type: string;
  upcoming_events?: any[];
}

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

  useEffect(() => {
    if (user) {
      fetchConnections();
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

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToRecipient = (connectionId: string, connectionName: string) => {
    selectedItems.forEach(productId => {
      const recipientAssignment: RecipientAssignment = {
        connectionId,
        connectionName,
        deliveryGroupId: crypto.randomUUID(),
      };
      assignItemToRecipient(productId, recipientAssignment);
    });
    
    setSelectedItems([]);
    setShowAssignmentModal(false);
  };

  const unassignedItems = getUnassignedItems();

  if (isLoading) {
    return <div className="text-center py-4">Loading connections...</div>;
  }

  return (
    <div className="space-y-6">
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
      {deliveryGroups.map(group => (
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
                <label className="block text-sm font-medium mb-2">
                  <CalendarDays className="h-4 w-4 inline mr-1" />
                  Delivery Scheduling
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Deliver Now
                  </Button>
                  <Button variant="outline" size="sm">
                    Schedule for Event
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Assign Items to Recipient</CardTitle>
            </CardHeader>
            <CardContent>
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
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAssignmentModal(false)}
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
