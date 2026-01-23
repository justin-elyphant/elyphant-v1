
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
  phone: string;  // Required for Zinc/carrier delivery notifications
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
  
  // Registry-style fulfillment: detect if this is a wishlist purchase
  const [isWishlistPurchase, setIsWishlistPurchase] = useState(false);
  const [wishlistOwnerInfo, setWishlistOwnerInfo] = useState<{
    name: string;
    id: string;
    shipping: any;
  } | null>(null);
  
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
      country: "United States",
      phone: ""
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
   * REGISTRY-STYLE: For wishlist purchases, use owner's shipping address
   * 
   * DO NOT REMOVE: This is essential for user experience
   */
  useEffect(() => {
    const loadAddressData = async () => {
      if (addressesLoaded) return;

      // PRIMARY: Check if ALL cart items have wishlist_owner_shipping populated
      const itemsWithOwnerShipping = cartItems.filter(item => item.wishlist_owner_shipping);
      const hasCompleteOwnerShipping = itemsWithOwnerShipping.length > 0 && 
        itemsWithOwnerShipping.length === cartItems.length;
      
      // FALLBACK: All items have wishlist metadata and buyer is NOT the owner
      const itemsWithWishlistId = cartItems.filter(item => item.wishlist_id && item.wishlist_owner_id);
      const hasWishlistMetadata = itemsWithWishlistId.length > 0 && 
        itemsWithWishlistId.length === cartItems.length;
      const buyerIsNotOwner = hasWishlistMetadata && cartItems[0]?.wishlist_owner_id !== user?.id;
      
      // Combined registry detection
      const isRegistryPurchase = hasCompleteOwnerShipping || (hasWishlistMetadata && buyerIsNotOwner);
      
      console.log("🎁 [useCheckoutState] Registry purchase detection:", {
        hasCompleteOwnerShipping,
        hasWishlistMetadata,
        buyerIsNotOwner,
        isRegistryPurchase,
        userId: user?.id,
        ownerId: cartItems[0]?.wishlist_owner_id
      });
      
      if (isRegistryPurchase) {
        // Registry-style fulfillment: use owner's shipping address
        let ownerShipping = cartItems[0]?.wishlist_owner_shipping;
        const ownerName = cartItems[0]?.wishlist_owner_name || 'Gift Recipient';
        const ownerId = cartItems[0]?.wishlist_owner_id || '';
        
        console.log("✅ Detected wishlist purchase - using owner's shipping address (registry-style)");
        
        setIsWishlistPurchase(true);
        setWishlistOwnerInfo({
          name: ownerName,
          id: ownerId,
          shipping: ownerShipping
        });
        
        // If owner shipping is present, pre-fill the form
        if (ownerShipping) {
          setCheckoutData(prev => ({
            ...prev,
            shippingInfo: {
              ...prev.shippingInfo,
              name: ownerName,
              email: prev.shippingInfo.email || user?.email || '',
              address: ownerShipping.address_line1 || ownerShipping.street || '',
              addressLine2: ownerShipping.address_line2 || '',
              city: ownerShipping.city || '',
              state: ownerShipping.state || '',
              zipCode: ownerShipping.zip_code || ownerShipping.zipCode || '',
              country: ownerShipping.country || 'United States'
            }
          }));
        }
        
        setAddressesLoaded(true);
        return;
      }

      // For guests (no user), just initialize with empty form
      if (!user) {
        setAddressesLoaded(true);
        return;
      }

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
  }, [user, profile, addressesLoaded, cartItems]);

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
   * 🔗 CRITICAL: Shipping cost calculation - Flat $6.99 for ALL orders
   * 
   * Simple flat-rate shipping: $6.99 for all orders
   * 
   * This eliminates Zinc API shipping quote delays and provides predictable pricing.
   * Elyphant absorbs any shipping variance (actual cost may be $0-$10 from Zinc).
   */
  const getShippingCost = async (): Promise<number> => {
    console.log('💰 Applying flat $6.99 shipping for all orders');
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
    isWishlistPurchase,
    wishlistOwnerInfo,
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
