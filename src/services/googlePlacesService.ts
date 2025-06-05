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

  constructor() {
    console.log('🏗️ [GooglePlaces] Service initialized');
  }

  private async loadGoogleMapsAPI(): Promise<void> {
    if (this.loadingPromise) {
      console.log('🏗️ [GooglePlaces] Already loading, waiting for existing promise...');
      return this.loadingPromise;
    }

    if (this.isLoaded || (window as any).google?.maps?.places) {
      console.log('🏗️ [GooglePlaces] Google Maps already loaded, initializing services...');
      this.initializeServices();
      return;
    }

    this.loadingPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('🏗️ [GooglePlaces] Starting Google Maps API loading process...');
        
        // Get API key from server
        console.log('🏗️ [GooglePlaces] Fetching API key...');
        this.apiKey = await getGoogleMapsApiKey();
        
        if (!this.apiKey) {
          console.warn('🏗️ [GooglePlaces] ⚠️ No API key available - switching to mock data mode');
          this.usingMockData = true;
          this.isLoaded = true;
          resolve();
          return;
        }

        console.log('🏗️ [GooglePlaces] ✅ API key retrieved, loading Google Maps script...');
        console.log('🏗️ [GooglePlaces] Script URL will be:', `https://maps.googleapis.com/maps/api/js?key=${this.apiKey.substring(0, 10)}...&libraries=places`);

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('🏗️ [GooglePlaces] ✅ Google Maps script loaded successfully');
          this.isLoaded = true;
          this.usingMockData = false;
          this.initializeServices();
          resolve();
        };
        
        script.onerror = (error) => {
          console.error('🏗️ [GooglePlaces] ❌ Failed to load Google Maps script:', error);
          console.error('🏗️ [GooglePlaces] This could be due to:');
          console.error('🏗️ [GooglePlaces] - Invalid API key');
          console.error('🏗️ [GooglePlaces] - API restrictions (domain/referrer)');
          console.error('🏗️ [GooglePlaces] - Disabled APIs in Google Cloud Console');
          console.error('🏗️ [GooglePlaces] - Network connectivity issues');
          this.usingMockData = true;
          this.isLoaded = true;
          resolve(); // Don't reject, use mock data
        };
        
        console.log('🏗️ [GooglePlaces] Adding script to document head...');
        document.head.appendChild(script);
      } catch (error) {
        console.error('🏗️ [GooglePlaces] ❌ Error during Google Maps API loading:', error);
        this.usingMockData = true;
        this.isLoaded = true;
        resolve(); // Don't reject, use mock data
      }
    });

    return this.loadingPromise;
  }

  private initializeServices(): void {
    const googleMaps = (window as any).google?.maps?.places;
    if (googleMaps) {
      try {
        this.autocompleteService = new googleMaps.AutocompleteService();
        // Create a temporary div for PlacesService
        const div = document.createElement('div');
        const map = new (window as any).google.maps.Map(div);
        this.placesService = new googleMaps.PlacesService(map);
        console.log('🏗️ [GooglePlaces] ✅ Google Places services initialized successfully');
        this.usingMockData = false;
      } catch (error) {
        console.error('🏗️ [GooglePlaces] ❌ Failed to initialize Google Places services:', error);
        this.usingMockData = true;
      }
    } else {
      console.warn('🏗️ [GooglePlaces] ⚠️ Google Maps Places API not available, using mock data');
      this.usingMockData = true;
    }
  }

  async getAddressPredictions(input: string): Promise<GooglePlacesPrediction[]> {
    if (!input || input.length < 3) {
      return [];
    }

    console.log(`🔍 [GooglePlaces] Getting predictions for: "${input}"`);
    await this.loadGoogleMapsAPI();

    // If Google Maps API is available, use it
    if (this.autocompleteService && this.apiKey && !this.usingMockData) {
      console.log('🔍 [GooglePlaces] Using real Google Places API');
      return new Promise((resolve) => {
        this.autocompleteService.getPlacePredictions(
          {
            input: input,
            types: ['address'],
            componentRestrictions: { country: 'us' }
          },
          (predictions: any[], status: string) => {
            console.log(`🔍 [GooglePlaces] API Response - Status: ${status}, Predictions: ${predictions?.length || 0}`);
            
            if (status === 'OK' && predictions) {
              console.log(`🔍 [GooglePlaces] ✅ Successfully got ${predictions.length} real predictions`);
              const formattedPredictions = predictions.map(prediction => ({
                place_id: prediction.place_id,
                description: prediction.description,
                structured_formatting: {
                  main_text: prediction.structured_formatting.main_text,
                  secondary_text: prediction.structured_formatting.secondary_text
                }
              }));
              resolve(formattedPredictions);
            } else {
              console.warn(`🔍 [GooglePlaces] ⚠️ Google Places API error: ${status}, falling back to mock data`);
              resolve(this.getMockPredictions(input));
            }
          }
        );
      });
    }

    // Fallback to mock data
    console.log('🔍 [GooglePlaces] 🤖 Using mock predictions (API not available)');
    return this.getMockPredictions(input);
  }

  async getPlaceDetails(placeId: string): Promise<StandardizedAddress | null> {
    console.log(`📍 [GooglePlaces] Getting place details for: ${placeId}`);
    await this.loadGoogleMapsAPI();

    // If Google Maps API is available, use it
    if (this.placesService && this.apiKey && !placeId.startsWith('mock_') && !this.usingMockData) {
      console.log('📍 [GooglePlaces] Using real Google Places API for details');
      return new Promise((resolve) => {
        this.placesService.getDetails(
          {
            placeId: placeId,
            fields: ['place_id', 'formatted_address', 'address_components', 'geometry']
          },
          (place: any, status: string) => {
            console.log(`📍 [GooglePlaces] Details API Response - Status: ${status}`);
            
            if (status === 'OK' && place) {
              console.log('📍 [GooglePlaces] ✅ Successfully got real place details');
              const standardizedAddress = this.parseGooglePlaceDetails(place);
              resolve(standardizedAddress);
            } else {
              console.warn(`📍 [GooglePlaces] ⚠️ Google Places Details API error: ${status}, falling back to mock data`);
              resolve(this.getMockPlaceDetails(placeId));
            }
          }
        );
      });
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
