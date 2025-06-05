
import React, { useState, useEffect } from "react";
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
import { validateCartData, validateProductAvailability, updateCartItemPrices } from "@/utils/validateCartData";

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
  const { cartItems, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showGuestSignup, setShowGuestSignup] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState("");
  const [cartValidation, setCartValidation] = useState<any>(null);
  const [isValidatingCart, setIsValidatingCart] = useState(false);
  
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

  // Non-blocking cart validation for user awareness only
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCartAsync();
    }
  }, [cartItems]);

  const validateCartAsync = async () => {
    setIsValidatingCart(true);
    
    try {
      const validation = validateCartData(cartItems);
      
      if (!validation.isValid) {
        toast.warning("Cart validation issues detected", {
          description: "Some items may have issues but you can still proceed with checkout"
        });
        
        // Remove invalid items but don't block checkout
        validation.invalidItems.forEach(item => {
          removeFromCart(item.product.product_id);
        });
      }

      if (validation.warnings.length > 0) {
        console.warn("Cart validation warnings:", validation.warnings);
      }

      const availability = await validateProductAvailability(cartItems);
      const unavailableItems = availability.filter(item => !item.available);
      const priceChangedItems = availability.filter(item => item.price_changed);

      if (unavailableItems.length > 0) {
        toast.warning("Some items updated", {
          description: `${unavailableItems.length} items were removed due to availability`
        });
        
        unavailableItems.forEach(item => {
          removeFromCart(item.product_id);
        });
      }

      if (priceChangedItems.length > 0) {
        toast.info("Price updates detected", {
          description: `${priceChangedItems.length} items have updated prices`
        });
      }

      setCartValidation(validation);
    } catch (error) {
      console.error("Cart validation error:", error);
      // Don't show error toast for validation - it's informational only
    } finally {
      setIsValidatingCart(false);
    }
  };

  const getTaxAmount = () => {
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

  const handlePlaceOrder = async (paymentIntentId?: string) => {
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
      // Process payment first if payment intent provided
      if (paymentIntentId) {
        try {
          const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
            'confirm-payment',
            {
              body: {
                payment_intent_id: paymentIntentId,
                order_id: null // We'll update this after order creation
              }
            }
          );

          if (confirmError) {
            throw new Error(`Payment confirmation failed: ${confirmError.message}`);
          }

          console.log("Payment confirmed:", confirmData);
        } catch (confirmationError) {
          console.error("Payment confirmation error:", confirmationError);
          throw new Error("Payment processing failed");
        }
      }

      // Create order after payment is confirmed
      const giftingFee = await getGiftingFee();
      const totalAmount = await getTotalAmount();
      
      console.log("Processing order with gift options:", checkoutData.giftOptions);
      console.log("Using shipping option:", checkoutData.selectedShippingOption);
      
      const order = await createOrder({
        cartItems: cartItems,
        subtotal: cartTotal,
        shippingCost: getShippingCost(),
        taxAmount: getTaxAmount(),
        totalAmount: totalAmount,
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: checkoutData.giftOptions,
        paymentIntentId: paymentIntentId
      });

      // Process order through Zinc API with Amazon Business credentials
      if (paymentIntentId || checkoutData.paymentMethod === "demo") {
        try {
          const zincProducts = cartItems.map(item => ({
            product_id: item.product.product_id,
            quantity: item.quantity
          }));

          const zincOrderRequest = createZincOrderRequest(
            zincProducts,
            checkoutData.shippingInfo,
            checkoutData.shippingInfo,
            checkoutData.paymentMethod,
            checkoutData.giftOptions,
            "amazon",
            checkoutData.paymentMethod === "demo" // is_test = true for demo
          );

          zincOrderRequest.shipping_method = checkoutData.selectedShippingOption.id;
          
          // Add Amazon Business credentials for payment processing
          const amazonCredentialsString = localStorage.getItem('amazonCredentials');
          if (amazonCredentialsString) {
            try {
              const amazonCredentials = JSON.parse(amazonCredentialsString);
              console.log("Using stored Amazon Business credentials for payment");
              
              zincOrderRequest.retailer_credentials = {
                email: amazonCredentials.email,
                password: amazonCredentials.password
              };
            } catch (error) {
              console.error("Error parsing Amazon credentials:", error);
            }
          }

          console.log("Sending Zinc order request:", zincOrderRequest);
          
          const zincOrder = await processOrder(zincOrderRequest);
          
          if (zincOrder) {
            console.log("Zinc order processed successfully:", zincOrder);
            toast.success("Order placed and sent to fulfillment!");
          } else {
            console.warn("Zinc order processing failed, but payment was processed");
            toast.warning("Order placed but fulfillment may be delayed");
          }
        } catch (zincError) {
          console.error("Zinc order processing error:", zincError);
          toast.warning("Order placed successfully, but there may be a delay in fulfillment processing");
        }
      }

      // Clear cart and handle post-purchase flow
      clearCart();
      
      if (paymentIntentId) {
        toast.success("Order placed and payment processed successfully!");
      } else {
        toast.success("Demo order placed successfully!");
      }

      // Show guest signup prompt if user is not logged in
      if (!user) {
        setCompletedOrderNumber(order.order_number);
        setShowGuestSignup(true);
        setTimeout(() => {
          navigate(`/order-confirmation/${order.id}`);
        }, 500);
      } else {
        navigate(`/order-confirmation/${order.id}`);
      }
      
    } catch (error) {
      console.error("Checkout error:", error);
      
      let errorMessage = "Failed to process order. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('payment')) {
          errorMessage = "Payment processing failed. Please check your payment details.";
        } else if (error.message.includes('shipping')) {
          errorMessage = "Shipping validation failed. Please check your address.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if cart is empty
  React.useEffect(() => {
    if (cartItems.length === 0 && !isValidatingCart) {
      toast.error("Your cart is empty");
      navigate("/marketplace");
    }
  }, [cartItems.length, navigate, isValidatingCart]);

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <CheckoutHeader title="Checkout" />

      {/* Cart Validation Status - Informational Only */}
      {isValidatingCart && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">Validating cart items...</p>
        </div>
      )}

      {cartValidation && cartValidation.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700 font-medium">Cart Warnings (you can still proceed):</p>
          <ul className="text-sm text-yellow-600 mt-1">
            {cartValidation.warnings.map((warning: string, index: number) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

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
                totalAmount={cartTotal + getShippingCost() + getTaxAmount()}
                cartItems={cartItems}
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
