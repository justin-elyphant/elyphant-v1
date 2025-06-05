
import { useState, useEffect, useCallback } from 'react';
import { googlePlacesService, GooglePlacesPrediction, StandardizedAddress } from '@/services/googlePlacesService';

interface UseGooglePlacesAutocompleteProps {
  onAddressSelect: (address: StandardizedAddress) => void;
  debounceMs?: number;
}

export const useGooglePlacesAutocomplete = ({
  onAddressSelect,
  debounceMs = 300
}: UseGooglePlacesAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<GooglePlacesPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<StandardizedAddress | null>(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 3) {
        setIsLoading(true);
        try {
          const results = await googlePlacesService.getAddressPredictions(query);
          setPredictions(results);
        } catch (error) {
          console.error('Error fetching address predictions:', error);
          setPredictions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setPredictions([]);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const selectPrediction = useCallback(async (prediction: GooglePlacesPrediction) => {
    setIsLoading(true);
    try {
      const addressDetails = await googlePlacesService.getPlaceDetails(prediction.place_id);
      if (addressDetails) {
        setSelectedAddress(addressDetails);
        onAddressSelect(addressDetails);
        setQuery(addressDetails.formatted_address || prediction.description);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
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
