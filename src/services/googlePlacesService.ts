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

    if (this.isLoaded && this.apiKey && !this.usingMockData && (window as any).google?.maps?.places) {
      console.log('🏗️ [GooglePlaces] Google Maps already loaded with valid API, initializing services...');
      this.initializeServices();
      return;
    }

    this.loadingPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('🏗️ [GooglePlaces] Starting Google Maps API loading process...');
        
        // Get API key from server - only fetch once
        if (!this.apiKeyFetched) {
          console.log('🏗️ [GooglePlaces] Fetching API key...');
          this.apiKey = await getGoogleMapsApiKey();
          this.apiKeyFetched = true;
          
          if (!this.apiKey) {
            console.warn('🏗️ [GooglePlaces] ⚠️ No API key available - switching to mock data mode');
            this.usingMockData = true;
            this.isLoaded = true;
            resolve();
            return;
          } else {
            console.log('🏗️ [GooglePlaces] ✅ API key retrieved successfully');
            console.log('🏗️ [GooglePlaces] 🔍 API Key starts with:', this.apiKey.substring(0, 20) + '...');
            this.usingMockData = false;
            
            // Test the API key with a simple request before proceeding
            console.log('🏗️ [GooglePlaces] Testing API key validity...');
            try {
              const testResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${this.apiKey}`);
              const testData = await testResponse.json();
              if (testData.status === 'REQUEST_DENIED' || testData.status === 'INVALID_REQUEST') {
                console.error('🏗️ [GooglePlaces] ❌ API key test failed:', testData.status, testData.error_message);
                console.warn('🏗️ [GooglePlaces] ⚠️ API key invalid - switching to mock data mode');
                this.usingMockData = true;
                this.isLoaded = true;
                resolve();
                return;
              } else {
                console.log('🏗️ [GooglePlaces] ✅ API key test passed');
              }
            } catch (error) {
              console.error('🏗️ [GooglePlaces] ❌ API key test error:', error);
              console.warn('🏗️ [GooglePlaces] ⚠️ API key test failed - switching to mock data mode');
              this.usingMockData = true;
              this.isLoaded = true;
              resolve();
              return;
            }
          }
        }

        console.log('🏗️ [GooglePlaces] Loading Google Maps script...');

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
          console.warn('🏗️ [GooglePlaces] ⚠️ Switching to mock data mode due to script load failure');
          this.usingMockData = true;
          this.isLoaded = true;
          resolve(); // Don't reject, use mock data
        };
        
        console.log('🏗️ [GooglePlaces] Adding script to document head...');
        document.head.appendChild(script);
      } catch (error) {
        console.error('🏗️ [GooglePlaces] ❌ Error during Google Maps API loading:', error);
        console.warn('🏗️ [GooglePlaces] ⚠️ Switching to mock data mode due to loading error');
        this.usingMockData = true;
        this.isLoaded = true;
        resolve(); // Don't reject, use mock data
      }
    });

    return this.loadingPromise;
  }

  private initializeServices(): void {
    const googleMaps = (window as any).google?.maps?.places;
    if (googleMaps && this.apiKey && !this.usingMockData) {
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
        console.warn('🏗️ [GooglePlaces] ⚠️ Switching to mock data mode due to service initialization failure');
        this.usingMockData = true;
      }
    } else {
      console.warn('🏗️ [GooglePlaces] ⚠️ Google Maps Places API not available or no API key, using mock data');
      console.log('🏗️ [GooglePlaces] 🔍 Debug - Has Google Maps:', !!googleMaps, 'Has API Key:', !!this.apiKey, 'Using Mock:', this.usingMockData);
      this.usingMockData = true;
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

    // Force check if we should be using real API
    const shouldUseRealAPI = this.autocompleteService && this.apiKey && !this.usingMockData;
    console.log(`🔍 [GooglePlaces] API Status - Has Service: ${!!this.autocompleteService}, Has Key: ${!!this.apiKey}, Using Mock: ${this.usingMockData}, Should Use Real: ${shouldUseRealAPI}`);

    // If Google Maps API is available, use it
    if (shouldUseRealAPI) {
      console.log('🔍 [GooglePlaces] Using real Google Places API');
      console.log('🔍 [GooglePlaces] 🔍 API Key starts with:', this.apiKey!.substring(0, 20) + '...');
      
      // Create or reuse session token
      if (!this.sessionToken) {
        this.sessionToken = this.createSessionToken();
      }

      // Get user location for better results
      const userLocation = await this.getUserLocation();
      
      return new Promise((resolve) => {
        const request: any = {
          input: input,
          // Use 'geocode' instead of 'address' for broader results including cities, neighborhoods
          types: ['geocode'],
          componentRestrictions: { country: 'us' },
          sessionToken: this.sessionToken
        };

        // Add location bias if available
        if (userLocation) {
          request.location = new (window as any).google.maps.LatLng(userLocation.lat, userLocation.lng);
          request.radius = 50000; // 50km radius
          console.log(`🔍 [GooglePlaces] Adding location bias: ${userLocation.lat}, ${userLocation.lng}`);
        } else {
          // Default to US center for location bias
          request.location = new (window as any).google.maps.LatLng(39.8283, -98.5795);
          request.radius = 2000000; // 2000km radius to cover most of US
          console.log('🔍 [GooglePlaces] Using default US location bias');
        }

        console.log('🔍 [GooglePlaces] 📋 Request details:', {
          input: request.input,
          types: request.types,
          componentRestrictions: request.componentRestrictions,
          hasLocation: !!request.location,
          radius: request.radius
        });

        this.autocompleteService.getPlacePredictions(
          request,
          (predictions: any[], status: string) => {
            console.log(`🔍 [GooglePlaces] API Response - Status: ${status}, Predictions: ${predictions?.length || 0}`);
            
            if (status === 'OK' && predictions) {
              console.log(`🔍 [GooglePlaces] ✅ Successfully got ${predictions.length} real predictions`);
              console.log(`🔍 [GooglePlaces] 📋 First prediction:`, predictions[0]);
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
              if (status === 'REQUEST_DENIED') {
                console.error('🔍 [GooglePlaces] ❌ REQUEST_DENIED - This usually means:');
                console.error('  1. API key is invalid or expired');
                console.error('  2. Places API is not enabled for this key');
                console.error('  3. Billing is not set up');
                console.error('  4. API key restrictions are blocking the request');
              }
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
            fields: ['place_id', 'formatted_address', 'address_components', 'geometry'],
            sessionToken: this.sessionToken
          },
          (place: any, status: string) => {
            console.log(`📍 [GooglePlaces] Details API Response - Status: ${status}`);
            
            // Clear session token after use
            this.sessionToken = null;
            
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
