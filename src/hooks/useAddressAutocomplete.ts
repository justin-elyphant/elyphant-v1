
import { useState, useEffect } from "react";

interface AddressSuggestion {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const useAddressAutocomplete = () => {
  const [streetQuery, setStreetQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (streetQuery.length < 5) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // This is a mock API call - in a real implementation,
        // you would use a service like Google Places API, Mapbox, etc.
        // We're simulating a delay and returning mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock address data based on the query
        const mockSuggestions = generateMockAddresses(streetQuery);
        setSuggestions(mockSuggestions);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [streetQuery]);

  const selectAddress = (address: AddressSuggestion) => {
    setSelectedAddress(address);
    setSuggestions([]);
  };

  // This is a mock function for demonstration
  // In a real app, you would integrate with a real address API
  const generateMockAddresses = (query: string): AddressSuggestion[] => {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Common street types to make the suggestions look realistic
    const streets = [
      { street: `${normalizedQuery.charAt(0).toUpperCase() + normalizedQuery.slice(1)} Ave`, city: "New York", state: "NY", zipCode: "10001", country: "United States" },
      { street: `${normalizedQuery.charAt(0).toUpperCase() + normalizedQuery.slice(1)} St`, city: "San Francisco", state: "CA", zipCode: "94105", country: "United States" },
      { street: `${normalizedQuery.charAt(0).toUpperCase() + normalizedQuery.slice(1)} Blvd`, city: "Los Angeles", state: "CA", zipCode: "90001", country: "United States" },
    ];
    
    return streets.map(s => ({
      address: s.street,
      city: s.city,
      state: s.state,
      zipCode: s.zipCode,
      country: s.country
    }));
  };

  return {
    streetQuery,
    setStreetQuery,
    suggestions,
    loading,
    selectedAddress,
    selectAddress
  };
};
