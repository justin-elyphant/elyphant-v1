import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, AlertTriangle, User } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import CartItemImage from '@/components/cart/CartItemImage';

interface UnassignedItemsSectionProps {
  unassignedItems: CartItem[];
  onAssignAll: () => void;
  onAssignToMe: () => void;
}

const UnassignedItemsSection: React.FC<UnassignedItemsSectionProps> = ({
  unassignedItems,
  onAssignAll,
  onAssignToMe
}) => {
  const { profile } = useProfile();

  if (unassignedItems.length === 0) {
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
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-orange-600" />
          Unassigned Items
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
            {unassignedItems.length} item{unassignedItems.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-orange-800 font-medium">
                These items need recipient assignment
              </p>
              <p className="text-orange-700 text-sm">
                {hasCompleteAddress 
                  ? "Items without recipients will be shipped to your address by default"
                  : "Please add your shipping address or assign recipients to continue"
                }
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          {unassignedItems.map((item) => (
            <div key={item.product.product_id} className="flex items-center gap-3 p-3 bg-white rounded border">
              <CartItemImage item={item} size="md" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.product.name || item.product.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} • ${item.product.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAssignAll}
            className="flex-1 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Assign All to a Recipient
          </Button>
          {hasCompleteAddress && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAssignToMe}
              className="flex-1 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Ship All to Me
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnassignedItemsSection;