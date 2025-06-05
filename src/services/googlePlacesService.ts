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

  constructor() {
    console.log('GooglePlacesService initialized');
  }

  private async loadGoogleMapsAPI(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    if (this.isLoaded || (window as any).google?.maps?.places) {
      this.initializeServices();
      return;
    }

    this.loadingPromise = new Promise(async (resolve, reject) => {
      try {
        console.log('Loading Google Maps API...');
        
        // Get API key from server
        this.apiKey = await getGoogleMapsApiKey();
        
        if (!this.apiKey) {
          console.warn('Google Maps API key not available, using mock data');
          this.isLoaded = true;
          resolve();
          return;
        }

        console.log('Google Maps API key retrieved, loading script...');

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          this.isLoaded = true;
          this.initializeServices();
          console.log('Google Maps API loaded successfully');
          resolve();
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API script');
          this.isLoaded = true; // Use mock data as fallback
          resolve(); // Don't reject, use mock data
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        this.isLoaded = true; // Use mock data as fallback
        resolve(); // Don't reject, use mock data
      }
    });

    return this.loadingPromise;
  }

  private initializeServices(): void {
    const googleMaps = (window as any).google?.maps?.places;
    if (googleMaps) {
      this.autocompleteService = new googleMaps.AutocompleteService();
      // Create a temporary div for PlacesService
      const div = document.createElement('div');
      const map = new (window as any).google.maps.Map(div);
      this.placesService = new googleMaps.PlacesService(map);
      console.log('Google Places services initialized');
    }
  }

  async getAddressPredictions(input: string): Promise<GooglePlacesPrediction[]> {
    if (!input || input.length < 3) {
      return [];
    }

    console.log('Getting address predictions for:', input);
    await this.loadGoogleMapsAPI();

    // If Google Maps API is available, use it
    if (this.autocompleteService && this.apiKey) {
      console.log('Using Google Places API for predictions');
      return new Promise((resolve) => {
        this.autocompleteService.getPlacePredictions(
          {
            input: input,
            types: ['address'],
            componentRestrictions: { country: 'us' }
          },
          (predictions: any[], status: string) => {
            if (status === 'OK' && predictions) {
              console.log(`Google Places API returned ${predictions.length} predictions`);
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
              console.warn('Google Places API error:', status, 'falling back to mock data');
              resolve(this.getMockPredictions(input));
            }
          }
        );
      });
    }

    // Fallback to mock data
    console.log('Using mock predictions for:', input);
    return this.getMockPredictions(input);
  }

  async getPlaceDetails(placeId: string): Promise<StandardizedAddress | null> {
    console.log('Getting place details for:', placeId);
    await this.loadGoogleMapsAPI();

    // If Google Maps API is available, use it
    if (this.placesService && this.apiKey && !placeId.startsWith('mock_')) {
      console.log('Using Google Places API for place details');
      return new Promise((resolve) => {
        this.placesService.getDetails(
          {
            placeId: placeId,
            fields: ['place_id', 'formatted_address', 'address_components', 'geometry']
          },
          (place: any, status: string) => {
            if (status === 'OK' && place) {
              console.log('Google Places API returned place details');
              const standardizedAddress = this.parseGooglePlaceDetails(place);
              resolve(standardizedAddress);
            } else {
              console.warn('Google Places Details API error:', status, 'falling back to mock data');
              resolve(this.getMockPlaceDetails(placeId));
            }
          }
        );
      });
    }

    // Fallback to mock data
    console.log('Using mock place details for:', placeId);
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
