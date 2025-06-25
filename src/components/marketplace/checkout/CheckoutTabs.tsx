
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAdaptiveCheckout } from "./useAdaptiveCheckout";
import { useCheckoutState } from "./useCheckoutState";
import ShippingOptionsForm from "./ShippingOptionsForm";
import PaymentSection from "./PaymentSection";
import GiftOptionsForm from "./GiftOptionsForm";
import UnifiedDeliverySection from "./UnifiedDeliverySection";
import GiftScheduleForm from "./GiftScheduleForm";
import { toast } from "sonner";

const CheckoutTabs: React.FC = () => {
  const { cartItems, cartGroups, clearCart } = useCart();
  const { adaptiveFlow } = useAdaptiveCheckout();
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

  // Determine if we have any gifts in the cart
  const hasGifts = cartGroups.some(group => group.connectionId !== null);

  // Determine tabs based on cart contents
  const getTabsForCheckout = () => {
    const baseTabs = [
      { id: 'shipping', label: 'Shipping', icon: '📦' },
      { id: 'payment', label: 'Payment', icon: '💳' }
    ];

    // Add gift options if there are gifts
    if (hasGifts) {
      baseTabs.splice(1, 0, { id: 'gift-options', label: 'Gift Options', icon: '🎁' });
    }

    return baseTabs;
  };

  const tabs = getTabsForCheckout();

  const handlePlaceOrder = async (paymentIntentId?: string) => {
    setIsProcessing(true);
    try {
      // Demo order processing
      console.log('Placing order with:', {
        checkoutData,
        paymentIntentId,
        cartGroups
      });
      
      toast.success('Order placed successfully!');
      clearCart();
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1].id);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) + getShippingCost();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Checkout</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.id === 'shipping' && (
                <ShippingOptionsForm
                  selectedMethod={checkoutData.shippingMethod}
                  onSelect={handleShippingMethodChange}
                  shippingOptions={checkoutData.shippingOptions}
                  isLoading={isLoadingShipping}
                />
              )}
              {tab.id === 'gift-options' && (
                <GiftOptionsForm
                  giftOptions={{
                    isGift: checkoutData.giftOptions.isGift,
                    recipientName: '',
                    giftMessage: checkoutData.giftOptions.giftMessage,
                    giftWrapping: false
                  }}
                  onUpdate={(options) => handleGiftOptionsChange({
                    isGift: options.isGift,
                    giftMessage: options.giftMessage || ''
                  })}
                />
              )}
              {tab.id === 'payment' && (
                <PaymentSection
                  paymentMethod={checkoutData.paymentMethod}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  onPlaceOrder={handlePlaceOrder}
                  isProcessing={isProcessing}
                  canPlaceOrder={canPlaceOrder()}
                  onPrevious={handlePrevious}
                  totalAmount={totalAmount}
                  cartItems={cartItems}
                  shippingInfo={checkoutData.shippingInfo}
                  giftOptions={checkoutData.giftOptions}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CheckoutTabs;
