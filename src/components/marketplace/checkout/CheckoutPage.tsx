
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/services/orderService";

// Import our components
import CheckoutHeader from "./CheckoutHeader";
import CheckoutTabs from "./CheckoutTabs";
import PaymentSection from "./PaymentSection";
import GiftScheduleForm from "./GiftScheduleForm";
import GuestSignupPrompt from "./GuestSignupPrompt";
import { useCheckoutState } from "./useCheckoutState";

// Re-use existing components
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";
import ShippingOptionsForm from "./ShippingOptionsForm";

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showGuestSignup, setShowGuestSignup] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState("");
  
  const { 
    activeTab, 
    isProcessing, 
    checkoutData, 
    setIsProcessing,
    handleTabChange, 
    handleUpdateShippingInfo, 
    handleShippingMethodChange, 
    handlePaymentMethodChange,
    handleGiftOptionsChange,
    canProceedToPayment,
    canProceedToSchedule,
    canPlaceOrder
  } = useCheckoutState();

  const getShippingCost = () => {
    return checkoutData.shippingMethod === "express" ? 12.99 : 4.99;
  };

  const getTaxAmount = () => {
    // Simple tax calculation - 8.25% for demonstration
    return cartTotal * 0.0825;
  };

  const getTotalAmount = () => {
    return cartTotal + getShippingCost() + getTaxAmount();
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
              items_count: cartItems.length,
              is_gift: checkoutData.giftOptions.isGift
            }
          }
        }
      );

      if (paymentError) {
        throw new Error('Failed to create payment intent');
      }

      // Create order in database with gift options
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

      // Clear cart and handle post-purchase flow
      clearCart();
      toast.success("Order placed successfully!");

      // Show guest signup prompt if user is not logged in
      if (!user) {
        setCompletedOrderNumber(order.order_number);
        setShowGuestSignup(true);
        // Still navigate to confirmation page
        setTimeout(() => {
          navigate(`/order-confirmation/${order.id}`);
        }, 500);
      } else {
        navigate(`/order-confirmation/${order.id}`);
      }
      
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
            canProceedToSchedule={Boolean(canProceedToSchedule())}
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
                  onClick={() => handleTabChange("payment")} 
                  disabled={!canProceedToPayment()}
                >
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <PaymentSection
                paymentMethod={checkoutData.paymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                onPlaceOrder={() => handleTabChange("schedule")}
                isProcessing={false}
                canPlaceOrder={Boolean(canProceedToSchedule())}
                onPrevious={() => handleTabChange("shipping")}
              />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <GiftScheduleForm
                giftOptions={checkoutData.giftOptions}
                onUpdate={handleGiftOptionsChange}
              />
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline"
                  onClick={() => handleTabChange("payment")}
                >
                  Back to Payment
                </Button>
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={Boolean(isProcessing) || !canPlaceOrder()}
                >
                  {isProcessing ? "Processing..." : "Place Order"}
                </Button>
              </div>
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

      {/* Guest Signup Prompt */}
      <GuestSignupPrompt
        isOpen={showGuestSignup}
        onClose={() => setShowGuestSignup(false)}
        shippingInfo={checkoutData.shippingInfo}
        orderNumber={completedOrderNumber}
      />
    </div>
  );
};

export default CheckoutPage;
