
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Gift, Info, Truck, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";
import GiftOptionsForm from "./GiftOptionsForm";
import ShippingOptionsForm from "./ShippingOptionsForm";
import GiftScheduling, { GiftSchedulingOptions } from "./GiftScheduling";

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface GiftOptions {
  isGift: boolean;
  recipientName: string;
  giftMessage: string;
  giftWrapping: boolean;
}

interface CheckoutData {
  shippingInfo: ShippingInfo;
  giftOptions: GiftOptions;
  giftScheduling: GiftSchedulingOptions;
  shippingMethod: string;
  paymentMethod: string;
}

const CheckoutPage = () => {
  const { cartItems, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    shippingInfo: {
      name: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States"
    },
    giftOptions: {
      isGift: false,
      recipientName: "",
      giftMessage: "",
      giftWrapping: false
    },
    giftScheduling: {
      scheduleDelivery: false,
      sendGiftMessage: false
    },
    shippingMethod: "standard",
    paymentMethod: "card"
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
    
    // Pre-fill with user data if available
    if (user) {
      setCheckoutData(prev => ({
        ...prev,
        shippingInfo: {
          ...prev.shippingInfo,
          name: user.user_metadata?.name || "",
          email: user.email || ""
        }
      }));
    }
  }, [cartItems.length, navigate, user]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleUpdateShippingInfo = (data: Partial<ShippingInfo>) => {
    setCheckoutData(prev => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        ...data
      }
    }));
  };

  const handleUpdateGiftOptions = (data: Partial<GiftOptions>) => {
    setCheckoutData(prev => ({
      ...prev,
      giftOptions: {
        ...prev.giftOptions,
        ...data
      }
    }));
  };

  const handleUpdateGiftScheduling = (data: GiftSchedulingOptions) => {
    setCheckoutData(prev => ({
      ...prev,
      giftScheduling: data
    }));
  };

  const handleShippingMethodChange = (method: string) => {
    setCheckoutData(prev => ({
      ...prev,
      shippingMethod: method
    }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setCheckoutData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

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

  const canProceedToPayment = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  const canPlaceOrder = () => {
    return activeTab === "payment" && canProceedToPayment();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" asChild>
          <a href="/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </a>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="shipping" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Shipping</span>
              </TabsTrigger>
              <TabsTrigger value="gift" className="flex items-center gap-2" disabled={!canProceedToPayment()}>
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Gift Options</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2" disabled={!canProceedToPayment()}>
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2" disabled={!canProceedToPayment()}>
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payment</span>
              </TabsTrigger>
            </TabsList>

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
                  onClick={() => setActiveTab("gift")} 
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
                <Button variant="outline" onClick={() => setActiveTab("shipping")}>
                  Back to Shipping
                </Button>
                <Button onClick={() => setActiveTab("schedule")}>
                  Continue to Scheduling
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="schedule" className="space-y-6">
              <GiftScheduling
                giftScheduling={checkoutData.giftScheduling}
                onUpdate={handleUpdateGiftScheduling}
              />
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("gift")}>
                  Back to Gift Options
                </Button>
                <Button onClick={() => setActiveTab("payment")}>
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <div className="rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="card-payment" 
                      name="payment-method"
                      checked={checkoutData.paymentMethod === "card"}
                      onChange={() => handlePaymentMethodChange("card")}
                      className="mr-2"
                    />
                    <label htmlFor="card-payment" className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit/Debit Card
                    </label>
                  </div>
                  
                  {/* Card payment form would go here in a real implementation */}
                  <div className="pl-6 text-sm text-muted-foreground flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    For demo purposes, clicking "Place Order" will simulate payment
                  </div>
                </div>
                
                {/* Additional payment methods would be added here */}
                
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setActiveTab("schedule")}>
                    Back to Scheduling
                  </Button>
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || !canPlaceOrder()}
                  >
                    {isProcessing ? "Processing..." : "Place Order"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
