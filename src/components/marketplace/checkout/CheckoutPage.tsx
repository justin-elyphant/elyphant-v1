
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import CheckoutTabs from './CheckoutTabs';
import CheckoutSummary from './CheckoutSummary';
import { useIsMobile } from '@/hooks/use-mobile';

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Checkout Form */}
        <div className={isMobile ? 'order-2' : 'lg:col-span-2'}>
          <CheckoutTabs />
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
