
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { useProfile } from "@/contexts/profile/ProfileContext";

export interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CheckoutData {
  shippingInfo: ShippingInfo;
  shippingMethod: string;
  paymentMethod: string;
}

export const useCheckoutState = () => {
  const { cartItems } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    shippingInfo: {
      name: "",
      email: "",
      address: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States"
    },
    shippingMethod: "standard",
    paymentMethod: "card"
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems.length, navigate]);

  // Pre-fill with user data when available
  useEffect(() => {
    if (user && profile) {
      console.log("Pre-filling checkout state with user/profile data:", { user: user.id, profile });
      
      setCheckoutData(prev => {
        const updatedShippingInfo = {
          ...prev.shippingInfo,
          name: profile.name || user.user_metadata?.name || prev.shippingInfo.name,
          email: profile.email || user.email || prev.shippingInfo.email
        };

        // Pre-fill shipping address if available in profile
        if (profile.shipping_address) {
          const address = profile.shipping_address;
          console.log("Found shipping address in profile, pre-filling:", address);
          
          updatedShippingInfo.address = address.address_line1 || address.street || prev.shippingInfo.address;
          updatedShippingInfo.addressLine2 = address.address_line2 || prev.shippingInfo.addressLine2;
          updatedShippingInfo.city = address.city || prev.shippingInfo.city;
          updatedShippingInfo.state = address.state || prev.shippingInfo.state;
          updatedShippingInfo.zipCode = address.zip_code || address.zipCode || prev.shippingInfo.zipCode;
          updatedShippingInfo.country = address.country || prev.shippingInfo.country;
        }

        return {
          ...prev,
          shippingInfo: updatedShippingInfo
        };
      });
    }
  }, [user, profile]);

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

  const handlePaymentMethodChange = (method: string) => {
    setCheckoutData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };
  
  const canPlaceOrder = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return activeTab === "payment" && name && email && address && city && state && zipCode;
  };

  const getShippingCost = () => {
    return 6.99; // Flat shipping rate
  };

  return {
    activeTab,
    isProcessing,
    checkoutData,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost
  };
};
