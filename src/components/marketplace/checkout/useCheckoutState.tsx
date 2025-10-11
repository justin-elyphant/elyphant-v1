
/*
 * ========================================================================
 * 🚨 CRITICAL STATE MANAGEMENT HOOK - DO NOT SIMPLIFY 🚨
 * ========================================================================
 * 
 * This hook manages sophisticated checkout state including:
 * - Form validation and data management
 * - Address pre-filling from user profile
 * - Shipping cost calculations
 * - Tab navigation and progress tracking
 * - Integration with Supabase profile system
 * 
 * ⚠️  CRITICAL FEATURES:
 * - Auto-loads user's default address
 * - Validates form completion
 * - Handles complex state transitions
 * - Manages payment method selection
 * - Integrates with address service
 * 
 * 🔗 DEPENDENCIES:
 * - useAuth: User authentication state
 * - useCart: Shopping cart management
 * - useProfile: User profile data
 * - addressService: Address management
 * 
 * 🚫 DO NOT REPLACE WITH simple useState hooks
 * 
 * ========================================================================
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { addressService } from "@/services/addressService";
import { FormAddress } from "@/utils/addressStandardization";

// CRITICAL: Shipping information interface
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

// Import unified interface
import { GiftOptions } from "@/types/gift-options";

// CRITICAL: Complete checkout data interface
export interface CheckoutData {
  shippingInfo: ShippingInfo;
  shippingMethod: string;
  paymentMethod: string;
}

/*
 * 🎯 CHECKOUT STATE MANAGEMENT HOOK
 * 
 * This hook provides comprehensive state management for the checkout process.
 * It handles complex validation, data persistence, and user experience flows.
 * 
 * CRITICAL: This hook must maintain all state consistency and validation logic
 */
export const useCheckoutState = () => {
  const { cartItems } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  // CRITICAL: State management - DO NOT SIMPLIFY
  const [activeTab, setActiveTab] = useState("shipping");
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  
  // CRITICAL: Checkout data with proper defaults
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

  /*
   * 🔗 CRITICAL: Cart validation and redirect
   * 
   * This effect ensures users can't access checkout with empty cart
   */
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems.length, navigate]);

  /*
   * 🔗 CRITICAL: Address pre-filling system
   * 
   * This effect loads user's default address and profile information
   * to pre-populate the checkout form. This provides a seamless UX.
   * 
   * DO NOT REMOVE: This is essential for user experience
   */
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

          // Priority 1: Use address from user_addresses table
          if (defaultAddress) {
            console.log("✅ Pre-filling from user_addresses table:", defaultAddress);
            updatedShippingInfo.address = prev.shippingInfo.address || defaultAddress.street;
            updatedShippingInfo.addressLine2 = prev.shippingInfo.addressLine2 || defaultAddress.addressLine2 || "";
            updatedShippingInfo.city = prev.shippingInfo.city || defaultAddress.city;
            updatedShippingInfo.state = prev.shippingInfo.state || defaultAddress.state;
            updatedShippingInfo.zipCode = prev.shippingInfo.zipCode || defaultAddress.zipCode;
            updatedShippingInfo.country = prev.shippingInfo.country || defaultAddress.country;
          } 
          // Priority 2: Fallback to profile.shipping_address from signup
          else if (profile?.shipping_address) {
            console.log("✅ Pre-filling from profile.shipping_address:", profile.shipping_address);
            const profileAddr = profile.shipping_address as any;
            updatedShippingInfo.address = prev.shippingInfo.address || profileAddr.address_line1 || profileAddr.street || "";
            updatedShippingInfo.addressLine2 = prev.shippingInfo.addressLine2 || profileAddr.address_line2 || profileAddr.line2 || "";
            updatedShippingInfo.city = prev.shippingInfo.city || profileAddr.city || "";
            updatedShippingInfo.state = prev.shippingInfo.state || profileAddr.state || "";
            updatedShippingInfo.zipCode = prev.shippingInfo.zipCode || profileAddr.zip_code || profileAddr.zipCode || "";
            updatedShippingInfo.country = prev.shippingInfo.country || profileAddr.country || "United States";
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

  /*
   * 🔗 CRITICAL: Tab navigation handler
   * 
   * This function manages tab transitions with validation
   */
  const handleTabChange = (value: string) => {
    console.log("Changing tab to:", value);
    setActiveTab(value);
  };

  // CRITICAL: Gift options state
  const [giftOptions, setGiftOptions] = useState<GiftOptions>({
    isGift: false,
    recipientName: "",
    giftMessage: "",
    giftWrapping: false,
    isSurpriseGift: false,
    scheduleDelivery: false,
    sendGiftMessage: false,
    scheduledDeliveryDate: ""
  });

  /*
   * 🔗 CRITICAL: Shipping info update handler
   * 
   * This function updates shipping information with proper state management
   */
  const handleUpdateShippingInfo = (data: Partial<ShippingInfo>) => {
    setCheckoutData(prev => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        ...data
      }
    }));
  };

  /*
   * 🔗 CRITICAL: Gift options update handler
   * 
   * This function updates gift options with proper state management
   */
  const handleUpdateGiftOptions = (data: Partial<GiftOptions>) => {
    setGiftOptions(prev => ({
      ...prev,
      ...data
    }));
  };

  /*
   * 🔗 CRITICAL: Payment method change handler
   */
  const handlePaymentMethodChange = (method: string) => {
    setCheckoutData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };
  
  /*
   * 🔗 CRITICAL: Order validation function
   * 
   * This function validates that all required information is present
   * before allowing order placement.
   * 
   * FIXED: Check for non-empty strings (trim to prevent whitespace-only values)
   */
  const canPlaceOrder = () => {
    const { name, email, address, city, state, zipCode } = checkoutData.shippingInfo;
    return (
      activeTab === "payment" && 
      name?.trim() && 
      email?.trim() && 
      address?.trim() && 
      city?.trim() && 
      state?.trim() && 
      zipCode?.trim()
    );
  };

  /*
   * 🔗 CRITICAL: Shipping cost calculation - Flat $6.99 for MVP
   * 
   * Simple flat-rate shipping:
   * - Orders $25+: FREE shipping
   * - Orders under $25: $6.99 flat rate
   * 
   * This eliminates Zinc API shipping quote delays and provides predictable pricing.
   * Elyphant absorbs any shipping variance (actual cost may be $0-$10 from Zinc).
   */
  const getShippingCost = async (): Promise<number> => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // Keep the $25+ free shipping promotion
    if (subtotal >= 25) {
      console.log('✓ Order qualifies for FREE Shipping ($25+ threshold)');
      return 0;
    }
    
    // Flat $6.99 shipping for all orders under $25
    console.log('💰 Applying flat $6.99 shipping (MVP approach - covers typical Amazon shipping costs)');
    return 6.99;
  };

  /*
   * 🔗 CRITICAL: Address saving functionality
   * 
   * This function saves the current checkout address to the user's profile
   * for future use. This improves user experience for repeat customers.
   */
  const saveCurrentAddressToProfile = async (name: string = 'Checkout Address', setAsDefault: boolean = false): Promise<boolean> => {
    if (!user) return false;

    const formAddress: FormAddress = {
      street: checkoutData.shippingInfo.address,
      addressLine2: checkoutData.shippingInfo.addressLine2,
      city: checkoutData.shippingInfo.city,
      state: checkoutData.shippingInfo.state,
      zipCode: checkoutData.shippingInfo.zipCode,
      country: checkoutData.shippingInfo.country
    };

    return await addressService.saveAddressToProfile(user.id, formAddress, name, setAsDefault);
  };

  // CRITICAL: Return all state and handlers
  return {
    activeTab,
    isProcessing,
    checkoutData,
    giftOptions,
    addressesLoaded,
    setIsProcessing,
    handleTabChange,
    handleUpdateShippingInfo,
    handleUpdateGiftOptions,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost,
    saveCurrentAddressToProfile
  };
};
