import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/services/orderService";
import { createZincOrderRequest } from "@/components/marketplace/zinc/services/orderProcessingService";
import { getTransparentPricing } from "@/utils/transparentPricing";

// Import our components
import CheckoutHeader from "./CheckoutHeader";
import CheckoutTabs from "./CheckoutTabs";
import PaymentSection from "./PaymentSection";
import GiftScheduleForm from "./GiftScheduleForm";
import GuestSignupPrompt from "./GuestSignupPrompt";
import UnifiedDeliverySection from "./UnifiedDeliverySection";
import OrderSummary from "./OrderSummary";
import { useCheckoutState } from "./useCheckoutState";
import { useAdaptiveCheckout } from "./useAdaptiveCheckout";

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart, deliveryGroups } = useCart();
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
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  const { adaptiveFlow, deliveryScenario, getScenarioDescription } = useAdaptiveCheckout();

  // Initialize tab to first available tab in adaptive flow
  useEffect(() => {
    if (adaptiveFlow.tabs.length > 0 && !adaptiveFlow.tabs.includes(activeTab)) {
      handleTabChange(adaptiveFlow.tabs[0]);
    }
  }, [adaptiveFlow.tabs, activeTab, handleTabChange]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate("/marketplace");
    }
  }, [cartItems.length, navigate]);

  const canProceedToNext = (tab: string): boolean => {
    switch (tab) {
      case 'shipping':
        const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
        return !!(name && email && address && city && state && zipCode && !isLoadingShipping);
      case 'delivery':
        return canProceedToNext('shipping');
      case 'recipients':
        return deliveryScenario === 'gift' ? deliveryGroups.length > 0 : true;
      case 'schedule':
        return true;
      default:
        return true;
    }
  };

  const getNextTab = (currentTab: string): string | null => {
    const currentIndex = adaptiveFlow.tabs.indexOf(currentTab);
    return currentIndex < adaptiveFlow.tabs.length - 1 ? adaptiveFlow.tabs[currentIndex + 1] : null;
  };

  const getPreviousTab = (currentTab: string): string | null => {
    const currentIndex = adaptiveFlow.tabs.indexOf(currentTab);
    return currentIndex > 0 ? adaptiveFlow.tabs[currentIndex - 1] : null;
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

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <CheckoutHeader title="Checkout" />

      <div className="mb-4 flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          {getScenarioDescription()}
        </Badge>
        <div className="text-sm text-muted-foreground">
          {adaptiveFlow.tabs.length} step checkout
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            availableTabs={adaptiveFlow.tabs}
            canProceedToNext={canProceedToNext}
          >
            {(adaptiveFlow.tabs.includes('shipping') || adaptiveFlow.tabs.includes('delivery') || adaptiveFlow.tabs.includes('recipients')) && (
              <TabsContent value={adaptiveFlow.tabs.includes('delivery') ? 'delivery' : adaptiveFlow.tabs.includes('shipping') ? 'shipping' : 'recipients'} className="space-y-6">
                <UnifiedDeliverySection
                  scenario={deliveryScenario}
                  shippingInfo={checkoutData.shippingInfo}
                  onUpdateShippingInfo={handleUpdateShippingInfo}
                  selectedShippingMethod={checkoutData.shippingMethod}
                  onShippingMethodChange={handleShippingMethodChange}
                  shippingOptions={checkoutData.shippingOptions}
                  isLoadingShipping={isLoadingShipping}
                />
                
                <div className="flex justify-between mt-6">
                  {getPreviousTab(activeTab) && (
                    <Button 
                      variant="outline"
                      onClick={() => handleTabChange(getPreviousTab(activeTab)!)}
                    >
                      Back
                    </Button>
                  )}
                  {getNextTab(activeTab) && (
                    <Button 
                      onClick={() => handleTabChange(getNextTab(activeTab)!)}
                      disabled={!canProceedToNext(activeTab)}
                      className={!getPreviousTab(activeTab) ? "ml-auto" : ""}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </TabsContent>
            )}

            {adaptiveFlow.tabs.includes('schedule') && (
              <TabsContent value="schedule" className="space-y-6">
                <GiftScheduleForm
                  giftOptions={checkoutData.giftOptions}
                  onUpdate={handleGiftOptionsChange}
                />
                
                <div className="flex justify-between mt-6">
                  {getPreviousTab('schedule') && (
                    <Button 
                      variant="outline"
                      onClick={() => handleTabChange(getPreviousTab('schedule')!)}
                    >
                      Back
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleTabChange('payment')}
                    disabled={!canProceedToNext('schedule')}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </TabsContent>
            )}

            <TabsContent value="payment" className="space-y-6">
              <PaymentSection
                paymentMethod={checkoutData.paymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={Boolean(isProcessing)}
                canPlaceOrder={Boolean(canPlaceOrder())}
                onPrevious={() => {
                  const prevTab = getPreviousTab('payment');
                  if (prevTab) handleTabChange(prevTab);
                }}
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
