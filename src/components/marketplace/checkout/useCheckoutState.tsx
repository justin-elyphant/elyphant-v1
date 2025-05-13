
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
  recipientName: string;
  giftMessage: string;
  giftWrapping: boolean;
}

export interface GiftSchedulingOptions {
  scheduleDelivery: boolean;
  sendGiftMessage: boolean;
  isSurprise?: boolean; // Optional field to maintain compatibility
}

export interface CheckoutData {
  shippingInfo: ShippingInfo;
  giftOptions: GiftOptions;
  giftScheduling: GiftSchedulingOptions;
  shippingMethod: string;
  paymentMethod: string;
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
    // Ensure boolean values for gift scheduling options - explicitly convert all values to booleans
    const updatedData: GiftSchedulingOptions = {
      scheduleDelivery: Boolean(data.scheduleDelivery),
      sendGiftMessage: Boolean(data.sendGiftMessage),
      isSurprise: data.isSurprise !== undefined ? Boolean(data.isSurprise) : undefined
    };
    
    setCheckoutData(prev => ({
      ...prev,
      giftScheduling: updatedData
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
  
  const canProceedToPayment = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return name && email && address && city && state && zipCode;
  };

  const canPlaceOrder = () => {
    return activeTab === "payment" && canProceedToPayment();
  };

  return {
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
  };
};
