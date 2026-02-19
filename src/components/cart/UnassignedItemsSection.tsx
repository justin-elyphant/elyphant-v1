import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Gift, Pencil, User } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';

interface UnassignedItemsSectionProps {
  unassignedItems: CartItem[];
  onSendAsGift: () => void;
  userName?: string;
  userAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  isGuest: boolean;
}

const UnassignedItemsSection: React.FC<UnassignedItemsSectionProps> = ({
  unassignedItems,
  onSendAsGift,
  userName,
  userAddress,
  isGuest
}) => {
  const navigate = useNavigate();

  if (unassignedItems.length === 0 || isGuest) {
    return null;
  }

  const hasAddress = userAddress && userAddress.street && userAddress.city && userAddress.state && userAddress.zipCode;

  const formatAddress = () => {
    if (!userAddress) return '';
    const parts = [userAddress.street, userAddress.city, `${userAddress.state} ${userAddress.zipCode}`];
    return parts.filter(Boolean).join(', ');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          <MapPin className="h-4 w-4" />
          Delivering to
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasAddress ? (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-muted">
              <User className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{userName || 'My Address'}</p>
              <p className="text-sm text-muted-foreground">{formatAddress()}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Shipping address will be collected at checkout
          </p>
        )}

        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSendAsGift}
            className="text-sm text-muted-foreground hover:text-foreground gap-2 px-0 h-auto py-1"
          >
            <Gift className="h-4 w-4" />
            Send as a gift instead
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnassignedItemsSection;
