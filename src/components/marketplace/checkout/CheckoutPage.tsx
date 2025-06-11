
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/services/orderService";
import { createZincOrderRequest } from "@/components/marketplace/zinc/services/orderProcessingService";
import { getTransparentPricing } from "@/utils/transparentPricing";
import { validateCartData, validateProductAvailability } from "@/utils/validateCartData";

// Import our components
import CheckoutHeader from "./CheckoutHeader";
import CheckoutTabs from "./CheckoutTabs";
import PaymentSection from "./PaymentSection";
import GiftScheduleForm from "./GiftScheduleForm";
import GuestSignupPrompt from "./GuestSignupPrompt";
import { useCheckoutState } from "./useCheckoutState";
import RecipientAssignmentSection from "@/components/cart/RecipientAssignmentSection";

// Re-use existing components
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";
import ShippingOptionsForm from "./ShippingOptionsForm";

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart, removeFromCart, deliveryGroups } = useCart();
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

  // Cart validation - now blocking for critical issues
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCartAndBlock();
    }
  }, [cartItems]);

  const validateCartAndBlock = async () => {
    setIsValidatingCart(true);
    
    try {
      const validation = validateCartData(cartItems);
      
      if (!validation.isValid) {
        // Block checkout for invalid items
        validation.invalidItems.forEach(item => {
          removeFromCart(item.product.product_id);
          toast.error(`Removed invalid item: ${item.product.name || 'Unknown item'}`);
        });
        
        if (validation.validItems.length === 0) {
          toast.error("Cart is empty after removing invalid items");
          navigate("/marketplace");
          return;
        }
      }

      // Check product availability
      const availability = await validateProductAvailability(cartItems);
      const unavailableItems = availability.filter(item => !item.available);
      
      if (unavailableItems.length > 0) {
        unavailableItems.forEach(item => {
          removeFromCart(item.product_id);
          toast.error(`Item no longer available and was removed from cart`);
        });
      }

      setCartValidation(validation);
    } catch (error) {
      console.error("Cart validation error:", error);
      toast.error("Unable to validate cart items. Please refresh and try again.");
    } finally {
      setIsValidatingCart(false);
    }
  };

  const canProceedToRecipients = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode && !isLoadingShipping;
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

    if (!checkoutData.selectedShippingOption && checkoutData.paymentMethod !== 'demo') {
      toast.error("Please select a shipping method");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Confirm payment first if payment intent provided
      if (paymentIntentId) {
        const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
          'confirm-payment',
          {
            body: {
              payment_intent_id: paymentIntentId
            }
          }
        );

        if (confirmError) {
          throw new Error(`Payment confirmation failed: ${confirmError.message}`);
        }

        console.log("Payment confirmed:", confirmData);
      }

      // Create order with delivery groups
      const giftingFee = await getGiftingFee();
      const totalAmount = await getTotalAmount();
      
      const order = await createOrder({
        cartItems: cartItems,
        subtotal: cartTotal,
        shippingCost: getShippingCost(),
        taxAmount: getTaxAmount(),
        totalAmount: totalAmount,
        shippingInfo: checkoutData.shippingInfo,
        giftOptions: checkoutData.giftOptions,
        paymentIntentId: paymentIntentId,
        deliveryGroups: deliveryGroups
      });

      // Process fulfillment through Zinc (with centralized Amazon credentials)
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
            checkoutData.paymentMethod === "demo"
          );

          if (checkoutData.selectedShippingOption) {
            zincOrderRequest.shipping_method = checkoutData.selectedShippingOption.id;
          }
          
          console.log("Processing order through Zinc API");
          
          const { data: zincResult, error: zincError } = await supabase.functions.invoke(
            'process-zinc-order',
            {
              body: {
                orderRequest: zincOrderRequest,
                orderId: order.id,
                paymentIntentId: paymentIntentId
              }
            }
          );

          if (zincError || !zincResult?.success) {
            console.error("Zinc processing error:", zincError);
            
            if (zincResult?.requiresAdminSetup) {
              toast.warning("Order placed successfully, but fulfillment requires admin setup.");
            } else if (zincResult?.invalidCredentials) {
              toast.warning("Order placed successfully, but there's an issue with fulfillment credentials.");
            } else {
              toast.warning("Order placed successfully, but fulfillment may be delayed.");
            }
          } else {
            console.log("Zinc order processed successfully:", zincResult.zincOrderId);
            toast.success("Order placed and sent for fulfillment!");
          }
        } catch (zincError) {
          console.error("Zinc order processing error:", zincError);
          toast.warning("Order placed successfully, but fulfillment processing encountered an issue.");
        }
      }

      // Clear cart and navigate
      clearCart();
      
      if (paymentIntentId) {
        toast.success("Order placed and payment processed successfully!");
      } else {
        toast.success("Demo order placed successfully!");
      }

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

  // Redirect if cart is empty after validation
  React.useEffect(() => {
    if (cartItems.length === 0 && !isValidatingCart) {
      toast.error("Your cart is empty");
      navigate("/marketplace");
    }
  }, [cartItems.length, navigate, isValidatingCart]);

  if (cartItems.length === 0 && !isValidatingCart) {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            canProceedToRecipients={Boolean(canProceedToRecipients())}
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
                  onClick={() => handleTabChange("recipients")} 
                  disabled={!canProceedToRecipients()}
                >
                  Continue to Recipients
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-6">
              <RecipientAssignmentSection />
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline"
                  onClick={() => handleTabChange("shipping")}
                >
                  Back to Shipping
                </Button>
                <Button 
                  onClick={() => handleTabChange("schedule")}
                  disabled={!canProceedToRecipients()}
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
                  onClick={() => handleTabChange("recipients")}
                >
                  Back to Recipients
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
                shippingInfo={checkoutData.shippingInfo}
                giftOptions={checkoutData.giftOptions}
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
