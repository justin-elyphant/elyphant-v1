import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Package, MapPin, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import StripePaymentForm from '@/components/marketplace/checkout/StripePaymentForm';
import TransparentPriceBreakdown from '@/components/marketplace/checkout/TransparentPriceBreakdown';
import SavedPaymentMethodsSection from '@/components/checkout/SavedPaymentMethodsSection';
import { usePricingSettings } from '@/hooks/usePricingSettings';

interface SavedPaymentMethod {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const SimpleCheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { calculatePriceBreakdown } = usePricingSettings();
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = 6.99;
  const finalTotal = calculatePriceBreakdown(cartTotal, shippingCost).total;

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setShippingInfo(prev => ({
            ...prev,
            fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            email: profile.email || user.email || ''
          }));
        }
      }
    };
    
    fetchUserData();
  }, []);

  const createPaymentIntent = async (useExistingPaymentMethod: boolean = false, paymentMethodId?: string) => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: finalTotal * 100, // Convert to cents
          currency: 'usd',
          metadata: {
            cartItems: JSON.stringify(cartItems),
            shippingInfo: JSON.stringify(shippingInfo),
            useExistingPaymentMethod,
            paymentMethodId
          }
        }
      });

      if (error) throw error;
      
      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
      
      console.log('Payment intent created:', data);
      
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchSavedPaymentMethods = async () => {
    try {
      setIsLoadingPaymentMethods(true);
      const { data, error } = await supabase.functions.invoke('get-saved-payment-methods');
      
      if (error) throw error;
      
      setSavedPaymentMethods(data.payment_methods || []);
    } catch (error) {
      console.error('Error fetching saved payment methods:', error);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  useEffect(() => {
    fetchSavedPaymentMethods();
  }, []);

  const createOrder = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image
        })),
        shipping_info: shippingInfo,
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId,
        subtotal: cartTotal,
        shipping_cost: shippingCost,
        total: finalTotal
      };

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string, paymentMethodId?: string) => {
    try {
      setIsProcessing(true);
      
      const orderData = await createOrder(paymentIntentId, paymentMethodId);
      
      clearCart();
      
      toast.success('Order placed successfully!');
      
      navigate('/order-confirmation', {
        state: {
          orderData,
          shippingInfo
        }
      });
    } catch (error) {
      console.error('Error processing successful payment:', error);
      toast.error('Payment succeeded but order processing failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setIsProcessing(false);
  };

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlaceOrder = async () => {
    if (!shippingInfo.fullName || !shippingInfo.email || !shippingInfo.address || 
        !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      toast.error('Please fill in all required shipping information');
      return;
    }

    try {
      if (selectedPaymentMethod) {
        await createPaymentIntent(true, selectedPaymentMethod);
      } else {
        await createPaymentIntent(false);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
    }
  };

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    setSelectedPaymentMethod(paymentMethodId);
    setClientSecret('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={shippingInfo.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={shippingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={shippingInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={shippingInfo.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="10001"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <SavedPaymentMethodsSection
            savedPaymentMethods={savedPaymentMethods}
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={handlePaymentMethodSelect}
            isLoading={isLoadingPaymentMethods}
          />

          {clientSecret && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    amount={finalTotal}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isProcessing={isProcessing}
                    onProcessingChange={setIsProcessing}
                    savePaymentMethod={true}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={item.image || '/placeholder.svg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <TransparentPriceBreakdown
                  basePrice={cartTotal}
                  shippingCost={shippingCost}
                  className="space-y-2"
                />
                
                <Separator />
                
                {!clientSecret && (
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleCheckoutForm;
