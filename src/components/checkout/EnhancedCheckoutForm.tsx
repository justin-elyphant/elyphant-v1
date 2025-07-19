
import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import CheckoutForm from '@/components/marketplace/checkout/CheckoutForm';
import PaymentForm from '@/components/marketplace/checkout/PaymentForm';
import OrderSummary from '@/components/marketplace/checkout/OrderSummary';
import { useCheckoutState } from '@/components/marketplace/checkout/useCheckoutState';

interface EnhancedCheckoutFormProps {
  onCheckoutComplete: (orderData: any) => void;
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({
  onCheckoutComplete
}) => {
  const { cartItems, cartTotal } = useCart();
  const {
    activeTab,
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  const handleShippingMethodChange = (method: string) => {
    // Since we're using flat rate shipping, this is simplified
    console.log("Shipping method selected:", method);
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder()) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsProcessing(true);
    
    try {
      const totalAmount = cartTotal + getShippingCost() + (cartTotal * 0.0825);
      
      // Create Stripe checkout session with actual cart data
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          cartItems,
          totalAmount,
          shippingInfo: checkoutData.shippingInfo,
          giftOptions: {
            isGift: false,
            recipientName: "",
            giftMessage: "",
            giftWrapping: false,
            isSurpriseGift: false
          },
          metadata: {
            checkout_type: 'marketplace'
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab to avoid sandbox restrictions
        console.log("Opening Stripe checkout in new tab:", data.url);
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (error) {
      console.error("Stripe checkout session creation failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create checkout session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceedToNext = () => {
    if (activeTab === "shipping") {
      const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
      return name && email && address && city && state && zipCode;
    }
    return true;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            ← Back to Cart
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Complete your order below
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <CheckoutForm 
                    shippingInfo={checkoutData.shippingInfo} 
                    onUpdate={handleUpdateShippingInfo} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentForm
                    paymentMethod={checkoutData.paymentMethod}
                    onMethodChange={handlePaymentMethodChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-between mt-6">
              <div>
                {activeTab === "payment" && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleTabChange("shipping")}
                  >
                    Back to Shipping
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                {activeTab !== "payment" && (
                  <Button 
                    onClick={() => {
                      const tabs = ["shipping", "payment"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        handleTabChange(tabs[currentIndex + 1]);
                      }
                    }}
                    disabled={!canProceedToNext()}
                  >
                    Continue to Payment
                  </Button>
                )}
                
                {activeTab === "payment" && (
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={!canPlaceOrder() || isProcessing}
                    className="min-w-32"
                  >
                    {isProcessing ? "Creating checkout..." : "Place Order"}
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary
            cartItems={cartItems}
            cartTotal={cartTotal}
            shippingCost={getShippingCost()}
            selectedShippingOption={null}
            giftOptions={{
              isGift: false,
              recipientName: "",
              giftMessage: "",
              giftWrapping: false,
              isSurpriseGift: false
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;
