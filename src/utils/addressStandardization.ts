
import { StandardizedAddress } from '@/services/googlePlacesService';

// Standardized address interface for consistent storage
export interface DatabaseAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  formatted_address?: string;
  place_id?: string;
}

// Form address interface for UI components
export interface FormAddress {
  street: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Convert Google Places result to database format
export function standardizedToDatabase(address: StandardizedAddress): DatabaseAddress {
  return {
    address_line1: address.street,
    city: address.city,
    state: address.state,
    zip_code: address.zipCode,
    country: address.country,
    formatted_address: address.formatted_address,
    place_id: address.place_id
  };
}

// Convert database format to form format
export function databaseToForm(address: DatabaseAddress | null | undefined): FormAddress {
  if (!address) {
    return {
      street: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    };
  }

  return {
    street: address.address_line1 || '',
    addressLine2: address.address_line2 || '',
    city: address.city || '',
    state: address.state || '',
    zipCode: address.zip_code || '',
    country: address.country || 'US'
  };
}

// Convert form format to database format
export function formToDatabase(address: FormAddress): DatabaseAddress {
  return {
    address_line1: address.street,
    address_line2: address.addressLine2,
    city: address.city,
    state: address.state,
    zip_code: address.zipCode,
    country: address.country
  };
}

// Convert standardized address to form format
export function standardizedToForm(address: StandardizedAddress): FormAddress {
  return {
    street: address.street,
    addressLine2: '',
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    country: address.country
  };
}

// Validate address completeness
export function validateAddressCompleteness(address: FormAddress | DatabaseAddress): boolean {
  if ('street' in address) {
    // FormAddress validation
    return !!(
      address.street?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.zipCode?.trim() &&
      address.country?.trim()
    );
  } else {
    // DatabaseAddress validation
    return !!(
      address.address_line1?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.zip_code?.trim() &&
      address.country?.trim()
    );
  }
}

// Format address for display
export function formatAddressForDisplay(address: DatabaseAddress | FormAddress): string {
  if ('street' in address) {
    const parts = [address.street];
    if (address.addressLine2) parts.push(address.addressLine2);
    parts.push(`${address.city}, ${address.state} ${address.zipCode}`);
    return parts.join(', ');
  } else {
    if (address.formatted_address) return address.formatted_address;
    const parts = [address.address_line1];
    if (address.address_line2) parts.push(address.address_line2);
    parts.push(`${address.city}, ${address.state} ${address.zip_code}`);
    return parts.join(', ');
  }
}
