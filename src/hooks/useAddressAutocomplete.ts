
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
      if (streetQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // This is a mock API call - in a real implementation,
        // you would use a service like Google Places API, Mapbox, etc.
        // We're simulating a delay and returning mock data
        await new Promise(resolve => setTimeout(resolve, 200));
        
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

    // Use a shorter timeout for better responsiveness
    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [streetQuery]);

  const selectAddress = (address: AddressSuggestion) => {
    setSelectedAddress(address);
    setSuggestions([]);
  };

  // Generate more realistic US address suggestions
  const generateMockAddresses = (query: string): AddressSuggestion[] => {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return [];
    
    // Create realistic street prefixes and types
    const streetNumbers = ["123", "456", "789", "1010", "2250", "3725", "4200", "5500"];
    const streetPrefixes = ["", "North ", "South ", "East ", "West "];
    const streetNames = [
      "Main", "Oak", "Maple", "Washington", "Park", 
      "Broadway", "Highland", "Sunset", "Ocean", "Lake View"
    ];
    const streetTypes = [
      "St", "Ave", "Dr", "Blvd", "Pl", "Ln", "Rd", "Ct", "Way"
    ];
    
    // Cities and states
    const cityStateZip = [
      { city: "San Francisco", state: "CA", zip: "94103" },
      { city: "Los Angeles", state: "CA", zip: "90001" },
      { city: "New York", state: "NY", zip: "10001" },
      { city: "Chicago", state: "IL", zip: "60601" },
      { city: "Austin", state: "TX", zip: "78701" },
      { city: "Seattle", state: "WA", zip: "98101" },
      { city: "Miami", state: "FL", zip: "33101" },
      { city: "Denver", state: "CO", zip: "80201" }
    ];
    
    // Generate 3-5 suggestions based on the query
    const numAddresses = Math.floor(Math.random() * 3) + 3;
    const addressMatches: AddressSuggestion[] = [];
    
    for (let i = 0; i < numAddresses; i++) {
      const streetNumber = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
      const streetPrefix = streetPrefixes[Math.floor(Math.random() * streetPrefixes.length)];
      
      // Choose a street name that might include part of the query
      let streetName;
      let streetType;
      
      if (normalizedQuery.length > 3) {
        // Try to find a street name that contains part of the query
        const possibleMatches = streetNames.filter(name => 
          name.toLowerCase().includes(normalizedQuery.substring(0, 3))
        );
        
        if (possibleMatches.length > 0) {
          streetName = possibleMatches[Math.floor(Math.random() * possibleMatches.length)];
        } else {
          streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        }
        
        streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
      } else {
        streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
      }
      
      // Random city/state combo
      const location = cityStateZip[Math.floor(Math.random() * cityStateZip.length)];
      
      addressMatches.push({
        address: `${streetNumber} ${streetPrefix}${streetName} ${streetType}`,
        city: location.city,
        state: location.state,
        zipCode: location.zip,
        country: "United States"
      });
    }
    
    return addressMatches;
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
