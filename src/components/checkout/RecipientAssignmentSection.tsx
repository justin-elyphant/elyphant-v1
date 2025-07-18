
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckoutItem } from "@/types/checkout";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { User, Plus, Search } from "lucide-react";

interface RecipientAssignmentSectionProps {
  items: CheckoutItem[];
  deliveryGroups: Array<{
    id: string;
    connectionId: string;
    connectionName: string;
    items: CheckoutItem[];
    shippingAddress?: any;
  }>;
  onAssignItem: (itemId: string, connectionId: string) => void;
  onCreateDeliveryGroup: (connectionId: string) => void;
  onProceedToAddress: () => void;
}

const RecipientAssignmentSection: React.FC<RecipientAssignmentSectionProps> = ({
  items,
  deliveryGroups,
  onAssignItem,
  onCreateDeliveryGroup,
  onProceedToAddress
}) => {
  const { connections } = useConnectionsAdapter();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter for accepted connections only
  const availableConnections = connections.filter(conn => 
    conn.type === 'friend' && !conn.isPending
  );

  const filteredConnections = availableConnections.filter(conn =>
    conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnassignedItems = () => {
    const assignedItemIds = new Set();
    deliveryGroups.forEach(group => {
      group.items.forEach(item => assignedItemIds.add(item.id));
    });
    return items.filter(item => !assignedItemIds.has(item.id));
  };

  const unassignedItems = getUnassignedItems();

  const handleAssignToConnection = (itemId: string, connectionId: string) => {
    onAssignItem(itemId, connectionId);
    
    // Create delivery group if it doesn't exist
    if (!deliveryGroups.find(group => group.connectionId === connectionId)) {
      onCreateDeliveryGroup(connectionId);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Recipients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search for connections */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search your connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Available Connections */}
          {availableConnections.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No connections found</h3>
              <p className="text-gray-500 mb-4">
                Connect with friends to send them gifts
              </p>
              <Button variant="outline" asChild>
                <a href="/connections">Find Friends</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredConnections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={connection.imageUrl} />
                        <AvatarFallback>
                          {connection.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{connection.name}</p>
                        <p className="text-xs text-gray-500">{connection.username}</p>
                      </div>
                    </div>
                    
                    {/* Items assigned to this connection */}
                    {deliveryGroups.find(group => group.connectionId === connection.id) && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Items:</p>
                        <div className="space-y-1">
                          {deliveryGroups
                            .find(group => group.connectionId === connection.id)
                            ?.items.map(item => (
                              <div key={item.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                                {item.name}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Quick assign buttons for unassigned items */}
                    {unassignedItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">Quick assign:</p>
                        <div className="flex flex-wrap gap-1">
                          {unassignedItems.slice(0, 3).map(item => (
                            <Button
                              key={item.id}
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1 h-6"
                              onClick={() => handleAssignToConnection(item.id, connection.id)}
                            >
                              {item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}
                            </Button>
                          ))}
                          {unassignedItems.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{unassignedItems.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Unassigned Items */}
          {unassignedItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-3">Unassigned Items ({unassignedItems.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unassignedItems.map((item) => (
                    <Card key={item.id} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-sm text-gray-500">${item.price}</p>
                          </div>
                        </div>
                        <Select onValueChange={(connectionId) => handleAssignToConnection(item.id, connectionId)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableConnections.map((connection) => (
                              <SelectItem key={connection.id} value={connection.id}>
                                {connection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Delivery Groups Summary */}
          {deliveryGroups.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-3">Delivery Groups ({deliveryGroups.length})</h3>
                <div className="space-y-3">
                  {deliveryGroups.map((group) => (
                    <Card key={group.id} className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{group.connectionName}</p>
                            <p className="text-sm text-gray-600">
                              {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            ${group.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Proceed Button */}
          <Button 
            onClick={onProceedToAddress}
            className="w-full"
            disabled={unassignedItems.length > 0}
          >
            {unassignedItems.length > 0 
              ? `Assign ${unassignedItems.length} remaining item${unassignedItems.length !== 1 ? 's' : ''}`
              : 'Proceed to Addresses'
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipientAssignmentSection;
