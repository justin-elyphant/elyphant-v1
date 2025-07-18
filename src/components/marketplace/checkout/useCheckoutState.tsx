
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { getShippingQuote, ShippingOption } from "@/components/marketplace/zinc/services/shippingQuoteService";

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
  giftMessage: string;
  scheduledDeliveryDate?: string;
  isSurpriseGift: boolean;
}

export interface CheckoutData {
  shippingInfo: ShippingInfo;
  shippingMethod: string;
  paymentMethod: string;
  giftOptions: GiftOptions;
  shippingOptions: ShippingOption[];
  selectedShippingOption: ShippingOption | null;
}

export const useCheckoutState = () => {
  const { cartItems } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
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
    paymentMethod: "card",
    giftOptions: {
      isGift: false,
      giftMessage: "",
      isSurpriseGift: false
    },
    shippingOptions: [],
    selectedShippingOption: null
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

  // Fetch shipping quotes when shipping info is complete
  useEffect(() => {
    const fetchShippingQuotes = async () => {
      const { name, address, city, state, zipCode } = checkoutData.shippingInfo;
      
      if (name && address && city && state && zipCode && cartItems.length > 0) {
        setIsLoadingShipping(true);
        
        try {
          const quoteRequest = {
            retailer: "amazon",
            products: cartItems.map(item => ({
              product_id: item.product.product_id,
              quantity: item.quantity
            })),
            shipping_address: {
              first_name: name.split(' ')[0] || '',
              last_name: name.split(' ').slice(1).join(' ') || '',
              address_line1: address,
              zip_code: zipCode,
              city: city,
              state: state,
              country: checkoutData.shippingInfo.country
            }
          };

          const shippingQuote = await getShippingQuote(quoteRequest);
          
          if (shippingQuote) {
            setCheckoutData(prev => ({
              ...prev,
              shippingOptions: shippingQuote.shipping_options,
              selectedShippingOption: shippingQuote.shipping_options.find(opt => 
                opt.id.includes('prime') || opt.price === 0
              ) || shippingQuote.shipping_options[0]
            }));
          }
        } catch (error) {
          console.error("Failed to fetch shipping quotes:", error);
        } finally {
          setIsLoadingShipping(false);
        }
      }
    };

    fetchShippingQuotes();
  }, [checkoutData.shippingInfo, cartItems]);

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

  const handleShippingMethodChange = (optionId: string) => {
    const selectedOption = checkoutData.shippingOptions.find(opt => opt.id === optionId);
    if (selectedOption) {
      setCheckoutData(prev => ({
        ...prev,
        shippingMethod: optionId,
        selectedShippingOption: selectedOption
      }));
    }
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
  
  const canPlaceOrder = () => {
    return activeTab === "payment" && checkoutData.selectedShippingOption !== null;
  };

  const getShippingCost = () => {
    return checkoutData.selectedShippingOption?.price || 0;
  };

  return {
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
  };
};
