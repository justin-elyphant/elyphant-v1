/**
 * ================================
 * useUnifiedLocation Hook
 * ================================
 * 
 * React hooks for integrating with UnifiedLocationService.
 * Provides location intelligence features including enhanced address
 * autocomplete, geocoding, shipping optimization, and location-based search.
 * 
 * INTEGRATION POINTS:
 * - UnifiedLocationService: Core location orchestration
 * - UnifiedMarketplaceService: Location-based product search
 * - UnifiedPaymentService: Shipping cost calculations
 * 
 * FEATURES:
 * - Enhanced address autocomplete and validation
 * - Location-based product search
 * - Shipping optimization
 * - Geocoding and distance calculations
 * - Real-time location intelligence
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  unifiedLocationService, 
  EnhancedAddress, 
  LocationCoordinates, 
  ShippingOptimization,
  LocationBasedSearch,
  VendorLocation
} from '@/services/location/UnifiedLocationService';
import { GooglePlacesPrediction, StandardizedAddress } from '@/services/googlePlacesService';

// ================================
// Enhanced Address Autocomplete Hook
// ================================

interface UseEnhancedAddressAutocompleteProps {
  onAddressSelect: (address: EnhancedAddress) => void;
  options?: {
    preferBusiness?: boolean;
    includeCoordinates?: boolean;
    filterByDelivery?: boolean;
  };
  debounceMs?: number;
}

export const useEnhancedAddressAutocomplete = ({
  onAddressSelect,
  options,
  debounceMs = 300
}: UseEnhancedAddressAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<GooglePlacesPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<EnhancedAddress | null>(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 3) {
        setIsLoading(true);
        try {
          const results = await unifiedLocationService.getEnhancedAddressPredictions(query, options);
          setPredictions(results);
        } catch (error) {
          console.error('Error fetching enhanced address predictions:', error);
          setPredictions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setPredictions([]);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, options, debounceMs]);

  const selectPrediction = useCallback(async (prediction: GooglePlacesPrediction) => {
    setIsLoading(true);
    try {
      const addressDetails = await unifiedLocationService.getEnhancedAddressDetails(prediction.place_id);
      if (addressDetails) {
        setSelectedAddress(addressDetails);
        onAddressSelect(addressDetails);
        setQuery(addressDetails.formatted_address || prediction.description);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching enhanced place details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onAddressSelect]);

  const clearSelection = useCallback(() => {
    setSelectedAddress(null);
    setQuery('');
    setPredictions([]);
  }, []);

  return {
    query,
    setQuery,
    predictions,
    isLoading,
    selectedAddress,
    selectPrediction,
    clearSelection
  };
};

// ================================
// Address Validation Hook
// ================================

export const useAddressValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    confidence: 'high' | 'medium' | 'low';
    issues: string[];
    suggestions: string[];
    deliveryZone?: string;
  } | null>(null);

  const validateAddress = useCallback(async (address: StandardizedAddress) => {
    setIsValidating(true);
    try {
      const result = await unifiedLocationService.validateAddressForDelivery(address);
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Address validation error:', error);
      setValidationResult({
        isValid: false,
        confidence: 'low',
        issues: ['Validation service unavailable'],
        suggestions: ['Please verify address manually']
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    validateAddress,
    clearValidation,
    isValidating,
    validationResult
  };
};

// ================================
// Location Intelligence Hook
// ================================

export const useLocationIntelligence = () => {
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setIsGettingLocation(false);
      },
      { timeout: 10000, maximumAge: 300000 } // 10 second timeout, 5 minute cache
    );
  }, []);

  const calculateDistance = useCallback(async (
    from: StandardizedAddress | LocationCoordinates,
    to: StandardizedAddress | LocationCoordinates
  ) => {
    try {
      return await unifiedLocationService.calculateDistance(from, to);
    } catch (error) {
      console.error('Distance calculation error:', error);
      return null;
    }
  }, []);

  const getCoordinatesFromAddress = useCallback(async (address: StandardizedAddress) => {
    try {
      return await unifiedLocationService.getCoordinatesFromAddress(address);
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }, []);

  const getAddressFromCoordinates = useCallback(async (coordinates: LocationCoordinates) => {
    try {
      return await unifiedLocationService.getAddressFromCoordinates(coordinates);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }, []);

  return {
    userLocation,
    locationError,
    isGettingLocation,
    getUserLocation,
    calculateDistance,
    getCoordinatesFromAddress,
    getAddressFromCoordinates
  };
};

// ================================
// Shipping Optimization Hook
// ================================

export const useShippingOptimization = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [shippingData, setShippingData] = useState<ShippingOptimization | null>(null);

  const getShippingOptimization = useCallback(async (
    toAddress: StandardizedAddress,
    fromLocation?: LocationCoordinates
  ) => {
    setIsCalculating(true);
    try {
      const result = await unifiedLocationService.getShippingOptimization(toAddress, fromLocation);
      setShippingData(result);
      return result;
    } catch (error) {
      console.error('Shipping optimization error:', error);
      setShippingData(null);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const calculateShippingCosts = useCallback(async (
    items: any[],
    shippingAddress: StandardizedAddress
  ) => {
    setIsCalculating(true);
    try {
      const result = await unifiedLocationService.calculateLocationBasedShipping(items, shippingAddress);
      return result;
    } catch (error) {
      console.error('Shipping cost calculation error:', error);
      return { cost: 9.99, options: [] };
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const clearShippingData = useCallback(() => {
    setShippingData(null);
  }, []);

  return {
    getShippingOptimization,
    calculateShippingCosts,
    clearShippingData,
    isCalculating,
    shippingData
  };
};

// ================================
// Location-Based Search Hook
// ================================

export const useLocationBasedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [nearbyVendors, setNearbyVendors] = useState<VendorLocation[]>([]);

  const searchProductsByLocation = useCallback(async (
    searchTerm: string,
    userLocation: LocationCoordinates,
    options?: LocationBasedSearch
  ) => {
    setIsSearching(true);
    try {
      const results = await unifiedLocationService.searchProductsByLocation(
        searchTerm,
        userLocation,
        options
      );
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Location-based search error:', error);
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const findNearbyVendors = useCallback(async (
    userLocation: LocationCoordinates,
    maxDistance: number = 50
  ) => {
    try {
      const vendors = await unifiedLocationService.findNearbyVendors(userLocation, maxDistance);
      setNearbyVendors(vendors);
      return vendors;
    } catch (error) {
      console.error('Nearby vendors search error:', error);
      setNearbyVendors([]);
      return [];
    }
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setNearbyVendors([]);
  }, []);

  return {
    searchProductsByLocation,
    findNearbyVendors,
    clearSearchResults,
    isSearching,
    searchResults,
    nearbyVendors
  };
};

// ================================
// Service Status Hook
// ================================

export const useLocationServiceStatus = () => {
  const [status, setStatus] = useState<any>(null);

  const refreshStatus = useCallback(() => {
    const serviceStatus = unifiedLocationService.getStatus();
    setStatus(serviceStatus);
  }, []);

  const clearCache = useCallback(() => {
    unifiedLocationService.clearCache();
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    refreshStatus,
    clearCache
  };
};

// ================================
// Unified Location Hook (Main Hook)
// ================================

/**
 * Main hook that provides access to all location-related functionality
 * Use this for gradual migration and comprehensive location features
 */
export const useUnifiedLocation = () => {
  const addressAutocomplete = useEnhancedAddressAutocomplete;
  const addressValidation = useAddressValidation();
  const locationIntelligence = useLocationIntelligence();
  const shippingOptimization = useShippingOptimization();
  const locationBasedSearch = useLocationBasedSearch();
  const serviceStatus = useLocationServiceStatus();

  return {
    // Enhanced address features
    useEnhancedAutocomplete: addressAutocomplete,
    validateAddress: addressValidation.validateAddress,
    validationResult: addressValidation.validationResult,
    isValidating: addressValidation.isValidating,
    
    // Location intelligence
    userLocation: locationIntelligence.userLocation,
    getUserLocation: locationIntelligence.getUserLocation,
    calculateDistance: locationIntelligence.calculateDistance,
    getCoordinates: locationIntelligence.getCoordinatesFromAddress,
    getAddress: locationIntelligence.getAddressFromCoordinates,
    
    // Shipping optimization
    getShippingOptimization: shippingOptimization.getShippingOptimization,
    calculateShippingCosts: shippingOptimization.calculateShippingCosts,
    shippingData: shippingOptimization.shippingData,
    isCalculatingShipping: shippingOptimization.isCalculating,
    
    // Location-based search
    searchByLocation: locationBasedSearch.searchProductsByLocation,
    findNearbyVendors: locationBasedSearch.findNearbyVendors,
    searchResults: locationBasedSearch.searchResults,
    nearbyVendors: locationBasedSearch.nearbyVendors,
    isSearching: locationBasedSearch.isSearching,
    
    // Service management
    serviceStatus: serviceStatus.status,
    refreshStatus: serviceStatus.refreshStatus,
    clearCache: serviceStatus.clearCache
  };
};