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

  // Validate cart on component mount and when cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCart();
    }
  }, [cartItems]);

  const validateCart = async () => {
    setIsValidatingCart(true);
    
    try {
      // Validate cart data structure
      const validation = validateCartData(cartItems);
      
      if (!validation.isValid) {
        toast.error("Cart validation failed", {
          description: `${validation.errors.length} issues found. Please review your cart.`
        });
        
        // Remove invalid items
        validation.invalidItems.forEach(item => {
          removeFromCart(item.product.product_id);
        });
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn("Cart validation warnings:", validation.warnings);
      }

      // Check product availability
      const availability = await validateProductAvailability(cartItems);
      const unavailableItems = availability.filter(item => !item.available);
      const priceChangedItems = availability.filter(item => item.price_changed);

      if (unavailableItems.length > 0) {
        toast.error("Some items are no longer available", {
          description: `${unavailableItems.length} items have been removed from your cart`
        });
        
        // Remove unavailable items
        unavailableItems.forEach(item => {
          removeFromCart(item.product_id);
        });
      }

      if (priceChangedItems.length > 0) {
        toast.warning("Price updates detected", {
          description: `${priceChangedItems.length} items have updated prices`
        });
        
        // Update cart with new prices
        const updatedCart = updateCartItemPrices(cartItems, availability);
        // Note: In a real implementation, you'd update the cart context here
      }

      setCartValidation(validation);
    } catch (error) {
      console.error("Cart validation error:", error);
      toast.error("Unable to validate cart", {
        description: "Please try refreshing the page"
      });
    } finally {
      setIsValidatingCart(false);
    }
  };

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

  const handlePlaceOrder = async (paymentIntentId?: string) => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!checkoutData.selectedShippingOption) {
      toast.error("Please select a shipping method");
      return;
    }

    // Validate cart before proceeding
    if (isValidatingCart) {
      toast.error("Please wait while we validate your cart");
      return;
    }

    if (cartValidation && !cartValidation.isValid) {
      toast.error("Please resolve cart issues before placing order");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Re-validate cart one more time before checkout
      const finalValidation = validateCartData(cartItems);
      if (!finalValidation.isValid) {
        throw new Error("Cart validation failed during checkout");
      }

      const giftingFee = await getGiftingFee();
      const totalAmount = await getTotalAmount();
      
      // Log gift options being processed
      console.log("Processing order with gift options:", checkoutData.giftOptions);
      console.log("Using shipping option:", checkoutData.selectedShippingOption);
      
      // Create order in database with payment intent ID if provided
      const order = await createOrder({
        cartItems: finalValidation.validItems,
        subtotal: cartTotal,
        shippingCost: getShippingCost(),
        taxAmount: getTaxAmount(),
        totalAmount: totalAmount,
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: checkoutData.giftOptions,
        paymentIntentId: paymentIntentId
      });

      // If we have a payment intent, confirm the payment
      if (paymentIntentId) {
        try {
          const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
            'confirm-payment',
            {
              body: {
                payment_intent_id: paymentIntentId,
                order_id: order.id
              }
            }
          );

          if (confirmError) {
            throw new Error(`Payment confirmation failed: ${confirmError.message}`);
          }

          console.log("Payment confirmed:", confirmData);
        } catch (confirmationError) {
          console.error("Payment confirmation error:", confirmationError);
          // Don't fail the entire order - it was created successfully
          toast.warning("Order created but payment confirmation had issues");
        }
      }

      // Process order through Zinc API with error handling (if not demo mode)
      if (paymentIntentId) {
        try {
          const zincProducts = finalValidation.validItems.map(item => ({
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
        } catch (zincError) {
          console.error("Zinc order processing error:", zincError);
          // Don't fail the entire checkout - order was created successfully
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
        // Still navigate to confirmation page
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
        } else if (error.message.includes('validation')) {
          errorMessage = "Cart validation failed. Please review your items.";
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

      {/* Cart Validation Status */}
      {isValidatingCart && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">Validating cart items...</p>
        </div>
      )}

      {cartValidation && cartValidation.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700 font-medium">Cart Warnings:</p>
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
                canPlaceOrder={Boolean(canPlaceOrder()) && !isValidatingCart}
                onPrevious={() => handleTabChange("schedule")}
                totalAmount={cartTotal + getShippingCost() + getTaxAmount()}
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
