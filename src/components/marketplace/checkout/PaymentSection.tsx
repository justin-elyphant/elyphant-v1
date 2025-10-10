
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, CheckCircle, ArrowLeft } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { Elements } from '@stripe/react-stripe-js';
import { stripeClientManager } from "@/services/payment/StripeClientManager";
import UnifiedPaymentForm from "../../payments/UnifiedPaymentForm";
import SavedPaymentMethodsSection from "../../checkout/SavedPaymentMethodsSection";
import ExpressCheckoutButton from "./ExpressCheckoutButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

interface PaymentSectionProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onPlaceOrder: (paymentIntentId?: string) => void;
  isProcessing: boolean;
  canPlaceOrder: boolean;
  onPrevious: () => void;
  totalAmount: number;
  cartItems: CartItem[];
  shippingInfo?: any;
  giftOptions?: any;
  // CRITICAL: Pricing breakdown for webhook order creation
  pricingBreakdown: {
    subtotal: number;
    shippingCost: number;
    giftingFee: number;
    giftingFeeName: string;
    giftingFeeDescription: string;
    taxAmount: number;
  };
}

const PaymentSection = ({
  paymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isProcessing,
  canPlaceOrder,
  onPrevious,
  totalAmount,
  cartItems,
  shippingInfo,
  giftOptions,
  pricingBreakdown
}: PaymentSectionProps) => {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<any>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [pendingPaymentIntentId, setPendingPaymentIntentId] = useState<string>('');
  const [actualPaymentMethod, setActualPaymentMethod] = useState<string>('');

  useEffect(() => {
    if ((paymentMethod === 'card' || paymentMethod === 'express') && totalAmount > 0 && !clientSecret && !isCreatingPaymentIntent) {
      createPaymentIntent();
    }
  }, [paymentMethod, totalAmount]);

  const createPaymentIntent = async () => {
    setIsCreatingPaymentIntent(true);
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get cart session ID (required for webhook to find cart data)
      let cartSessionId = localStorage.getItem('cart_session_id');
      if (!cartSessionId) {
        console.warn('⚠️ No cart_session_id found - generating new one');
        cartSessionId = crypto.randomUUID();
        localStorage.setItem('cart_session_id', cartSessionId);
      }

      // Update cart session with COMPLETE cart data (matches webhook expectations)
      if (shippingInfo) {
        console.log('📦 Updating cart session with complete cart data:', cartSessionId);
        
        // CRITICAL: This structure MUST match what stripe-webhook expects for order creation
        const cartData = {
          cartItems: cartItems.map(item => ({
            product_id: item.product.product_id,
            title: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            image: item.product.image || '',
            recipient_id: item.recipientAssignment?.connectionId
          })),
          subtotal: pricingBreakdown.subtotal,
          shippingCost: pricingBreakdown.shippingCost,
          giftingFee: pricingBreakdown.giftingFee,
          giftingFeeName: pricingBreakdown.giftingFeeName,
          giftingFeeDescription: pricingBreakdown.giftingFeeDescription,
          taxAmount: pricingBreakdown.taxAmount,
          totalAmount: totalAmount,
          shippingInfo: shippingInfo,
          giftOptions: giftOptions || {}
        };

        await supabase.from('cart_sessions').upsert({
          session_id: cartSessionId,
          user_id: currentUser.id,
          cart_data: cartData,
          total_amount: totalAmount,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        });
        
        console.log('✅ Cart session updated with complete pricing data for webhook');
      } else {
        console.warn('⚠️ No shipping info available to update cart session');
      }

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            order_type: 'marketplace',
            cart_session_id: cartSessionId, // CRITICAL: Webhook needs this to fetch cart data
            user_id: currentUser.id // CRITICAL: Webhook needs this to create order
          }
        }
      });

      if (error) {
        throw error;
      }

      setClientSecret(data.client_secret);
      setPendingPaymentIntentId(data.payment_intent_id);
      
      console.log('🔵 Payment intent created for card form:', {
        payment_intent_id: data.payment_intent_id,
        amount: totalAmount,
        cart_session_id: cartSessionId,
        user_id: currentUser.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Determine actual payment method used
    let actualMethod = '';
    if (paymentIntentId === 'saved_payment_method') {
      actualMethod = 'saved_payment_method';
      console.log('💳 Using saved payment method - updating cart session before proceeding');
      
      // Update cart session with COMPLETE cart data for saved payment method flow
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && shippingInfo) {
          let cartSessionId = localStorage.getItem('cart_session_id');
          if (!cartSessionId) {
            cartSessionId = crypto.randomUUID();
            localStorage.setItem('cart_session_id', cartSessionId);
          }

          // CRITICAL: Match webhook-expected structure with all pricing fields
          const cartData = {
            cartItems: cartItems.map(item => ({
              product_id: item.product.product_id,
              title: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              image: item.product.image || '',
              recipient_id: item.recipientAssignment?.connectionId
            })),
            subtotal: pricingBreakdown.subtotal,
            shippingCost: pricingBreakdown.shippingCost,
            giftingFee: pricingBreakdown.giftingFee,
            giftingFeeName: pricingBreakdown.giftingFeeName,
            giftingFeeDescription: pricingBreakdown.giftingFeeDescription,
            taxAmount: pricingBreakdown.taxAmount,
            totalAmount: totalAmount,
            shippingInfo: shippingInfo,
            giftOptions: giftOptions || {}
          };

          await supabase.from('cart_sessions').upsert({
            session_id: cartSessionId,
            user_id: currentUser.id,
            cart_data: cartData,
            total_amount: totalAmount,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'session_id'
          });

          console.log('✅ Cart session updated with complete pricing data for saved payment method');
        }
      } catch (error) {
        console.error('❌ Failed to update cart session:', error);
      }
      
      // Cancel the unused payment intent if it exists
      if (pendingPaymentIntentId) {
        try {
          await supabase.functions.invoke('cancel-payment-intent', {
            body: {
              payment_intent_id: pendingPaymentIntentId,
              reason: 'user_selected_saved_payment_method'
            }
          });
        } catch (error) {
          console.error('Failed to cancel unused payment intent:', error);
        }
      }
    } else {
      actualMethod = 'new_card';
      console.log('💳 Using new card payment method');
    }
    
    setActualPaymentMethod(actualMethod);
    
    console.log('✅ Payment method confirmed:', {
      payment_intent_id: paymentIntentId,
      actual_method: actualMethod,
      total_amount: totalAmount,
      timestamp: new Date().toISOString()
    });
    
    onPlaceOrder(paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  const handleSelectPaymentMethod = (method: any) => {
    setSelectedSavedMethod(method);
    setShowNewCardForm(!method);
  };

  const handleAddNewMethod = () => {
    setSelectedSavedMethod(null);
    setShowNewCardForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
            {/* Express checkout temporarily hidden for MVP */}
            {false && (
              <div className={`flex items-center space-x-2 p-3 border rounded-lg transition-all ${
                paymentMethod === 'express' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/50'
              }`}>
                <RadioGroupItem value="express" id="express" />
                <Label htmlFor="express" className="flex items-center gap-2 flex-1 cursor-pointer text-sm">
                  <Smartphone className="h-4 w-4" />
                  Express Checkout (Apple Pay, Google Pay)
                </Label>
                {paymentMethod === 'express' && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
            )}
            
            <div className={`flex items-center space-x-2 p-3 border rounded-lg transition-all ${
              paymentMethod === 'card' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/50'
            }`}>
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 flex-1 cursor-pointer text-sm">
                <CreditCard className="h-4 w-4" />
                Credit/Debit Card
              </Label>
              {paymentMethod === 'card' && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </div>
            
            <div className={`flex items-center space-x-2 p-3 border rounded-lg transition-all ${
              paymentMethod === 'demo' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/50'
            }`}>
              <RadioGroupItem value="demo" id="demo" />
              <Label htmlFor="demo" className="flex items-center gap-2 flex-1 cursor-pointer text-sm">
                Demo Mode (Testing)
              </Label>
              {paymentMethod === 'demo' && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Method Status Indicator */}
      {actualPaymentMethod && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Payment method confirmed: {
                  actualPaymentMethod === 'saved_payment_method' ? 'Saved Payment Method' :
                  actualPaymentMethod === 'new_card' ? 'New Credit Card' :
                  actualPaymentMethod === 'demo' ? 'Demo Mode' :
                  actualPaymentMethod
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Express Checkout - Temporarily hidden for MVP */}
      {false && paymentMethod === 'express' && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Express checkout temporarily unavailable</p>
          </CardContent>
        </Card>
      )}

      {/* Card Payment */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          {user && (
            <SavedPaymentMethodsSection
              onSelectPaymentMethod={handleSelectPaymentMethod}
              onAddNewMethod={handleAddNewMethod}
              selectedMethodId={selectedSavedMethod?.id}
            />
          )}
          
          {/* Complete Payment Button for Saved Payment Methods */}
          {selectedSavedMethod && !showNewCardForm && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between gap-3">
                    <Button variant="outline" onClick={onPrevious} className="h-10">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => handlePaymentSuccess('saved_payment_method')}
                      disabled={!canPlaceOrder || isProcessing}
                      className="flex-1 h-10"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Complete Payment ${totalAmount.toFixed(2)}
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(showNewCardForm || !user) && (
            <div>
              {isCreatingPaymentIntent ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-3" />
                  <p className="text-sm">Setting up secure payment form...</p>
                </div>
              ) : clientSecret ? (
                <Elements stripe={stripeClientManager.getStripePromise()} options={{ clientSecret }}>
                  <UnifiedPaymentForm
                    clientSecret={clientSecret}
                    amount={totalAmount}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isProcessing={paymentProcessing}
                    onProcessingChange={setPaymentProcessing}
                    allowSaveCard={true}
                    mode="payment"
                  />
                </Elements>
              ) : (
                <Card>
                  <CardContent className="text-center py-6">
                    <p className="text-destructive text-sm">Failed to initialize payment form</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setClientSecret('')}
                      className="mt-3 h-9"
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Demo Mode */}
      {paymentMethod === 'demo' && (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Demo Mode:</strong> This will create a test order without processing payment.
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={onPrevious} className="h-9">
                Back to Schedule
              </Button>
                <Button 
                  onClick={() => {
                    setActualPaymentMethod('demo');
                    console.log('🎯 Using demo payment method');
                    onPlaceOrder();
                  }}
                  disabled={!canPlaceOrder || isProcessing}
                  className="h-9"
                >
                  {isProcessing ? "Processing..." : "Place Demo Order"}
                </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation - Only show if no saved payment method selected */}
      {paymentMethod !== 'demo' && paymentMethod !== 'express' && !showNewCardForm && !selectedSavedMethod && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious} className="h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentSection;
