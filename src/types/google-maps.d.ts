
declare namespace google {
  namespace maps {
    namespace places {
      class AutocompleteService {
        constructor();
        getPlacePredictions(
          request: google.maps.places.AutocompletionRequest,
          callback: (
            predictions: google.maps.places.AutocompletePrediction[] | null,
            status: google.maps.places.PlacesServiceStatus
          ) => void
        ): void;
      }

      class PlacesService {
        constructor(attrContainer: HTMLDivElement | google.maps.Map);
        getDetails(
          request: google.maps.places.PlaceDetailsRequest,
          callback: (
            place: google.maps.places.PlaceResult | null,
            status: google.maps.places.PlacesServiceStatus
          ) => void
        ): void;
      }

      interface AutocompletionRequest {
        input: string;
        types?: string[];
        componentRestrictions?: {
          country: string | string[];
        };
      }

      interface AutocompletePrediction {
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
      }

      interface PlaceResult {
        place_id: string;
        formatted_address: string;
        address_components: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
        geometry: {
          location: {
            lat(): number;
            lng(): number;
          };
        };
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: any);
    }
  }
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export {};
