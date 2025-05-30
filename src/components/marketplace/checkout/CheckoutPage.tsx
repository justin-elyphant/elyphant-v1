
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/services/orderService";

// Import our newly created components
import CheckoutHeader from "./CheckoutHeader";
import CheckoutTabs from "./CheckoutTabs";
import PaymentSection from "./PaymentSection";
import { useCheckoutState } from "./useCheckoutState";

// Re-use existing components
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";
import GiftOptionsForm from "./GiftOptionsForm";
import ShippingOptionsForm from "./ShippingOptionsForm";
import GiftScheduling from "./GiftScheduling";

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { 
    activeTab, 
    isProcessing, 
    checkoutData, 
    setIsProcessing,
    handleTabChange, 
    handleUpdateShippingInfo, 
    handleUpdateGiftOptions, 
    handleUpdateGiftScheduling, 
    handleShippingMethodChange, 
    handlePaymentMethodChange,
    canProceedToPayment,
    canPlaceOrder
  } = useCheckoutState();

  // Memoize the formatted gift scheduling data to prevent unnecessary re-renders
  const formattedGiftScheduling = React.useMemo(() => {
    console.log("Formatting gift scheduling data:", checkoutData.giftScheduling);
    return {
      scheduleDelivery: Boolean(checkoutData.giftScheduling.scheduleDelivery),
      sendGiftMessage: Boolean(checkoutData.giftScheduling.sendGiftMessage),
      isSurprise: checkoutData.giftScheduling.isSurprise !== undefined ? 
        Boolean(checkoutData.giftScheduling.isSurprise) : undefined
    };
  }, [checkoutData.giftScheduling]);

  const getShippingCost = () => {
    return checkoutData.shippingMethod === "express" ? 12.99 : 4.99;
  };

  const getTaxAmount = () => {
    // Simple tax calculation - 8.25% for demonstration
    return cartTotal * 0.0825;
  };

  const getGiftWrappingCost = () => {
    return checkoutData.giftOptions.isGift && checkoutData.giftOptions.giftWrapping ? 4.99 : 0;
  };

  const getTotalAmount = () => {
    return cartTotal + getShippingCost() + getTaxAmount() + getGiftWrappingCost();
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create payment intent
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            amount: getTotalAmount(),
            currency: 'usd',
            metadata: {
              order_type: 'marketplace',
              items_count: cartItems.length
            }
          }
        }
      );

      if (paymentError) {
        throw new Error('Failed to create payment intent');
      }

      // Create order in database
      const order = await createOrder({
        cartItems,
        subtotal: cartTotal,
        shippingCost: getShippingCost(),
        taxAmount: getTaxAmount(),
        totalAmount: getTotalAmount(),
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: checkoutData.giftOptions,
        paymentIntentId: paymentData.payment_intent_id
      });

      // For demo purposes, simulate successful payment
      // In a real implementation, you would use Stripe Elements for payment
      
      // Clear cart and redirect to success page
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order-confirmation/${order.id}`);
      
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if cart is empty
  React.useEffect(() => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate("/marketplace");
    }
  }, [cartItems.length, navigate]);

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <CheckoutHeader title="Checkout" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            canProceedToPayment={Boolean(canProceedToPayment())}
          >
            <TabsContent value="shipping" className="space-y-6">
              <CheckoutForm 
                shippingInfo={checkoutData.shippingInfo} 
                onUpdate={handleUpdateShippingInfo} 
              />
              
              <ShippingOptionsForm
                selectedMethod={checkoutData.shippingMethod}
                onSelect={handleShippingMethodChange}
              />
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => handleTabChange("gift")} 
                  disabled={!canProceedToPayment()}
                >
                  Continue to Gift Options
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="gift" className="space-y-6">
              <GiftOptionsForm 
                giftOptions={checkoutData.giftOptions}
                onUpdate={handleUpdateGiftOptions}
              />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => handleTabChange("shipping")}>
                  Back to Shipping
                </Button>
                <Button onClick={() => handleTabChange("schedule")}>
                  Continue to Scheduling
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="schedule" className="space-y-6">
              <GiftScheduling
                giftScheduling={formattedGiftScheduling}
                onUpdate={handleUpdateGiftScheduling}
              />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => handleTabChange("gift")}>
                  Back to Gift Options
                </Button>
                <Button onClick={() => handleTabChange("payment")}>
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <PaymentSection
                paymentMethod={checkoutData.paymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={Boolean(isProcessing)}
                canPlaceOrder={Boolean(canPlaceOrder())}
                onPrevious={() => handleTabChange("schedule")}
              />
            </TabsContent>
          </CheckoutTabs>
        </div>
        
        <div className="lg:col-span-1">
          <OrderSummary 
            cartItems={cartItems}
            cartTotal={cartTotal}
            shippingMethod={checkoutData.shippingMethod}
            giftOptions={checkoutData.giftOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
