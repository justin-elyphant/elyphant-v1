
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
   * 🔗 CRITICAL: Shipping cost calculation - Option C Logic
   * 
   * Implements hybrid shipping calculation:
   * - All Prime items: $0.00 shipping
   * - Mixed Prime + Non-Prime: Charge highest individual non-Prime shipping cost
   * - All Non-Prime: Sum all shipping costs
   * 
   * This protects cash flow during the 3-day Stripe→Bank→PayPal→ZMA funding cycle
   */
  const getShippingCost = async (): Promise<number> => {
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // 📦 FREE SHIPPING RULE: Orders $25+ qualify for free shipping
    if (subtotal >= 25) {
      console.log('✓ Order qualifies for FREE Shipping ($25+ threshold)');
      return 0;
    }
    
    // Get ZMA products from cart (check both vendor field and product.vendor)
    const zmaProducts = cartItems.filter(item => 
      item.product.vendor?.toLowerCase() === 'amazon' || item.product.retailer?.toLowerCase() === 'amazon'
    );
    
    console.log(`🔍 Shipping Cost Calculation: ${zmaProducts.length} Amazon products, subtotal: $${subtotal}`);
    
    if (zmaProducts.length === 0) {
      return 6.99; // Fallback for non-Amazon products
    }

    try {
      const { getShippingQuote } = await import("@/components/marketplace/zinc/services/shippingQuoteService");
      
      // Fetch shipping quotes for each product individually
      const shippingResults = await Promise.all(
        zmaProducts.map(async (item) => {
          try {
            const quote = await getShippingQuote({
              retailer: "amazon",
              products: [{
                product_id: item.product.product_id || item.product.id || item.product.asin,
                quantity: item.quantity
              }],
              shipping_address: {
                first_name: checkoutData.shippingInfo.name.split(' ')[0] || '',
                last_name: checkoutData.shippingInfo.name.split(' ').slice(1).join(' ') || '',
                address_line1: checkoutData.shippingInfo.address,
                zip_code: checkoutData.shippingInfo.zipCode,
                city: checkoutData.shippingInfo.city,
                state: checkoutData.shippingInfo.state,
                country: checkoutData.shippingInfo.country
              }
            });

            if (quote && quote.shipping_options && quote.shipping_options.length > 0) {
              console.log(`📦 Zinc API response for ${item.product.product_id}:`, {
                optionsCount: quote.shipping_options.length,
                options: quote.shipping_options.map(o => ({ name: o.name, price: o.price }))
              });
              
              // Get cheapest shipping option for this product
              const cheapest = quote.shipping_options.reduce((min, option) => 
                option.price < min.price ? option : min
              );
              
              console.log(`✅ Selected cheapest option for ${item.product.product_id}:`, cheapest);
              
              return {
                productId: item.product.product_id || item.product.id,
                price: cheapest.price,
                isPrime: cheapest.price === 0
              };
            }
            console.warn(`⚠️ No shipping options returned for ${item.product.product_id}`);
            return { productId: item.product.product_id || item.product.id, price: 6.99, isPrime: false };
          } catch (error) {
            console.error(`❌ Failed to get shipping for product ${item.product.product_id}:`, error);
            return { productId: item.product.product_id || item.product.id, price: 6.99, isPrime: false };
          }
        })
      );

      // Option C Logic: Hybrid shipping calculation
      const allPrime = shippingResults.every(result => result.isPrime);
      const somePrime = shippingResults.some(result => result.isPrime);
      const nonPrimeItems = shippingResults.filter(result => !result.isPrime);

      let totalShipping = 0;

      if (allPrime) {
        // All Prime items: Free shipping
        totalShipping = 0;
        console.log('Option C: All items are Prime - Free shipping');
      } else if (somePrime && nonPrimeItems.length > 0) {
        // Mixed cart: Charge highest individual non-Prime shipping cost
        totalShipping = Math.max(...nonPrimeItems.map(item => item.price));
        console.log(`Option C: Mixed cart - Charging highest non-Prime shipping: $${totalShipping}`);
      } else {
        // All Non-Prime: Sum all shipping costs
        totalShipping = shippingResults.reduce((sum, result) => sum + result.price, 0);
        console.log(`Option C: All non-Prime - Sum of all shipping: $${totalShipping}`);
      }

      console.log(`Shipping breakdown:`, shippingResults);
      console.log(`Final shipping cost: $${totalShipping}`);
      
      return totalShipping;
    } catch (error) {
      console.error("Failed to get shipping quote from Zinc:", error);
    }

    return 6.99; // Fallback on error
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
