
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { addressService } from "@/services/addressService";
import { FormAddress } from "@/utils/addressStandardization";

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

export interface GiftOptions {
  isGift: boolean;
  recipientName: string;
  giftMessage: string;
  giftWrapping: boolean;
  isSurpriseGift: boolean;
  scheduledDeliveryDate?: string;
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
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  
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

  // Load and pre-fill address data
  useEffect(() => {
    const loadAddressData = async () => {
      if (!user || addressesLoaded) return;

      try {
        // Get default address from address service
        const defaultAddress = await addressService.getDefaultAddress(user.id);
        
        setCheckoutData(prev => {
          const updatedShippingInfo = {
            ...prev.shippingInfo,
            // Pre-fill basic info from user/profile
            name: prev.shippingInfo.name || profile?.name || user.user_metadata?.name || "",
            email: prev.shippingInfo.email || profile?.email || user.email || ""
          };

          // Pre-fill address if available and fields are empty
          if (defaultAddress) {
            console.log("Pre-filling with default address:", defaultAddress);
            updatedShippingInfo.address = prev.shippingInfo.address || defaultAddress.street;
            updatedShippingInfo.addressLine2 = prev.shippingInfo.addressLine2 || "";
            updatedShippingInfo.city = prev.shippingInfo.city || defaultAddress.city;
            updatedShippingInfo.state = prev.shippingInfo.state || defaultAddress.state;
            updatedShippingInfo.zipCode = prev.shippingInfo.zipCode || defaultAddress.zipCode;
            updatedShippingInfo.country = prev.shippingInfo.country || defaultAddress.country;
          }

          return {
            ...prev,
            shippingInfo: updatedShippingInfo
          };
        });

        setAddressesLoaded(true);
      } catch (error) {
        console.error("Error loading address data:", error);
        setAddressesLoaded(true);
      }
    };

    loadAddressData();
  }, [user, profile, addressesLoaded]);

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
    return 6.99; // Fixed shipping rate
  };

  const saveCurrentAddressToProfile = async (name: string = 'Checkout Address', setAsDefault: boolean = false): Promise<boolean> => {
    if (!user) return false;

    const formAddress: FormAddress = {
      street: checkoutData.shippingInfo.address,
      city: checkoutData.shippingInfo.city,
      state: checkoutData.shippingInfo.state,
      zipCode: checkoutData.shippingInfo.zipCode,
      country: checkoutData.shippingInfo.country
    };

    return await addressService.saveAddressToProfile(user.id, formAddress, name, setAsDefault);
  };

  return {
    activeTab,
    isProcessing,
    checkoutData,
    addressesLoaded,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost,
    saveCurrentAddressToProfile
  };
};
