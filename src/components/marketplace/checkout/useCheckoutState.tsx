
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";

export interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface GiftOptions {
  isGift: boolean;
  giftMessage: string;
  scheduledDeliveryDate?: string;
  isSurpriseGift: boolean;
}

export interface CheckoutData {
  shippingInfo: ShippingInfo;
  shippingMethod: string;
  paymentMethod: string;
  giftOptions: GiftOptions;
}

export const useCheckoutState = () => {
  const { cartItems } = useCart();
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
    shippingMethod: "standard",
    paymentMethod: "card",
    giftOptions: {
      isGift: false,
      giftMessage: "",
      isSurpriseGift: false
    }
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
    console.log("Changing tab to:", value);
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

  const handleGiftOptionsChange = (options: Partial<GiftOptions>) => {
    setCheckoutData(prev => ({
      ...prev,
      giftOptions: {
        ...prev.giftOptions,
        ...options
      }
    }));
  };
  
  const canProceedToPayment = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  const canProceedToSchedule = () => {
    return activeTab === "payment" && canProceedToPayment();
  };

  const canPlaceOrder = () => {
    return activeTab === "schedule" && canProceedToPayment();
  };

  return {
    activeTab,
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handleShippingMethodChange,
    handlePaymentMethodChange,
    handleGiftOptionsChange,
    canProceedToPayment,
    canProceedToSchedule,
    canPlaceOrder
  };
};
