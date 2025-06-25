
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, ShoppingCart, Zap, ArrowRight, CreditCard } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { triggerHapticFeedback } from '@/utils/haptics';

interface MobileExpressCheckoutProps {
  onCheckout: (type: 'self' | 'gift') => void;
  cartTotal: number;
  itemCount: number;
}

const MobileExpressCheckout: React.FC<MobileExpressCheckoutProps> = ({
  onCheckout,
  cartTotal,
  itemCount
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedType, setSelectedType] = useState<'gift' | 'self'>('gift');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExpressCheckout = async (type: 'self' | 'gift') => {
    triggerHapticFeedback('medium');
    
    if (!user && type === 'self') {
      toast.error('Please sign in to use express checkout');
      navigate('/sign-in');
      return;
    }

    setIsProcessing(true);
    setSelectedType(type);
    
    try {
      onCheckout(type);
      toast.success(`Express ${type === 'self' ? 'purchase' : 'gift'} mode activated`);
    } catch (error) {
      toast.error('Failed to start express checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const isSingleItem = itemCount === 1;

  if (!isMobile) return null;

  return (
    <div className="space-y-4 safe-area-bottom">
      {/* Express Checkout Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-sm">Express Checkout</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          Skip forms
        </Badge>
      </div>

      {/* Primary Express Actions */}
      <div className="space-y-3">
        {/* Send as Gift - Primary Option */}
        <Button
          onClick={() => handleExpressCheckout('gift')}
          disabled={isProcessing}
          className="w-full h-14 bg-primary hover:bg-primary/90 active:bg-primary/95 touch-target-48"
          size="lg"
        >
          <div className="flex items-center gap-3 w-full">
            <Gift className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="font-semibold">Send as Gift</div>
              <div className="text-xs opacity-90">
                {isSingleItem ? '1 item' : `${itemCount} items`} • {formatPrice(cartTotal)}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0" />
          </div>
        </Button>

        {/* Buy for Myself - Secondary Option */}
        <Button
          onClick={() => handleExpressCheckout('self')}
          disabled={isProcessing || !user}
          variant="outline"
          className="w-full h-12 touch-target-48"
          size="lg"
        >
          <div className="flex items-center gap-3 w-full">
            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="font-medium">Buy for Myself</div>
              <div className="text-xs opacity-70">
                {user ? 'Ship to my address' : 'Sign in required'}
              </div>
            </div>
            {!user && <span className="text-xs text-muted-foreground">Sign in</span>}
          </div>
        </Button>
      </div>

      {/* Standard Checkout Fallback */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        onClick={() => navigate('/checkout')}
        variant="ghost"
        className="w-full h-10 text-sm touch-target-44"
        disabled={isProcessing}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Standard Checkout
      </Button>

      {/* Mobile-specific notices */}
      {!user && (
        <p className="text-xs text-center text-muted-foreground px-2">
          Sign in for faster checkout with saved information
        </p>
      )}
    </div>
  );
};

export default MobileExpressCheckout;
