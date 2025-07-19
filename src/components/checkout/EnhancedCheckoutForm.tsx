
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Truck, Gift, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';
import CheckoutSummary from '@/components/marketplace/checkout/CheckoutSummary';
import ShippingForm from '@/components/marketplace/checkout/ShippingForm';
import GiftOptionsForm from '@/components/marketplace/checkout/GiftOptionsForm';
import PaymentMethodSelector from '@/components/marketplace/checkout/PaymentMethodSelector';
import RecipientAssignmentSection from '@/components/marketplace/checkout/RecipientAssignmentSection';

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
    currentStep,
    setCurrentStep,
    shippingInfo,
    setShippingInfo,
    giftOptions,
    setGiftOptions,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    subtotal,
    shippingCost,
    taxAmount,
    totalAmount,
    deliveryGroups,
    setDeliveryGroups,
    recipientAssignments,
    setRecipientAssignments
  } = useCheckoutState();

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

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting order placement process...', {
        testMode: isTestMode,
        cartItems: cartItems.length,
        totalAmount,
        selectedPaymentMethod: selectedPaymentMethod.type
      });

      // Create the order in our database first
      const { data: order, error: orderError } = await supabase.functions.invoke('create-order', {
        body: {
          cartItems,
          subtotal,
          shippingCost,
          taxAmount,
          totalAmount,
          shippingInfo,
          giftOptions,
          deliveryGroups,
          recipientAssignments,
          isTestMode // Pass test mode flag
        }
      });

      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }

      console.log('Order created successfully:', order);

      // Handle payment based on selected method
      if (selectedPaymentMethod.type === 'saved_card') {
        // Use saved payment method - charge directly
        const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-saved-payment', {
          body: {
            orderId: order.id,
            paymentMethodId: selectedPaymentMethod.id,
            amount: totalAmount * 100, // Convert to cents
            isTestMode
          }
        });

        if (paymentError) {
          // Update order status to failed
          await supabase.from('orders').update({ 
            status: 'failed',
            payment_status: 'failed' 
          }).eq('id', order.id);
          
          throw new Error(`Payment failed: ${paymentError.message}`);
        }

        console.log('Payment processed successfully:', paymentResult);

        // Process the order with Zinc
        const { data: zincResult, error: zincError } = await supabase.functions.invoke('process-zinc-order', {
          body: {
            orderId: order.id,
            isTestMode // Pass test mode to Zinc processing
          }
        });

        if (zincError) {
          console.warn('Zinc processing failed, but payment succeeded:', zincError);
          toast.warning('Order placed but fulfillment may be delayed. We\'ll update you soon.');
        } else {
          console.log('Zinc order processed:', zincResult);
        }

        // Send confirmation email
        await supabase.functions.invoke('send-order-confirmation', {
          body: {
            orderId: order.id,
            paymentMethodUsed: 'saved_payment_method'
          }
        });

        // Clear cart and redirect
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/purchase-success?order_id=${order.id}`);

      } else {
        // New payment method - redirect to Stripe
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
        window.location.href = stripeSession.url;
      }

    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 1, title: 'Shipping', icon: Truck },
    { id: 2, title: 'Recipients', icon: Users },
    { id: 3, title: 'Gifts', icon: Gift },
    { id: 4, title: 'Payment', icon: CreditCard }
  ];

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
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-4 flex-1 h-0.5 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShippingForm
                    shippingInfo={shippingInfo}
                    setShippingInfo={setShippingInfo}
                    onNext={() => setCurrentStep(2)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Recipient Assignment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecipientAssignmentSection
                    cartItems={cartItems}
                    shippingInfo={shippingInfo}
                    deliveryGroups={deliveryGroups}
                    setDeliveryGroups={setDeliveryGroups}
                    recipientAssignments={recipientAssignments}
                    setRecipientAssignments={setRecipientAssignments}
                    onNext={() => setCurrentStep(3)}
                    onBack={() => setCurrentStep(1)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Gift Options */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gift Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <GiftOptionsForm
                    giftOptions={giftOptions}
                    setGiftOptions={setGiftOptions}
                    onNext={() => setCurrentStep(4)}
                    onBack={() => setCurrentStep(2)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethodSelector
                    selectedPaymentMethod={selectedPaymentMethod}
                    setSelectedPaymentMethod={setSelectedPaymentMethod}
                    onBack={() => setCurrentStep(3)}
                  />
                  
                  <div className="mt-6 pt-6 border-t">
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={isProcessing || !selectedPaymentMethod}
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
            <CheckoutSummary
              cartItems={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              taxAmount={taxAmount}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;
