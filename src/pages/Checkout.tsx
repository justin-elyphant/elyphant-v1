import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import EnhancedCheckoutForm from '@/components/checkout/EnhancedCheckoutForm';

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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
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
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        {/* Checkout Form */}
        <div className="container mx-auto px-4 py-8">
          <EnhancedCheckoutForm onCheckoutComplete={handleCheckoutComplete} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;