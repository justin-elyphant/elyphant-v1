import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import EnhancedCheckoutForm from '@/components/checkout/EnhancedCheckoutForm';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const handleCheckoutComplete = async (orderData: any) => {
    // This function is no longer used since we redirect to Stripe directly
    // But keeping it for compatibility with the EnhancedCheckoutForm interface
    console.log('Checkout complete callback (not used):', orderData);
  };

  // Redirect if not authenticated
  if (!user) {
    navigate('/signin');
    return null;
  }

  // Redirect if cart is empty
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

  return (
    <SidebarLayout>
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <EnhancedCheckoutForm onCheckoutComplete={handleCheckoutComplete} />
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Checkout;
