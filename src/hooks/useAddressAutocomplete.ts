
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

  // Enhanced mock function to provide more realistic suggestions
  const generateMockAddresses = (query: string): AddressSuggestion[] => {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return [];
    
    // Generate more diverse mock addresses based on first letters
    const firstChar = normalizedQuery.charAt(0).toUpperCase();
    
    // Create a list of street types for variety
    const streetTypes = ["St", "Ave", "Blvd", "Dr", "Ln", "Rd", "Way", "Pl"];
    const cities = {
      "A": ["Atlanta", "Austin", "Albuquerque", "Albany"],
      "B": ["Boston", "Baltimore", "Birmingham", "Buffalo"],
      "C": ["Chicago", "Cleveland", "Columbus", "Charlotte", "Cincinnati"],
      "D": ["Dallas", "Denver", "Detroit", "Durham"],
      "E": ["Eugene", "El Paso", "Evanston", "Edison"],
      "F": ["Fort Worth", "Fresno", "Fort Lauderdale", "Fargo"],
      "G": ["Grand Rapids", "Green Bay", "Greensboro", "Gainesville"],
      "H": ["Houston", "Honolulu", "Hartford", "Henderson"],
      "I": ["Indianapolis", "Irving", "Irvine", "Independence"],
      "J": ["Jacksonville", "Jersey City", "Jackson", "Jupiter"],
      "K": ["Kansas City", "Knoxville", "Kent", "Kalamazoo"],
      "L": ["Los Angeles", "Las Vegas", "Louisville", "Lincoln"],
      "M": ["Miami", "Minneapolis", "Memphis", "Milwaukee"],
      "N": ["New York", "Nashville", "New Orleans", "Newark"],
      "O": ["Oakland", "Oklahoma City", "Omaha", "Orlando"],
      "P": ["Philadelphia", "Phoenix", "Portland", "Pittsburgh"],
      "Q": ["Queens", "Quincy", "Quakertown"],
      "R": ["Raleigh", "Richmond", "Riverside", "Rochester"],
      "S": ["San Francisco", "Seattle", "San Diego", "San Antonio"],
      "T": ["Tampa", "Tucson", "Toledo", "Tulsa"],
      "U": ["Union City", "Urban", "Utica"],
      "V": ["Virginia Beach", "Vancouver", "Vallejo"],
      "W": ["Washington", "Wichita", "Winston-Salem"],
      "X": ["Xerox"], 
      "Y": ["Youngstown", "Yonkers", "York"],
      "Z": ["Zanesville", "Zion"]
    };
    
    const states = {
      "A": ["AL", "AK", "AZ", "AR"],
      "B": ["CA"], // Berkeley
      "C": ["CA", "CO", "CT"],
      "D": ["DE", "DC"],
      "E": ["FL"], // Everglades
      "F": ["FL"],
      "G": ["GA"],
      "H": ["HI"],
      "I": ["ID", "IL", "IN", "IA"],
      "J": ["NJ"],
      "K": ["KS", "KY"],
      "L": ["LA"],
      "M": ["ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT"],
      "N": ["NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND"],
      "O": ["OH", "OK", "OR"],
      "P": ["PA"],
      "Q": ["PA"], // Quakertown
      "R": ["RI"],
      "S": ["SC", "SD"],
      "T": ["TN", "TX"],
      "U": ["UT"],
      "V": ["VT", "VA"],
      "W": ["WA", "WV", "WI", "WY"],
      "X": ["TX"], // No X states
      "Y": ["NY"], // No Y states
      "Z": ["OH"] // No Z states
    };
    
    // Include more matching for common query terms
    let addressMatches: AddressSuggestion[] = [];
    
    // Generate matches that contain the query string
    const numAddresses = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numAddresses; i++) {
      // Create street number
      const streetNum = Math.floor(Math.random() * 9900) + 100;
      
      // Create street name that includes part of the query for better matching
      let streetName;
      if (normalizedQuery.length > 3) {
        // Try to incorporate the query into the street name
        const queryWords = normalizedQuery.split(' ');
        if (queryWords.length > 1) {
          // Use parts of the multi-word query
          streetName = queryWords[0].charAt(0).toUpperCase() + queryWords[0].slice(1);
        } else {
          // Use the single word query
          streetName = normalizedQuery.charAt(0).toUpperCase() + normalizedQuery.slice(1);
        }
      } else {
        // For short queries, use names that start with the first letter
        const streetOptions = [
          firstChar + "ackson", 
          firstChar + "incoln",
          firstChar + "ashington",
          firstChar + "ranklin",
          firstChar + "efferson"
        ];
        streetName = streetOptions[Math.floor(Math.random() * streetOptions.length)];
      }
      
      // Pick a random street type
      const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
      
      // Construct full address
      const address = `${streetNum} ${streetName} ${streetType}`;
      
      // Get lists for this letter
      const citiesForLetter = cities[firstChar as keyof typeof cities] || cities["S"];
      const statesForLetter = states[firstChar as keyof typeof states] || states["C"];
      
      // Pick random city and state
      const city = citiesForLetter[Math.floor(Math.random() * citiesForLetter.length)];
      const state = statesForLetter[Math.floor(Math.random() * statesForLetter.length)];
      
      // Generate zipcode based on state
      const zipPrefix = (states["C"].includes(state)) ? "9" : 
                       (states["N"].includes(state)) ? "1" : 
                       (states["T"].includes(state)) ? "7" : "3";
      const zipCode = zipPrefix + Math.floor(Math.random() * 9000 + 1000).toString();
      
      addressMatches.push({
        address,
        city,
        state,
        zipCode,
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
