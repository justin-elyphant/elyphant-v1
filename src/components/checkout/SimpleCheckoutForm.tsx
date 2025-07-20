import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShoppingBag, CreditCard } from 'lucide-react';
import { toast } from "sonner";
import { createOrder } from '@/services/orderService';
import { ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import { ModernPaymentForm } from '@/components/payments/ModernPaymentForm';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { SavedPaymentMethodsSection } from '@/components/payments/SavedPaymentMethodsSection';
import TransparentPriceBreakdown from '@/components/marketplace/checkout/TransparentPriceBreakdown';
import { usePricingSettings } from '@/hooks/usePricingSettings';

interface GiftOptions {
  isGift: boolean;
  giftMessage?: string;
  scheduledDeliveryDate?: string;
  isSurpriseGift: boolean;
}

const SimpleCheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const [giftOptions, setGiftOptions] = useState<GiftOptions>({
    isGift: false,
    giftMessage: '',
    scheduledDeliveryDate: '',
    isSurpriseGift: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const { calculatePriceBreakdown } = usePricingSettings();
  
  // Calculate complete price breakdown including all fees
  const priceBreakdown = calculatePriceBreakdown(cartTotal, 6.99); // 6.99 is shipping cost
  const taxAmount = cartTotal * 0.0725;
  const finalTotal = priceBreakdown.total + taxAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleGiftOptionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    
    if (type === 'checkbox') {
      setGiftOptions(prev => ({ ...prev, [name]: checked }));
    } else {
      setGiftOptions(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please log in to complete your purchase');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode) {
      toast.error('Please fill in all shipping information');
      return;
    }

    setIsProcessing(true);

    try {
      // Use the correct final total for payment
      const { data } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          amount: Math.round(finalTotal * 100), // Convert to cents and use final total
          currency: 'usd'
        }
      });

      if (data?.client_secret) {
        setClientSecret(data.client_secret);
        setShowPaymentForm(true);
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string, saveCard: boolean) => {
    try {
      console.log('Payment successful, creating order...');
      
      const orderData = {
        cartItems,
        subtotal: cartTotal,
        shippingCost: 6.99,
        taxAmount: taxAmount,
        totalAmount: finalTotal, // Use final total here too
        shippingInfo,
        giftOptions,
        paymentIntentId
      };

      const order = await createOrder(orderData);
      console.log('Order created:', order);

      // Clear cart and redirect
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order.id}`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Payment successful but order creation failed. Please contact support.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-96">
          <CardContent className="text-center">
            Your cart is empty.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-96">
          <CardContent className="text-center">
            Processing...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/marketplace')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-2xl font-bold">Secure Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information Form */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={shippingInfo.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={shippingInfo.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {user && (
                  <SavedPaymentMethodsSection
                    onSelectPaymentMethod={setSelectedPaymentMethod}
                    selectedPaymentMethodId={selectedPaymentMethod?.id}
                  />
                )}

                {!showPaymentForm && (
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      'Processing...'
                    ) : (
                      `Place Order - $${finalTotal.toFixed(2)}`
                    )}
                  </Button>
                )}

                {showPaymentForm && clientSecret && (
                  <div className="space-y-4">
                    <ModernPaymentForm
                      clientSecret={clientSecret}
                      amount={finalTotal} // Use final total here
                      onSuccess={handlePaymentSuccess}
                      allowSaveCard={true}
                      buttonText={`Complete Payment - $${finalTotal.toFixed(2)}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        {item.product.image && (
                          <img 
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <TransparentPriceBreakdown 
                  basePrice={cartTotal}
                  shippingCost={6.99}
                  className="text-sm"
                />

                {/* Add tax line */}
                <div className="flex justify-between text-sm pt-2">
                  <span>Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Final Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCheckoutForm;
