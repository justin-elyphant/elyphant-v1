
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/services/orderService";
import { createZincOrderRequest, processOrder } from "@/components/marketplace/zinc/services/orderProcessingService";
import { getTransparentPricing } from "@/utils/transparentPricing";

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
    isLoadingShipping,
    checkoutData, 
    setIsProcessing,
    handleTabChange, 
    handleUpdateShippingInfo, 
    handleShippingMethodChange, 
    handlePaymentMethodChange,
    handleGiftOptionsChange,
    canProceedToPayment,
    canProceedToSchedule,
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  const getTaxAmount = () => {
    // Simple tax calculation - 8.25% for demonstration
    return cartTotal * 0.0825;
  };

  const getGiftingFee = async () => {
    const pricing = await getTransparentPricing(cartTotal);
    return pricing.giftingFee;
  };

  const getTotalAmount = async () => {
    const giftingFee = await getGiftingFee();
    return cartTotal + getShippingCost() + getTaxAmount() + giftingFee;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!checkoutData.selectedShippingOption) {
      toast.error("Please select a shipping method");
      return;
    }

    setIsProcessing(true);
    
    try {
      const giftingFee = await getGiftingFee();
      const totalAmount = await getTotalAmount();
      
      // Log gift options being processed
      console.log("Processing order with gift options:", checkoutData.giftOptions);
      console.log("Using shipping option:", checkoutData.selectedShippingOption);
      
      // Create payment intent
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            amount: totalAmount,
            currency: 'usd',
            metadata: {
              order_type: 'marketplace',
              items_count: cartItems.length,
              is_gift: checkoutData.giftOptions.isGift,
              shipping_method: checkoutData.selectedShippingOption.id
            }
          }
        }
      );

      if (paymentError) {
        throw new Error('Failed to create payment intent');
      }

      // Create order in database with gift options and real shipping cost
      const order = await createOrder({
        cartItems,
        subtotal: cartTotal,
        shippingCost: getShippingCost(),
        taxAmount: getTaxAmount(),
        totalAmount: totalAmount,
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: checkoutData.giftOptions,
        paymentIntentId: paymentData.payment_intent_id
      });

      // Process order through Zinc API with gift options and selected shipping method
      const zincProducts = cartItems.map(item => ({
        product_id: item.product.product_id,
        quantity: item.quantity
      }));

      const zincOrderRequest = createZincOrderRequest(
        zincProducts,
        checkoutData.shippingInfo,
        checkoutData.shippingInfo, // Using shipping as billing for demo
        checkoutData.paymentMethod,
        checkoutData.giftOptions,
        "amazon",
        true // is_test = true for demo
      );

      // Add shipping method to Zinc order request
      zincOrderRequest.shipping_method = checkoutData.selectedShippingOption.id;

      console.log("Sending Zinc order request with shipping method:", zincOrderRequest);
      
      const zincOrder = await processOrder(zincOrderRequest);
      
      if (zincOrder) {
        console.log("Zinc order processed successfully:", zincOrder);
        toast.success("Order placed and sent to fulfillment!");
      } else {
        console.warn("Zinc order processing failed, but internal order was created");
        toast.warning("Order placed but fulfillment may be delayed");
      }

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
            canProceedToSchedule={Boolean(canProceedToSchedule())}
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
                shippingOptions={checkoutData.shippingOptions}
                isLoading={isLoadingShipping}
              />
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => handleTabChange("schedule")} 
                  disabled={!canProceedToSchedule()}
                >
                  Continue to Schedule
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <GiftScheduleForm
                giftOptions={checkoutData.giftOptions}
                onUpdate={handleGiftOptionsChange}
              />
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline"
                  onClick={() => handleTabChange("shipping")}
                >
                  Back to Shipping
                </Button>
                <Button 
                  onClick={() => handleTabChange("payment")}
                  disabled={!canProceedToSchedule()}
                >
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
            shippingCost={getShippingCost()}
            selectedShippingOption={checkoutData.selectedShippingOption}
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
