
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingBag, ArrowLeft, CreditCard, Lock } from 'lucide-react';
import SavedPaymentMethodsSection from '@/components/checkout/SavedPaymentMethodsSection';
import ModernPaymentForm from '@/components/payments/ModernPaymentForm';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_type: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface FormData {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const SimpleCheckoutForm: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();

  // Form and UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      const address = profile.shipping_address;
      setFormData({
        name: profile.name || profile.email || '',
        email: profile.email || '',
        address: address?.street || address?.address_line1 || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || address?.zip_code || '',
        country: address?.country || 'US',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectPaymentMethod = (method: PaymentMethod | null) => {
    setSelectedPaymentMethod(method);
    setShowNewCardForm(!method);
  };

  const handleAddNewMethod = () => {
    setSelectedPaymentMethod(null);
    setShowNewCardForm(true);
  };

  const validateStep1 = (): boolean => {
    if (!formData.name || !formData.email || !formData.address || 
        !formData.city || !formData.state || !formData.zipCode) {
      toast.error('Please fill in all required shipping information');
      return false;
    }
    return true;
  };

  const proceedToPayment = async () => {
    if (!validateStep1()) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(cartTotal * 100),
          currency: 'usd',
          metadata: {
            user_id: user?.id,
            user_email: user?.email || formData.email,
            shipping_address: JSON.stringify(formData),
            cart_items: JSON.stringify(cartItems),
            useExistingPaymentMethod: !!selectedPaymentMethod,
            paymentMethodId: selectedPaymentMethod?.stripe_payment_method_id
          }
        }
      });

      if (error) throw error;

      if (data?.client_secret) {
        setClientSecret(data.client_secret);
        setCurrentStep(2);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast.error(error.message || 'Failed to initialize payment');
      setPaymentError(error.message || 'Failed to initialize payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string, saveCard: boolean) => {
    try {
      setIsProcessing(true);

      // Create order in database
      const orderData = {
        user_id: user?.id,
        payment_intent_id: paymentIntentId,
        amount: cartTotal,
        currency: 'usd',
        status: 'processing',
        payment_status: 'succeeded',
        items: cartItems,
        shipping_address: formData,
        metadata: {
          stripe_payment_intent: paymentIntentId,
          save_card: saveCard
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Process with Zinc (existing logic)
      for (const item of cartItems) {
        try {
          const { error: zincError } = await supabase.functions.invoke('process-zinc-order', {
            body: {
              orderId: order.id,
              productId: item.product.product_id,
              quantity: item.quantity,
              maxPrice: item.product.price * 100,
              shippingAddress: {
                first_name: formData.name.split(' ')[0],
                last_name: formData.name.split(' ').slice(1).join(' '),
                address_line1: formData.address,
                city: formData.city,
                state: formData.state,
                zip_code: formData.zipCode,
                country: formData.country
              }
            }
          });

          if (zincError) {
            console.error('Zinc processing error for item:', item.product.product_id, zincError);
          }
        } catch (zincError) {
          console.error('Failed to process item with Zinc:', item.product.product_id, zincError);
        }
      }

      // Clear cart and navigate to success
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${order.id}`);

    } catch (error: any) {
      console.error('Error processing order:', error);
      toast.error('Order processing failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
    setClientSecret('');
    setPaymentError(null);
  };

  if (cartItems.length === 0) {
    return (
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
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/cart')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span className="ml-2">Shipping & Payment Method</span>
          </div>
          <div className="flex-1 h-px bg-border"></div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="ml-2">Complete Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <SavedPaymentMethodsSection
                      onSelectPaymentMethod={handleSelectPaymentMethod}
                      onAddNewMethod={handleAddNewMethod}
                      selectedMethodId={selectedPaymentMethod?.id}
                      refreshKey={refreshKey}
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Credit Card</div>
                        <div className="text-sm text-muted-foreground">
                          Pay with your credit or debit card
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {paymentError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {paymentError}
                </div>
              )}

              <Button
                onClick={proceedToPayment}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Preparing Payment...' : `Place Order - $${cartTotal.toFixed(2)}`}
              </Button>
            </div>
          )}

          {currentStep === 2 && clientSecret && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Complete Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  <ModernPaymentForm
                    clientSecret={clientSecret}
                    amount={cartTotal}
                    onSuccess={handlePaymentSuccess}
                    allowSaveCard={!!user && showNewCardForm}
                    buttonText={`Pay $${cartTotal.toFixed(2)}`}
                  />
                </Elements>
                
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={goBackToStep1}
                    disabled={isProcessing}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Shipping
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.product.product_id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.name || item.product.title}</h4>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleCheckoutForm;
