/**
 * ================================
 * useUnifiedLocation Hook (MVP)
 * ================================
 * 
 * Simplified React hooks for essential location features only.
 * Advanced shipping and vendor features removed in MVP simplification.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  unifiedLocationService, 
  EnhancedAddress, 
  LocationCoordinates,
  AddressValidationResult
} from '@/services/location/UnifiedLocationService';
import { GooglePlacesPrediction, StandardizedAddress } from '@/services/googlePlacesService';

// ================================
// Enhanced Address Autocomplete Hook
// ================================

interface UseEnhancedAddressAutocompleteProps {
  onAddressSelect: (address: EnhancedAddress) => void;
  options?: {
    includeCoordinates?: boolean;
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
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);

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
// Basic Location Intelligence Hook
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
      { timeout: 10000, maximumAge: 300000 }
    );
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
    getCoordinatesFromAddress,
    getAddressFromCoordinates
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
// Main Unified Hook (Simplified)
// ================================

export const useUnifiedLocation = () => {
  const addressValidation = useAddressValidation();
  const locationIntelligence = useLocationIntelligence();
  const serviceStatus = useLocationServiceStatus();

  return {
    // Enhanced address features
    useEnhancedAutocomplete: useEnhancedAddressAutocomplete,
    validateAddress: addressValidation.validateAddress,
    validationResult: addressValidation.validationResult,
    isValidating: addressValidation.isValidating,
    
    // Basic location intelligence
    userLocation: locationIntelligence.userLocation,
    getUserLocation: locationIntelligence.getUserLocation,
    getCoordinates: locationIntelligence.getCoordinatesFromAddress,
    getAddress: locationIntelligence.getAddressFromCoordinates,
    
    // Service management
    serviceStatus: serviceStatus.status,
    refreshStatus: serviceStatus.refreshStatus,
    clearCache: serviceStatus.clearCache
  };
};