
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Gift, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ExpressCheckoutFlowProps {
  onExpressCheckout: (type: 'self' | 'gift') => void;
}

const ExpressCheckoutFlow: React.FC<ExpressCheckoutFlowProps> = ({ onExpressCheckout }) => {
  const { cartItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExpressSelf = async () => {
    if (!user) {
      toast.error('Please sign in to use express checkout');
      navigate('/sign-in');
      return;
    }

    setIsProcessing(true);
    try {
      // Auto-fill with user's saved address and payment method
      onExpressCheckout('self');
      toast.success('Express checkout initiated');
    } catch (error) {
      toast.error('Failed to start express checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpressGift = () => {
    setIsProcessing(true);
    onExpressCheckout('gift');
    toast.success('Express gift checkout initiated');
    setIsProcessing(false);
  };

  if (cartItems.length === 0) return null;

  const isSingleItem = cartItems.length === 1;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-yellow-500" />
          Express Checkout
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Skip the forms and checkout quickly with your saved information
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={handleExpressSelf}
            disabled={isProcessing || !user}
            className="flex items-center gap-2 h-12"
            variant="default"
          >
            <ShoppingCart className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Buy for Myself</div>
              <div className="text-xs opacity-90">
                {isSingleItem ? '1 item' : `${totalItems} items`} • Ship to me
              </div>
            </div>
          </Button>

          <Button
            onClick={handleExpressGift}
            disabled={isProcessing}
            className="flex items-center gap-2 h-12"
            variant="outline"
          >
            <Gift className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Send as Gift</div>
              <div className="text-xs opacity-70">
                Quick gift setup
              </div>
            </div>
          </Button>
        </div>

        {!user && (
          <p className="text-xs text-muted-foreground text-center">
            Sign in to use express checkout with saved information
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpressCheckoutFlow;
