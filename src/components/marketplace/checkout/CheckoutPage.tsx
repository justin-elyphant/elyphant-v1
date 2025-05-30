
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
import ShippingOptionsForm from "./ShippingOptionsForm";

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
    handleShippingMethodChange, 
    handlePaymentMethodChange,
    canProceedToPayment,
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
        giftOptions: {
          isGift: false,
          recipientName: "",
          giftMessage: "",
          giftWrapping: false
        },
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
                onPlaceOrder={handlePlaceOrder}
                isProcessing={Boolean(isProcessing)}
                canPlaceOrder={Boolean(canPlaceOrder())}
                onPrevious={() => handleTabChange("shipping")}
              />
            </TabsContent>
          </CheckoutTabs>
        </div>
        
        <div className="lg:col-span-1">
          <OrderSummary 
            cartItems={cartItems}
            cartTotal={cartTotal}
            shippingMethod={checkoutData.shippingMethod}
            giftOptions={{
              isGift: false,
              giftWrapping: false
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
