
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const { cartItems, cartTotal } = useCart();
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

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Here we would integrate with the payment processor 
      // and potentially the Zinc API for fulfillment
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, we'll just redirect to success page
      toast.success("Order placed successfully!");
      navigate("/purchase-success?order_id=demo-" + Date.now());
    } catch (error) {
      toast.error("Failed to process order. Please try again.");
      console.error("Checkout error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Force all gift scheduling options to be strictly boolean values
  // Explicitly ensure all values are proper booleans using triple equals comparison
  const formattedGiftScheduling = {
    scheduleDelivery: checkoutData.giftScheduling.scheduleDelivery === true,
    sendGiftMessage: checkoutData.giftScheduling.sendGiftMessage === true,
    isSurprise: checkoutData.giftScheduling.isSurprise === undefined ? 
      undefined : checkoutData.giftScheduling.isSurprise === true
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <CheckoutHeader title="Checkout" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            canProceedToPayment={canProceedToPayment()}
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
                isProcessing={isProcessing}
                canPlaceOrder={canPlaceOrder()}
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
