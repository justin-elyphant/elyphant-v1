
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import UnifiedCheckoutForm from '@/components/checkout/UnifiedCheckoutForm';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, deliveryGroups, getUnassignedItems } = useCart();

  // Check cart completeness and redirect accordingly
  if (cartItems.length === 0) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some items to your cart before checking out
            </p>
            <Button onClick={() => navigate("/marketplace")}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Check shipping completeness - redirect to cart if incomplete
  const unassignedItems = getUnassignedItems();
  const hasUnassignedItems = unassignedItems.length > 0;
  
  // For now, allow checkout to proceed but show warnings in CheckoutShippingReview
  // Future enhancement: Add stricter validation here if needed

  return (
    <SidebarLayout>
      <UnifiedCheckoutForm />
    </SidebarLayout>
  );
};

export default Checkout;
