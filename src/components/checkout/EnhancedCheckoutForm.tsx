
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, CreditCard, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';

interface EnhancedCheckoutFormProps {
  onCheckoutComplete: (orderData: any) => void;
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({ onCheckoutComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  const {
    activeTab,
    isProcessing: hookIsProcessing,
    checkoutData,
    setIsProcessing: setHookIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = getShippingCost();
  const taxAmount = subtotal * 0.08; // 8% tax
  const totalAmount = subtotal + shippingCost + taxAmount;

  // Check if we're in test mode (admin panel or test environment)
  useEffect(() => {
    const checkTestMode = () => {
      // Check if this is coming from admin test panel
      const urlParams = new URLSearchParams(window.location.search);
      const isAdminTest = urlParams.get('test') === 'true';
      
      // Check if this is a development environment (optional)
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
      
      // Only enable test mode for explicit admin tests, not for regular dev work
      setIsTestMode(isAdminTest);
    };

    checkTestMode();
  }, []);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/signin');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validation is handled by isShippingComplete check

    setIsProcessing(true);

    try {
      console.log('Starting order placement process...', {
        testMode: isTestMode,
        cartItems: cartItems.length,
        totalAmount,
        shippingInfo: checkoutData.shippingInfo
      });

      // Create the order in our database first
      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: {
          cartItems,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          shippingInfo: checkoutData.shippingInfo,
          isTestMode // Pass test mode flag
        }
      });

      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }

      console.log('Order created successfully:', order);

      // Create Stripe checkout session
      const { data: stripeSession, error: stripeError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          orderId: order.id,
          successUrl: `${window.location.origin}/purchase-success?order_id=${order.id}`,
          cancelUrl: `${window.location.origin}/checkout`,
          isTestMode
        }
      });

      if (stripeError) {
        throw new Error(`Stripe session creation failed: ${stripeError.message}`);
      }

      console.log('Redirecting to Stripe checkout:', stripeSession.url);
      // Open Stripe checkout in a new tab
      window.open(stripeSession.url, '_blank');

    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isShippingComplete = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Checkout</h1>
              {isTestMode && (
                <p className="text-sm text-amber-600 font-medium">
                  🧪 Test Mode Active - No real charges will be made
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center space-x-2 ${activeTab === 'shipping' ? 'text-blue-600' : 'text-gray-400'}`}>
              <Truck className="h-5 w-5" />
              <span className="font-medium">Shipping</span>
            </div>
            <div className={`flex items-center space-x-2 ${activeTab === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            {activeTab === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={checkoutData.shippingInfo.name}
                        onChange={(e) => handleUpdateShippingInfo({ name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={checkoutData.shippingInfo.email}
                        onChange={(e) => handleUpdateShippingInfo({ email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={checkoutData.shippingInfo.address}
                      onChange={(e) => handleUpdateShippingInfo({ address: e.target.value })}
                      placeholder="Enter your street address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={checkoutData.shippingInfo.addressLine2}
                      onChange={(e) => handleUpdateShippingInfo({ addressLine2: e.target.value })}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={checkoutData.shippingInfo.city}
                        onChange={(e) => handleUpdateShippingInfo({ city: e.target.value })}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={checkoutData.shippingInfo.state}
                        onChange={(e) => handleUpdateShippingInfo({ state: e.target.value })}
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={checkoutData.shippingInfo.zipCode}
                        onChange={(e) => handleUpdateShippingInfo({ zipCode: e.target.value })}
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleTabChange('payment')}
                      disabled={!isShippingComplete()}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment */}
            {activeTab === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">
                    You'll be redirected to Stripe to complete your payment securely.
                  </p>
                  
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => handleTabChange('shipping')}
                      className="mr-4"
                    >
                      Back to Shipping
                    </Button>
                    
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing || !isShippingComplete()}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing 
                        ? 'Processing...' 
                        : isTestMode 
                        ? `Place Test Order - $${totalAmount.toFixed(2)}`
                        : `Place Order - $${totalAmount.toFixed(2)}`
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.title}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;
