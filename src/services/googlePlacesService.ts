import { getGoogleMapsApiKey } from '@/utils/googleMapsConfig';

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
  private apiKey: string | null = null;
  private autocompleteService: any = null;
  private placesService: any = null;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;
  private usingMockData = false;
  private sessionToken: any = null;
  private apiKeyFetched = false;

  constructor() {
    console.log('🏗️ [GooglePlaces] Service initialized');
  }

  private async loadGoogleMapsAPI(): Promise<void> {
    if (this.loadingPromise) {
      console.log('🏗️ [GooglePlaces] Already loading, waiting for existing promise...');
      return this.loadingPromise;
    }

    if (this.isLoaded) {
      return;
    }

    this.loadingPromise = new Promise(async (resolve) => {
      console.log('🏗️ [GooglePlaces] ⚠️ Client-side Google Maps blocked by CSP - using backend API calls only');
      
      // Get API key from server for backend calls
      if (!this.apiKeyFetched) {
        console.log('🏗️ [GooglePlaces] Fetching API key for backend use...');
        this.apiKey = await getGoogleMapsApiKey();
        this.apiKeyFetched = true;
      }
      
      this.usingMockData = false; // We'll use real backend calls
      this.isLoaded = true;
      resolve();
    });

    return this.loadingPromise;
  }

  private initializeServices(): void {
    console.log('🏗️ [GooglePlaces] 🔧 Attempting to initialize services...');
    const googleMaps = (window as any).google?.maps?.places;
    const hasGoogleMaps = !!googleMaps;
    const hasApiKey = !!this.apiKey;
    const notUsingMock = !this.usingMockData;
    
    console.log('🏗️ [GooglePlaces] 🔍 Service check - Google Maps:', hasGoogleMaps, 'API Key:', hasApiKey, 'Not Mock:', notUsingMock);
    
    if (googleMaps && this.apiKey && !this.usingMockData) {
      try {
        console.log('🏗️ [GooglePlaces] 🔧 Creating AutocompleteService...');
        this.autocompleteService = new googleMaps.AutocompleteService();
        
        console.log('🏗️ [GooglePlaces] 🔧 Creating PlacesService...');
        // Create a temporary div for PlacesService
        const div = document.createElement('div');
        const map = new (window as any).google.maps.Map(div, {
          center: { lat: 37.7749, lng: -122.4194 },
          zoom: 10
        });
        this.placesService = new googleMaps.PlacesService(map);
        
        console.log('🏗️ [GooglePlaces] ✅ Google Places services initialized successfully');
        console.log('🏗️ [GooglePlaces] 🔍 AutocompleteService:', !!this.autocompleteService);
        console.log('🏗️ [GooglePlaces] 🔍 PlacesService:', !!this.placesService);
        this.usingMockData = false;
      } catch (error) {
        console.error('🏗️ [GooglePlaces] ❌ Failed to initialize Google Places services:', error);
        console.warn('🏗️ [GooglePlaces] ⚠️ Switching to mock data mode due to service initialization failure');
        this.usingMockData = true;
        this.autocompleteService = null;
        this.placesService = null;
      }
    } else {
      console.warn('🏗️ [GooglePlaces] ⚠️ Google Maps Places API not available or no API key, using mock data');
      console.log('🏗️ [GooglePlaces] 🔍 Debug - Has Google Maps:', hasGoogleMaps, 'Has API Key:', hasApiKey, 'Using Mock:', this.usingMockData);
      this.usingMockData = true;
      this.autocompleteService = null;
      this.placesService = null;
    }
  }

  private createSessionToken(): any {
    if ((window as any).google?.maps?.places) {
      return new (window as any).google.maps.places.AutocompleteSessionToken();
    }
    return null;
  }

  private getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('🔍 [GooglePlaces] Location access denied or unavailable, using default location bias');
          resolve(null);
        },
        { timeout: 5000, maximumAge: 300000 } // 5 second timeout, 5 minute cache
      );
    });
  }

  async getAddressPredictions(input: string): Promise<GooglePlacesPrediction[]> {
    if (!input || input.length < 3) {
      return [];
    }

    console.log(`🔍 [GooglePlaces] Getting predictions for: "${input}"`);
    await this.loadGoogleMapsAPI();

    // Since client-side Google Maps is blocked by CSP, we'll use backend API calls
    if (this.apiKey) {
      console.log('🔍 [GooglePlaces] Using backend Google Places API');
      
      try {
        // Create a new edge function for Google Places Autocomplete
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
          body: { 
            input: input,
            types: ['geocode'],
            componentRestrictions: { country: 'us' }
          }
        });

        if (error) {
          console.error('🔍 [GooglePlaces] Backend API error:', error);
          throw error;
        }

        if (data.predictions && data.predictions.length > 0) {
          console.log(`🔍 [GooglePlaces] ✅ Got ${data.predictions.length} predictions from backend`);
          return data.predictions;
        }
      } catch (error) {
        console.error('🔍 [GooglePlaces] Backend API call failed:', error);
      }
    }

    // Fallback to mock data
    console.log('🔍 [GooglePlaces] 🤖 Using mock predictions (API not available)');
    return this.getMockPredictions(input);
  }

  async getPlaceDetails(placeId: string): Promise<StandardizedAddress | null> {
    console.log(`📍 [GooglePlaces] Getting place details for: ${placeId}`);
    await this.loadGoogleMapsAPI();

    // Skip backend call for mock place IDs
    if (placeId.startsWith('mock_')) {
      console.log('📍 [GooglePlaces] 🤖 Using mock place details for mock ID');
      return this.getMockPlaceDetails(placeId);
    }

    // Use backend API call since client-side is blocked by CSP
    if (this.apiKey) {
      console.log('📍 [GooglePlaces] Using backend Google Places API for details');
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase.functions.invoke('google-place-details', {
          body: { 
            placeId: placeId,
            fields: ['place_id', 'formatted_address', 'address_components', 'geometry']
          }
        });

        if (error) {
          console.error('📍 [GooglePlaces] Backend API error:', error);
          throw error;
        }

        if (data.place) {
          console.log('📍 [GooglePlaces] ✅ Got place details from backend');
          return this.parseGooglePlaceDetails(data.place);
        }
      } catch (error) {
        console.error('📍 [GooglePlaces] Backend API call failed:', error);
      }
    }

    // Fallback to mock data
    console.log('📍 [GooglePlaces] 🤖 Using mock place details (API not available)');
    return this.getMockPlaceDetails(placeId);
  }

  private parseGooglePlaceDetails(place: any): StandardizedAddress {
    const components = place.address_components || [];
    let street = '';
    let city = '';
    let state = '';
    let zipCode = '';
    let country = '';

    // Parse address components
    components.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        street += component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
      if (types.includes('country')) {
        country = component.short_name;
      }
    });

    return {
      street: street.trim(),
      city,
      state,
      zipCode,
      country,
      formatted_address: place.formatted_address,
      place_id: place.place_id
    };
  }

  private getMockPredictions(input: string): GooglePlacesPrediction[] {
    console.log('🤖 [GooglePlaces] Generating mock predictions');
    
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

    const filtered = mockAddresses.filter(addr => 
      addr.description.toLowerCase().includes(input.toLowerCase())
    );
    
    console.log(`🤖 [GooglePlaces] Generated ${filtered.length} mock predictions`);
    return filtered;
  }

  private getMockPlaceDetails(placeId: string): StandardizedAddress {
    console.log('🤖 [GooglePlaces] Generating mock place details');
    
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

  // Diagnostic method
  getStatus(): { usingMockData: boolean; hasApiKey: boolean; isLoaded: boolean } {
    return {
      usingMockData: this.usingMockData,
      hasApiKey: !!this.apiKey,
      isLoaded: this.isLoaded
    };
  }
}

export const googlePlacesService = new GooglePlacesService();

// Expose service status globally for debugging
if (typeof window !== 'undefined') {
  (window as any).googlePlacesService = googlePlacesService;
}
