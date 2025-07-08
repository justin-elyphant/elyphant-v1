import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import MainLayout from '@/components/layout/MainLayout';
import EnhancedCheckoutForm from '@/components/checkout/EnhancedCheckoutForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const handleCheckoutComplete = async (orderData: any) => {
    try {
      // In a real app, this would process the payment and create the order
      console.log('Processing order:', orderData);
      
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cart after successful order
      clearCart();
      
      toast.success('Order placed successfully!');
      
      // Navigate to order confirmation or success page
      navigate('/orders', { replace: true });
    } catch (error) {
      console.error('Order processing failed:', error);
      toast.error('Failed to process order. Please try again.');
    }
  };

  // Redirect if not authenticated
  if (!user) {
    navigate('/signin');
    return null;
  }

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 max-w-6xl">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/cart')}
                className="touch-target-44"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Secure Checkout</h1>
                <p className="text-sm text-muted-foreground">
                  Complete your order securely
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="container mx-auto px-4 py-8">
          <EnhancedCheckoutForm onCheckoutComplete={handleCheckoutComplete} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Checkout;