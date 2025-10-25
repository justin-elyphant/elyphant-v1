import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Package, Truck, User, Mail, Clock, AlertCircle } from 'lucide-react';
import { DeliveryGroup } from '@/types/recipient';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { CartItem } from '@/contexts/CartContext';
import { formatDistanceToNow } from 'date-fns';

interface MultiDestinationSummaryProps {
  deliveryGroups: DeliveryGroup[];
  unassignedItems: CartItem[];
}

const MultiDestinationSummary: React.FC<MultiDestinationSummaryProps> = ({
  deliveryGroups,
  unassignedItems
}) => {
  const { profile } = useProfile();

  // Don't show if no delivery groups and no unassigned items
  if (deliveryGroups.length === 0 && unassignedItems.length === 0) {
    return null;
  }

  const shippingAddress = profile?.shipping_address;
  const hasCompleteAddress = shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          Delivery Destinations
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {deliveryGroups.length + (unassignedItems.length > 0 ? 1 : 0)} destination{deliveryGroups.length + (unassignedItems.length > 0 ? 1 : 0) > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Groups */}
        {deliveryGroups.map((group) => {
          const isPending = group.connectionStatus === 'pending_invitation';
          const bgColor = isPending ? 'bg-amber-50' : 'bg-green-50';
          const borderColor = isPending ? 'border-amber-200' : 'border-green-200';
          const textColor = isPending ? 'text-amber-800' : 'text-green-800';
          const badgeBg = isPending ? 'bg-amber-100' : 'bg-green-100';
          const badgeText = isPending ? 'text-amber-700' : 'text-green-700';
          const badgeBorder = isPending ? 'border-amber-300' : 'border-green-300';
          
          return (
            <div key={group.id} className={`p-3 ${bgColor} rounded-lg border ${borderColor}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 ${isPending ? 'bg-amber-100' : 'bg-green-100'} rounded-full`}>
                  {isPending ? (
                    <Mail className={`h-4 w-4 ${isPending ? 'text-amber-600' : 'text-green-600'}`} />
                  ) : (
                    <Users className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium ${textColor}`}>{group.connectionName}</p>
                    <Badge variant="outline" className={`${badgeBg} ${badgeText} ${badgeBorder}`}>
                      <Package className="h-3 w-3 mr-1" />
                      {group.items.length} item{group.items.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {/* Pending Invitation Status */}
                  {isPending && (
                    <div className="mb-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700">
                        <AlertCircle className="h-3 w-3" />
                        <span className="font-medium">Invitation pending - awaiting signup</span>
                      </div>
                      {group.address_last_updated && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                          <Clock className="h-3 w-3" />
                          <span>
                            Invited {formatDistanceToNow(new Date(group.address_last_updated), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-amber-700">
                        📦 Gift will be held until recipient provides their shipping address
                      </p>
                    </div>
                  )}
                  
                  {group.shippingAddress && !isPending && (
                    <div className="text-sm text-green-700">
                      <p>{group.shippingAddress.address}</p>
                      <p>{group.shippingAddress.city}, {group.shippingAddress.state} {group.shippingAddress.zipCode}</p>
                    </div>
                  )}
                  
                  {group.giftMessage && (
                    <div className={`mt-2 p-2 bg-white rounded border ${borderColor}`}>
                      <p className={`text-xs ${isPending ? 'text-amber-600' : 'text-green-600'} font-medium mb-1`}>Gift Message:</p>
                      <p className={`text-sm ${textColor}`}>{group.giftMessage}</p>
                    </div>
                  )}
                  
                  {group.scheduledDeliveryDate && (
                    <div className={`mt-2 flex items-center gap-1 text-xs ${isPending ? 'text-amber-600' : 'text-green-600'}`}>
                      <Truck className="h-3 w-3" />
                      Scheduled for: {new Date(group.scheduledDeliveryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Unassigned Items (Your Address) */}
        {unassignedItems.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-blue-800">Your Address (Default)</p>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    <Package className="h-3 w-3 mr-1" />
                    {unassignedItems.length} item{unassignedItems.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {hasCompleteAddress && shippingAddress ? (
                  <div className="text-sm text-blue-700">
                    <p>{profile?.name}</p>
                    <p>{shippingAddress.address_line1 || shippingAddress.street}</p>
                    {shippingAddress.address_line2 && (
                      <p>{shippingAddress.address_line2}</p>
                    )}
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code || shippingAddress.zipCode}</p>
                  </div>
                ) : (
                  <div className="text-sm text-orange-600">
                    <p>⚠️ No shipping address on file</p>
                    <p>Add your address to proceed with checkout</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiDestinationSummary;