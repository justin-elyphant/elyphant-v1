
export interface GooglePlacesPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GooglePlaceDetails {
  place_id: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface StandardizedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formatted_address?: string;
  place_id?: string;
}

class GooglePlacesService {
  private apiKey: string;
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private isLoaded = false;

  constructor() {
    this.apiKey = '';
    this.loadGoogleMapsAPI();
  }

  private async loadGoogleMapsAPI(): Promise<void> {
    if (this.isLoaded || window.google?.maps?.places) {
      this.initializeServices();
      return;
    }

    try {
      // In a real implementation, we would load the Google Maps script
      // For now, we'll simulate the API with better mock data
      this.isLoaded = true;
      this.initializeServices();
    } catch (error) {
      console.error('Failed to load Google Maps API:', error);
    }
  }

  private initializeServices(): void {
    if (window.google?.maps?.places) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      // Create a temporary div for PlacesService
      const div = document.createElement('div');
      const map = new google.maps.Map(div);
      this.placesService = new google.maps.places.PlacesService(map);
    }
  }

  async getAddressPredictions(input: string): Promise<GooglePlacesPrediction[]> {
    if (!input || input.length < 3) {
      return [];
    }

    // For now, return enhanced mock data until Google Maps API is properly configured
    return this.getMockPredictions(input);
  }

  async getPlaceDetails(placeId: string): Promise<StandardizedAddress | null> {
    // For now, return mock place details
    return this.getMockPlaceDetails(placeId);
  }

  private getMockPredictions(input: string): GooglePlacesPrediction[] {
    const mockAddresses = [
      {
        place_id: `mock_${input}_1`,
        description: `${input} Main St, San Francisco, CA, USA`,
        structured_formatting: {
          main_text: `${input} Main St`,
          secondary_text: 'San Francisco, CA, USA'
        }
      },
      {
        place_id: `mock_${input}_2`,
        description: `${input} Oak Ave, Los Angeles, CA, USA`,
        structured_formatting: {
          main_text: `${input} Oak Ave`,
          secondary_text: 'Los Angeles, CA, USA'
        }
      },
      {
        place_id: `mock_${input}_3`,
        description: `${input} Broadway, New York, NY, USA`,
        structured_formatting: {
          main_text: `${input} Broadway`,
          secondary_text: 'New York, NY, USA'
        }
      }
    ];

    return mockAddresses.filter(addr => 
      addr.description.toLowerCase().includes(input.toLowerCase())
    );
  }

  private getMockPlaceDetails(placeId: string): StandardizedAddress {
    // Extract city from place_id for mock data
    const mockData: Record<string, StandardizedAddress> = {
      default: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        country: 'US',
        formatted_address: '123 Main St, San Francisco, CA 94103, USA',
        place_id: placeId
      }
    };

    if (placeId.includes('los_angeles') || placeId.includes('Oak')) {
      return {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'US',
        formatted_address: '456 Oak Ave, Los Angeles, CA 90001, USA',
        place_id: placeId
      };
    }

    if (placeId.includes('new_york') || placeId.includes('Broadway')) {
      return {
        street: '789 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
        formatted_address: '789 Broadway, New York, NY 10001, USA',
        place_id: placeId
      };
    }

    return mockData.default;
  }

  validateAddress(address: StandardizedAddress): boolean {
    return !!(
      address.street &&
      address.city &&
      address.state &&
      address.zipCode &&
      address.country
    );
  }
}

export const googlePlacesService = new GooglePlacesService();
