
/**
 * Standardized ShippingAddress interface to be used across the application
 * CRITICAL: phone field is required for Zinc API delivery notifications
 */
export interface ShippingAddress {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;  // Using standard database naming
  country?: string;
  phone?: string;     // Required for Zinc/carrier delivery notifications
  is_default?: boolean;
  formatted_address?: string;  // Added to support Google Places
  place_id?: string;           // Added to support Google Places
  is_verified?: boolean;       // True if validated by Google Address Validation API
  verified_at?: string;        // Timestamp of verification
  // Legacy compatibility fields (deprecated - use address_line1 and zip_code)
  street?: string;
  zipCode?: string;
}

/**
 * Mapping functions for converting between form and API formats
 */
export function mapFormToApiAddress(formAddress: any): ShippingAddress {
  if (!formAddress) return {};
  
  return {
    address_line1: formAddress.street || '',
    city: formAddress.city || '',
    state: formAddress.state || '',
    zip_code: formAddress.zipCode || '',
    country: formAddress.country || '',
    phone: formAddress.phone || '',
    is_default: true,
    // Legacy compatibility
    street: formAddress.street || '',
    zipCode: formAddress.zipCode || ''
  };
}

export function mapApiToFormAddress(apiAddress: ShippingAddress): any {
  if (!apiAddress) return {};
  
  return {
    street: apiAddress.address_line1 || apiAddress.street || '',
    city: apiAddress.city || '',
    state: apiAddress.state || '',
    zipCode: apiAddress.zip_code || apiAddress.zipCode || '',
    country: apiAddress.country || '',
    phone: apiAddress.phone || ''
  };
}
