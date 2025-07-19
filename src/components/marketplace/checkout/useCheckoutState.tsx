
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

  // Pre-fill with user data when available (only for empty fields)
  useEffect(() => {
    if (user && profile) {
      console.log("Pre-filling checkout state with user/profile data:", { user: user.id, profile });
      
      // State abbreviation to full name mapping
      const stateMapping: Record<string, string> = {
        'CA': 'California',
        'NY': 'New York',
        'TX': 'Texas',
        'FL': 'Florida',
        'AL': 'Alabama',
        'AK': 'Alaska',
        'AZ': 'Arizona',
        'AR': 'Arkansas',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DE': 'Delaware',
        'GA': 'Georgia',
        'HI': 'Hawaii',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'IA': 'Iowa',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'ME': 'Maine',
        'MD': 'Maryland',
        'MA': 'Massachusetts',
        'MI': 'Michigan',
        'MN': 'Minnesota',
        'MS': 'Mississippi',
        'MO': 'Missouri',
        'MT': 'Montana',
        'NE': 'Nebraska',
        'NV': 'Nevada',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'OR': 'Oregon',
        'PA': 'Pennsylvania',
        'RI': 'Rhode Island',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'UT': 'Utah',
        'VT': 'Vermont',
        'VA': 'Virginia',
        'WA': 'Washington',
        'WV': 'West Virginia',
        'WI': 'Wisconsin',
        'WY': 'Wyoming'
      };

      // Country abbreviation to full name mapping
      const countryMapping: Record<string, string> = {
        'US': 'United States',
        'USA': 'United States',
      };
      
      setCheckoutData(prev => {
        const updatedShippingInfo = {
          ...prev.shippingInfo,
          // Only pre-fill if current value is empty
          name: prev.shippingInfo.name || profile.name || user.user_metadata?.name || "",
          email: prev.shippingInfo.email || profile.email || user.email || ""
        };

        // Pre-fill shipping address if available in profile and fields are empty
        if (profile.shipping_address) {
          const address = profile.shipping_address;
          console.log("Found shipping address in profile, pre-filling empty fields:", address);
          
          // Only pre-fill empty fields to preserve user input
          updatedShippingInfo.address = prev.shippingInfo.address || address.address_line1 || address.street || "";
          updatedShippingInfo.addressLine2 = prev.shippingInfo.addressLine2 || address.address_line2 || "";
          updatedShippingInfo.city = prev.shippingInfo.city || address.city || "";
          
          // Map state abbreviation to full name
          const mappedState = address.state ? (stateMapping[address.state] || address.state) : "";
          updatedShippingInfo.state = prev.shippingInfo.state || mappedState;
          
          updatedShippingInfo.zipCode = prev.shippingInfo.zipCode || address.zip_code || address.zipCode || "";
          
          // Map country abbreviation to full name
          const mappedCountry = address.country ? (countryMapping[address.country] || address.country) : "United States";
          updatedShippingInfo.country = prev.shippingInfo.country || mappedCountry;
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
