
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import CheckoutTabs from './CheckoutTabs';
import CheckoutSummary from './CheckoutSummary';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Gift, ShoppingCart } from 'lucide-react';

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Get express mode state from navigation
  const expressMode = location.state?.expressMode || false;
  const expressType = location.state?.expressType || null;

  useEffect(() => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/marketplace');
    }
  }, [cartItems, navigate]);

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Express Mode Header */}
      {expressMode && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">Express Checkout Active</span>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                {expressType === 'gift' ? (
                  <>
                    <Gift className="h-3 w-3" />
                    Sending as Gift
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-3 w-3" />
                    Buy for Myself
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {expressType === 'gift' 
                ? 'Quick gift setup with minimal forms'
                : 'Using your saved information for faster checkout'
              }
            </p>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Checkout Form */}
        <div className={isMobile ? 'order-2' : 'lg:col-span-2'}>
          <CheckoutTabs 
            expressMode={expressMode}
            expressType={expressType}
          />
        </div>
        
        {/* Order Summary */}
        <div className={isMobile ? 'order-1' : 'lg:col-span-1'}>
          <CheckoutSummary />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
