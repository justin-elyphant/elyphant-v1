
/**
 * Standardized ShippingAddress interface to be used across the application
 */
export interface ShippingAddress {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;  // Using standard database naming
  country?: string;
  is_default?: boolean;
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
    is_default: true
  };
}

export function mapApiToFormAddress(apiAddress: ShippingAddress): any {
  if (!apiAddress) return {};
  
  return {
    street: apiAddress.address_line1 || '',
    city: apiAddress.city || '',
    state: apiAddress.state || '',
    zipCode: apiAddress.zip_code || '',
    country: apiAddress.country || ''
  };
}
