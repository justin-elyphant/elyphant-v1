
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, CreditCard, Truck, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import CheckoutForm from '@/components/marketplace/checkout/CheckoutForm';
import ShippingOptionsForm from '@/components/marketplace/checkout/ShippingOptionsForm';
import PaymentMethodForm from '@/components/payments/PaymentMethodForm';
import GiftOptionsForm from '@/components/marketplace/checkout/GiftOptionsForm';
import OrderSummary from '@/components/marketplace/checkout/OrderSummary';
import { useCheckoutState, ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';

interface EnhancedCheckoutFormProps {
  onCheckoutComplete: (orderData: any) => void;
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({
  onCheckoutComplete
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { cartItems, cartTotal } = useCart();
  const navigate = useNavigate();
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

  // Pre-fill shipping information from profile (only once)
  useEffect(() => {
    if (profile && user && !checkoutData.shippingInfo.name) {
      console.log("Pre-filling checkout form with profile data:", profile);
      
      const shippingUpdate: Partial<ShippingInfo> = {
        name: profile.name || user.user_metadata?.name || "",
        email: profile.email || user.email || ""
      };

      // Pre-fill shipping address from profile if available
      if (profile.shipping_address) {
        const address = profile.shipping_address;
        console.log("Found shipping address in profile:", address);
        console.log("State value:", address.state);
        console.log("Country value:", address.country);
        
        shippingUpdate.address = address.address_line1 || address.street || "";
        shippingUpdate.addressLine2 = address.address_line2 || "";
        shippingUpdate.city = address.city || "";
        // Ensure state is the full state name, not abbreviation
        shippingUpdate.state = address.state === "CA" ? "California" : address.state || "";
        shippingUpdate.zipCode = address.zip_code || address.zipCode || "";
        // Ensure country is the full country name
        shippingUpdate.country = address.country === "US" ? "United States" : (address.country || "United States");
        
        console.log("Shipping update object:", shippingUpdate);
        toast.success("Shipping information pre-filled from your profile");
      }

      handleUpdateShippingInfo(shippingUpdate);
    }
  }, [profile, user]);

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder()) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderData = {
        ...checkoutData,
        shippingCost: getShippingCost(),
        total: getShippingCost() // This would include item costs in a real implementation
      };

      await onCheckoutComplete(orderData);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/cart")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="shipping-options" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Delivery
              </TabsTrigger>
              <TabsTrigger value="gifts" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Gifts
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <CheckoutForm 
                    shippingInfo={checkoutData.shippingInfo} 
                    onUpdate={handleUpdateShippingInfo} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping-options" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShippingOptionsForm
                    selectedMethod={checkoutData.shippingMethod}
                    onSelect={handleShippingMethodChange}
                    shippingOptions={checkoutData.shippingOptions}
                    isLoading={isLoadingShipping}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gifts" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gift Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <GiftOptionsForm
                    giftOptions={checkoutData.giftOptions}
                    onUpdate={handleGiftOptionsChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethodForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate("/cart")}
            >
              Back to Cart
            </Button>
            
            {activeTab === "payment" && (
              <Button 
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder() || isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? "Processing..." : "Place Order"}
              </Button>
            )}
          </div>
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
    </div>
  );
};

export default EnhancedCheckoutForm;
