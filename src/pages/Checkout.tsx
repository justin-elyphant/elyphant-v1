
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import UnifiedCheckoutForm from '@/components/checkout/UnifiedCheckoutForm';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { useCartSessionTracking } from '@/hooks/useCartSessionTracking';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, deliveryGroups, getUnassignedItems } = useCart();
  const { profile } = useProfile();

  // Track cart session for abandoned cart detection
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  useCartSessionTracking(cartItems, totalAmount, 0, false);

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

  // Enhanced cart-to-checkout validation
  const unassignedItems = getUnassignedItems();
  const hasUnassignedItems = unassignedItems.length > 0;
  
  // Check if user has complete shipping address for unassigned items
  const shippingAddress = profile?.shipping_address;
  const hasCompleteAddress = shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode);

  // If there are unassigned items but no complete shipping address, redirect to cart
  if (hasUnassignedItems && !hasCompleteAddress) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Shipping Setup Required</h2>
            <p className="text-muted-foreground mb-6">
              You have {unassignedItems.length} item{unassignedItems.length > 1 ? 's' : ''} that need{unassignedItems.length === 1 ? 's' : ''} a shipping address. 
              Please complete your shipping setup in the cart.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate("/cart")} className="w-full sm:w-auto">
                Complete Shipping Setup
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/marketplace")}
                className="w-full sm:w-auto"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <UnifiedCheckoutForm />
    </SidebarLayout>
  );
};

export default Checkout;
