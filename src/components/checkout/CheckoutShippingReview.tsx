import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MapPin, Users, Package, User, AlertCircle, Edit, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import QuickEditModal from './QuickEditModal';

interface CheckoutShippingReviewProps {
  shippingCost: number;
}

const CheckoutShippingReview: React.FC<CheckoutShippingReviewProps> = ({
  shippingCost
}) => {
  const navigate = useNavigate();
  const { deliveryGroups, getUnassignedItems, updateRecipientAssignment } = useCart();
  const { profile } = useProfile();
  const unassignedItems = getUnassignedItems();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check if user has a complete address
  const shippingAddress = profile?.shipping_address;
  const hasCompleteAddress = shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode);

  // Check if shipping setup is incomplete
  const hasIncompleteShipping = !hasCompleteAddress && unassignedItems.length > 0;

  const totalDestinations = deliveryGroups.length + (unassignedItems.length > 0 ? 1 : 0);

  // Quick edit handlers
  const handleAddressEdit = async (groupId: string, newAddress: any) => {
    // Update the delivery group's shipping address
    const group = deliveryGroups.find(g => g.id === groupId);
    if (group) {
      // Update each item in the group with the new address
      group.items.forEach(productId => {
        updateRecipientAssignment(productId, {
          shippingAddress: newAddress
        });
      });
    }
  };

  const handleMessageEdit = async (groupId: string, newMessage: string) => {
    // Update the delivery group's gift message
    const group = deliveryGroups.find(g => g.id === groupId);
    if (group) {
      // Update each item in the group with the new message
      group.items.forEach(productId => {
        updateRecipientAssignment(productId, {
          giftMessage: newMessage
        });
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Information
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {totalDestinations} destination{totalDestinations > 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: Collapsible toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="sm:hidden"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit in Cart</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {/* Mobile: Collapsible content */}
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        {hasIncompleteShipping && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Shipping setup is incomplete. Please{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-destructive underline"
                onClick={() => navigate('/cart')}
              >
                return to cart
              </Button>
              {' '}to configure your shipping address.
            </AlertDescription>
          </Alert>
        )}

        {/* Gift Recipients (Delivery Groups) */}
        {deliveryGroups.map((group) => (
          <div key={group.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-green-800">{group.connectionName}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      <Package className="h-3 w-3 mr-1" />
                      {group.items.length} item{group.items.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                
                {group.shippingAddress && (
                  <div className="text-sm text-green-700 mb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{group.shippingAddress.name}</p>
                        <p>{group.shippingAddress.address}</p>
                        <p>{group.shippingAddress.city}, {group.shippingAddress.state} {group.shippingAddress.zipCode}</p>
                      </div>
                      <QuickEditModal
                        type="address"
                        deliveryGroupId={group.id}
                        currentData={group.shippingAddress}
                        onSave={(newAddress) => handleAddressEdit(group.id, newAddress)}
                      >
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </QuickEditModal>
                    </div>
                  </div>
                )}
                
                {group.giftMessage && (
                  <div className="mt-2 p-2 bg-white rounded border border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-green-600 font-medium mb-1">Gift Message:</p>
                        <p className="text-sm text-green-800 italic">"{group.giftMessage}"</p>
                      </div>
                      <QuickEditModal
                        type="message"
                        deliveryGroupId={group.id}
                        currentData={{ message: group.giftMessage }}
                        onSave={(data) => handleMessageEdit(group.id, data.message)}
                      >
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </QuickEditModal>
                    </div>
                  </div>
                )}

                {!group.giftMessage && (
                  <QuickEditModal
                    type="message"
                    deliveryGroupId={group.id}
                    currentData={{ message: '' }}
                    onSave={(data) => handleMessageEdit(group.id, data.message)}
                  >
                    <Button variant="ghost" size="sm" className="text-xs text-green-600 mt-1 h-auto p-1">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Add gift message
                    </Button>
                  </QuickEditModal>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Your Address (Unassigned Items) */}
        {unassignedItems.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-blue-800">Your Address</p>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    <Package className="h-3 w-3 mr-1" />
                    {unassignedItems.length} item{unassignedItems.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {hasCompleteAddress && shippingAddress ? (
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">{profile?.name}</p>
                    <p>{shippingAddress.address_line1 || shippingAddress.street}</p>
                    {shippingAddress.address_line2 && (
                      <p>{shippingAddress.address_line2}</p>
                    )}
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code || shippingAddress.zipCode}</p>
                  </div>
                ) : (
                  <div className="text-sm text-orange-600">
                    <p className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      No shipping address configured
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Shipping Cost Summary */}
        {totalDestinations > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Shipping ({totalDestinations} destination{totalDestinations > 1 ? 's' : ''})
              </span>
              <span className="font-medium">${shippingCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* No shipping needed */}
        {totalDestinations === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items to ship</p>
          </div>
          )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CheckoutShippingReview;