/**
 * ================================
 * useLocationBasedCheckout Hook
 * ================================
 * 
 * Advanced checkout hook that integrates UnifiedLocationService with 
 * UnifiedPaymentService for intelligent shipping and payment processing.
 * 
 * FEATURES:
 * - Real-time shipping cost calculation
 * - Address validation and delivery zone checking
 * - Multi-destination shipping optimization
 * - Integration with existing payment flow
 * - Location-based tax calculation support
 */

import { useState, useEffect, useCallback } from 'react';
import { unifiedLocationService, ShippingOptimization, ShippingOption } from '@/services/location/UnifiedLocationService';
import { unifiedPaymentService } from '@/services/payment/UnifiedPaymentService';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { toast } from 'sonner';

export interface LocationBasedCheckoutState {
  shippingAddress: StandardizedAddress | null;
  addressValidation: any | null;
  shippingOptimization: ShippingOptimization | null;
  selectedShippingOption: ShippingOption | null;
  shippingCost: number;
  isAddressValid: boolean;
  isCalculatingShipping: boolean;
  isValidatingAddress: boolean;
  estimatedDeliveryDate: Date | null;
  availableVendors: any[];
}

export interface UseLocationBasedCheckoutOptions {
  onShippingCostChange?: (cost: number) => void;
  onAddressValidated?: (isValid: boolean, validation: any) => void;
  onShippingOptionSelected?: (option: ShippingOption) => void;
  autoCalculateShipping?: boolean;
  includeVendorMatching?: boolean;
}

export const useLocationBasedCheckout = (options: UseLocationBasedCheckoutOptions = {}) => {
  const {
    onShippingCostChange,
    onAddressValidated,
    onShippingOptionSelected,
    autoCalculateShipping = true,
    includeVendorMatching = false
  } = options;

  const [state, setState] = useState<LocationBasedCheckoutState>({
    shippingAddress: null,
    addressValidation: null,
    shippingOptimization: null,
    selectedShippingOption: null,
    shippingCost: 0,
    isAddressValid: false,
    isCalculatingShipping: false,
    isValidatingAddress: false,
    estimatedDeliveryDate: null,
    availableVendors: []
  });

  // Get cart items from unified payment service
  const cartItems = unifiedPaymentService.getCartItems();

  /**
   * Validate shipping address
   */
  const validateAddress = useCallback(async (address: StandardizedAddress) => {
    setState(prev => ({ ...prev, isValidatingAddress: true }));

    try {
      const validation = await unifiedLocationService.validateAddressForDelivery(address);
      
      setState(prev => ({
        ...prev,
        addressValidation: validation,
        isAddressValid: validation.isValid,
        isValidatingAddress: false
      }));

      onAddressValidated?.(validation.isValid, validation);

      if (!validation.isValid) {
        toast.error('Address validation failed', {
          description: validation.issues.join(', ')
        });
        return false;
      }

      toast.success('Address validated successfully', {
        description: `Delivery zone: ${validation.deliveryZone || 'Standard'}`
      });

      return true;
    } catch (error) {
      console.error('Address validation error:', error);
      setState(prev => ({ ...prev, isValidatingAddress: false }));
      toast.error('Address validation failed', {
        description: 'Please try again or contact support'
      });
      return false;
    }
  }, [onAddressValidated]);

  /**
   * Calculate shipping options and costs
   */
  const calculateShipping = useCallback(async (address: StandardizedAddress) => {
    setState(prev => ({ ...prev, isCalculatingShipping: true }));

    try {
      // Calculate location-based shipping through integrated services
      const shippingData = await unifiedLocationService.calculateLocationBasedShipping(
        cartItems,
        address
      );

      if (shippingData.optimization) {
        setState(prev => ({
          ...prev,
          shippingOptimization: shippingData.optimization,
          isCalculatingShipping: false
        }));

        // Auto-select the first (standard) shipping option
        if (shippingData.options.length > 0) {
          const standardOption = shippingData.options.find(opt => opt.id === 'standard') || shippingData.options[0];
          selectShippingOption(standardOption);
        }

        // Find nearby vendors if enabled
        if (includeVendorMatching && shippingData.optimization.toLocation) {
          const vendors = await unifiedLocationService.findNearbyVendors(
            shippingData.optimization.toLocation,
            50
          );
          setState(prev => ({ ...prev, availableVendors: vendors }));
        }
      }
    } catch (error) {
      console.error('Shipping calculation error:', error);
      setState(prev => ({ ...prev, isCalculatingShipping: false }));
      toast.error('Failed to calculate shipping', {
        description: 'Using standard rates'
      });
    }
  }, [cartItems, includeVendorMatching]);

  /**
   * Select shipping option and update costs
   */
  const selectShippingOption = useCallback((option: ShippingOption) => {
    setState(prev => ({
      ...prev,
      selectedShippingOption: option,
      shippingCost: option.cost,
      estimatedDeliveryDate: new Date(Date.now() + option.timeMinutes * 60000)
    }));

    onShippingCostChange?.(option.cost);
    onShippingOptionSelected?.(option);

    console.log('🌍 [useLocationBasedCheckout] Shipping option selected:', option);
  }, [onShippingCostChange, onShippingOptionSelected]);

  /**
   * Main address selection handler
   */
  const handleAddressSelect = useCallback(async (address: StandardizedAddress) => {
    console.log('🌍 [useLocationBasedCheckout] Address selected:', address);
    
    setState(prev => ({
      ...prev,
      shippingAddress: address,
      // Reset dependent state
      addressValidation: null,
      shippingOptimization: null,
      selectedShippingOption: null,
      shippingCost: 0,
      isAddressValid: false,
      estimatedDeliveryDate: null,
      availableVendors: []
    }));

    // Validate address first
    const isValid = await validateAddress(address);
    
    if (isValid && autoCalculateShipping) {
      await calculateShipping(address);
    }
  }, [validateAddress, calculateShipping, autoCalculateShipping]);

  /**
   * Manual shipping recalculation
   */
  const recalculateShipping = useCallback(() => {
    if (state.shippingAddress && state.isAddressValid) {
      return calculateShipping(state.shippingAddress);
    }
    return Promise.resolve();
  }, [state.shippingAddress, state.isAddressValid, calculateShipping]);

  /**
   * Get formatted delivery time
   */
  const getFormattedDeliveryTime = useCallback((minutes: number): string => {
    const days = Math.ceil(minutes / 1440);
    if (days === 1) return '1 business day';
    return `${days} business days`;
  }, []);

  /**
   * Get order total including shipping
   */
  const getOrderTotal = useCallback(() => {
    const cartTotal = unifiedPaymentService.getCartTotal();
    return cartTotal + state.shippingCost;
  }, [state.shippingCost]);

  /**
   * Clear all location-based checkout state
   */
  const clearState = useCallback(() => {
    setState({
      shippingAddress: null,
      addressValidation: null,
      shippingOptimization: null,
      selectedShippingOption: null,
      shippingCost: 0,
      isAddressValid: false,
      isCalculatingShipping: false,
      isValidatingAddress: false,
      estimatedDeliveryDate: null,
      availableVendors: []
    });
  }, []);

  // Auto-recalculate shipping when cart items change
  useEffect(() => {
    if (state.shippingAddress && state.isAddressValid && autoCalculateShipping) {
      const timeoutId = setTimeout(() => {
        recalculateShipping();
      }, 500); // Debounce recalculation

      return () => clearTimeout(timeoutId);
    }
  }, [cartItems.length, state.shippingAddress, state.isAddressValid, autoCalculateShipping, recalculateShipping]);

  return {
    // State
    ...state,
    cartItems,
    orderTotal: getOrderTotal(),
    
    // Actions
    handleAddressSelect,
    selectShippingOption,
    validateAddress,
    calculateShipping: recalculateShipping,
    clearState,
    
    // Utilities
    getFormattedDeliveryTime,
    
    // Computed values
    hasValidAddress: state.shippingAddress && state.isAddressValid,
    hasShippingOptions: state.shippingOptimization?.options?.length > 0,
    isReady: state.shippingAddress && state.isAddressValid && state.selectedShippingOption,
    isProcessing: state.isValidatingAddress || state.isCalculatingShipping
  };
};