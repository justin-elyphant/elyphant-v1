
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Elements, useStripe, useElements, CardElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Smartphone, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import SavedPaymentMethodsSection from './SavedPaymentMethodsSection';
import GiftOptionsForm from './components/GiftOptionsForm';
import ContextualHelp from '@/components/help/ContextualHelp';

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface GiftOptions {
  giftMessage: string;
  scheduledDeliveryDate: string;
  specialInstructions: string;
}

const CheckoutProgress = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { label: 'Shipping', icon: CheckCircle },
    { label: 'Payment', icon: CreditCard },
    { label: 'Review', icon: Shield }
  ];

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const StepIcon = step.icon;

        return (
          <div key={step.label} className="flex-1 relative">
            <div className="flex items-center">
              <div className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 
                ${isCompleted 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : isActive 
                    ? 'border-primary bg-background text-primary' 
                    : 'border-muted-foreground/30 bg-background text-muted-foreground'
                }
              `}>
                <StepIcon className="h-4 w-4" />
              </div>
              <div className="ml-2 hidden sm:block">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                absolute top-4 left-8 w-full h-0.5 -translate-y-1/2
                ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const ExpressCheckoutButtons = ({ paymentRequest, canMakePayment }: { 
  paymentRequest: any | null; 
  canMakePayment: boolean;
}) => {
  if (!paymentRequest || !canMakePayment) return null;

  return (
    <div className="space-y-4 mb-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Express Checkout</span>
        </div>
      </div>
      
      <div className="max-w-sm mx-auto">
        <PaymentRequestButtonElement options={{ paymentRequest }} />
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or pay with card</span>
        </div>
      </div>
    </div>
  );
};

const MobileOrderSummary = ({ 
  cartItems, 
  priceBreakdown, 
  isExpanded, 
  onToggle 
}: {
  cartItems: any[];
  priceBreakdown: any;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <div className="lg:hidden mb-6">
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-lg">Order Summary</CardTitle>
          <div className="flex items-center gap-2">
            <span className="font-semibold">${priceBreakdown.total.toFixed(2)}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.product.product_id} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                  {item.product.image && (
                    <img 
                      src={item.product.image}
                      alt={item.product.name || item.product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-sm">{item.product.name || item.product.title}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <PriceBreakdown priceBreakdown={priceBreakdown} />
        </CardContent>
      )}
    </Card>
  </div>
);

const PriceBreakdown = ({ priceBreakdown }: { priceBreakdown: any }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span>Subtotal</span>
      <span>${priceBreakdown.basePrice.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Shipping</span>
      <span>${priceBreakdown.shippingCost.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-1">
        {priceBreakdown.giftingFeeName}
        <ContextualHelp
          id="gifting-fee-checkout"
          title={`About Our ${priceBreakdown.giftingFeeName}`}
          content={
            <div className="space-y-2">
              <p>
                {priceBreakdown.giftingFeeDescription || 
                  "This fee supports platform technology, AI-powered features, and automation that make gifting seamless and delightful."
                }
              </p>
              <div className="space-y-1">
                <p className="font-medium">What's included:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  <li>Platform technology and maintenance</li>
                  <li>Customer support and gift tracking</li>
                  <li>Curated shopping experience</li>
                  <li>Secure payment processing</li>
                </ul>
              </div>
            </div>
          }
          iconSize={12}
          className="text-muted-foreground hover:text-foreground"
        />
      </span>
      <span>${priceBreakdown.giftingFee.toFixed(2)}</span>
    </div>
    <Separator />
    <div className="flex justify-between font-semibold text-lg">
      <span>Total</span>
      <span>${priceBreakdown.total.toFixed(2)}</span>
    </div>
  </div>
);

const CheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { calculatePriceBreakdown } = usePricingSettings();
  const stripe = useStripe();
  const elements = useElements();

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [savedMethodsRefreshKey, setSavedMethodsRefreshKey] = useState(0);
  const [mobileOrderExpanded, setMobileOrderExpanded] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [giftOptions, setGiftOptions] = useState<GiftOptions>({
    giftMessage: '',
    scheduledDeliveryDate: '',
    specialInstructions: ''
  });

  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = 6.99;
  const priceBreakdown = calculatePriceBreakdown(cartTotal, shippingCost);

  // Initialize Apple Pay and Google Pay
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Total',
        amount: Math.round(priceBreakdown.total * 100),
      },
      requestShipping: true,
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      // Handle express checkout payment
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: ev.paymentMethod.id
      });

      if (error) {
        ev.complete('fail');
        toast.error(error.message);
      } else {
        ev.complete('success');
        await handleOrderCompletion(paymentIntent.id);
      }
    });
  }, [stripe, priceBreakdown.total, clientSecret]);

  const createPaymentIntent = async (useExistingMethod = false) => {
    try {
      const metadata = {
        user_id: user?.id || 'guest',
        cart_items: JSON.stringify(cartItems.map(item => ({
          product_id: item.product.product_id,
          quantity: item.quantity,
          price: item.product.price
        }))),
        shipping_info: JSON.stringify(shippingInfo),
        gift_options: JSON.stringify(giftOptions),
        useExistingPaymentMethod: useExistingMethod,
        paymentMethodId: selectedPaymentMethod
      };

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(priceBreakdown.total * 100),
          currency: 'usd',
          metadata
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment');
      return null;
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);

    try {
      let paymentIntentData;
      
      if (selectedPaymentMethod && !showNewCardForm) {
        // Use existing payment method
        paymentIntentData = await createPaymentIntent(true);
        if (paymentIntentData?.status === 'succeeded') {
          await handleOrderCompletion(paymentIntentData.payment_intent_id);
          return;
        }
      } else {
        // Create new payment intent for new card
        paymentIntentData = await createPaymentIntent(false);
        if (!paymentIntentData?.client_secret) {
          throw new Error('Failed to create payment intent');
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          paymentIntentData.client_secret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: shippingInfo.name,
                email: shippingInfo.email,
              },
            },
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message || 'Payment failed');
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          await handleOrderCompletion(paymentIntent.id);
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrderCompletion = async (paymentIntentId: string) => {
    try {
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product.product_id,
          quantity: item.quantity,
          price: item.product.price,
          name: item.product.name || item.product.title,
          image: item.product.image
        })),
        shipping_info: shippingInfo,
        payment_intent_id: paymentIntentId,
        total_amount: priceBreakdown.total,
        gift_options: giftOptions,
        scheduled_delivery_date: scheduledDate?.toISOString() || null
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          subtotal: priceBreakdown.basePrice,
          shipping_cost: priceBreakdown.shippingCost,
          tax_amount: 0,
          total_amount: priceBreakdown.total,
          status: 'pending',
          payment_status: 'paid',
          shipping_info: shippingInfo,
          gift_message: giftOptions.giftMessage || null,
          is_gift: !!giftOptions.giftMessage,
          scheduled_delivery_date: giftOptions.scheduledDeliveryDate || null,
          stripe_payment_intent_id: paymentIntentId
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (order) {
        const orderItems = cartItems.map(item => ({
          order_id: order.id,
          product_id: item.product.product_id,
          product_name: item.product.name || item.product.title,
          product_image: item.product.image,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity
        }));

        await supabase.from('order_items').insert(orderItems);

        // Process Zinc order
        await supabase.functions.invoke('process-zinc-order', {
          body: { orderId: order.id, isTestMode: true }
        });
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast.error('Order processing failed');
    }
  };

  const handlePaymentMethodSelect = (method: any) => {
    if (method) {
      setSelectedPaymentMethod(method.stripe_payment_method_id || method.id);
      setShowNewCardForm(false);
    } else {
      setSelectedPaymentMethod('');
      setShowNewCardForm(true);
    }
  };

  const handleAddNewMethod = () => {
    setSelectedPaymentMethod('');
    setShowNewCardForm(true);
  };

  const isShippingValid = () => {
    return shippingInfo.name && shippingInfo.email && shippingInfo.address && 
           shippingInfo.city && shippingInfo.state && shippingInfo.zipCode;
  };

  const canProceedToPayment = currentStep === 0 && isShippingValid();
  const canCompleteOrder = currentStep === 1 && (selectedPaymentMethod || showNewCardForm);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your purchase securely</p>
          </div>

          <CheckoutProgress currentStep={currentStep} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mobile Order Summary */}
              <MobileOrderSummary
                cartItems={cartItems}
                priceBreakdown={priceBreakdown}
                isExpanded={mobileOrderExpanded}
                onToggle={() => setMobileOrderExpanded(!mobileOrderExpanded)}
              />

              {/* Shipping Information */}
              {currentStep === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={shippingInfo.name}
                          onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        value={shippingInfo.addressLine2}
                        onChange={(e) => setShippingInfo({...shippingInfo, addressLine2: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => setCurrentStep(1)}
                      disabled={!canProceedToPayment}
                      className="w-full"
                    >
                      Continue to Payment
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Payment Section */}
              {currentStep === 1 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          2
                        </div>
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ExpressCheckoutButtons 
                        paymentRequest={paymentRequest}
                        canMakePayment={canMakePayment}
                      />

                      {user && (
                        <SavedPaymentMethodsSection
                          onSelectPaymentMethod={handlePaymentMethodSelect}
                          onAddNewMethod={handleAddNewMethod}
                          selectedMethodId={selectedPaymentMethod}
                          refreshKey={savedMethodsRefreshKey}
                        />
                      )}

                      {(!user || showNewCardForm) && (
                        <div className="space-y-4 mt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="h-5 w-5" />
                            <span className="font-medium">Card Details</span>
                            <Shield className="h-4 w-4 text-green-600 ml-auto" />
                          </div>
                          
                          <div className="p-4 border rounded-lg bg-white">
                            <CardElement options={{
                              style: {
                                base: {
                                  fontSize: '16px',
                                  color: '#424770',
                                  '::placeholder': { color: '#aab7c4' },
                                  padding: '12px',
                                },
                                invalid: { color: '#9e2146' },
                              },
                              hidePostalCode: false,
                            }} />
                          </div>

                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Your payment information is encrypted and secure
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <GiftOptionsForm
                    giftOptions={giftOptions}
                    onChange={setGiftOptions}
                    scheduledDate={scheduledDate}
                    onScheduledDateChange={setScheduledDate}
                  />

                  <div className="flex gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                      className="flex-1"
                    >
                      Back to Shipping
                    </Button>
                    <Button 
                      onClick={handlePaymentSubmit}
                      disabled={!canCompleteOrder || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? 'Processing...' : `Complete Order - $${priceBreakdown.total.toFixed(2)}`}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Desktop Order Summary */}
            <div className="hidden lg:block">
              <div className="sticky top-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.product.product_id} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                            {item.product.image && (
                              <img 
                                src={item.product.image}
                                alt={item.product.name || item.product.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium text-sm">{item.product.name || item.product.title}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <PriceBreakdown priceBreakdown={priceBreakdown} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnifiedCheckoutForm = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default UnifiedCheckoutForm;
