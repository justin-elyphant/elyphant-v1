import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShippingAddress } from "@/types/shipping";
import CountrySelect from "./CountrySelect";
import StateSelect from "./StateSelect";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { FormAddress } from "@/utils/addressStandardization";
import GoogleMapsDebugPanel from "@/components/debug/GoogleMapsDebugPanel";

interface ShippingAddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

export const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({ address, onChange }) => {
  // Convert shipping address to form format for display
  const formAddress: FormAddress = {
    street: address.address_line1 || address.street || '',
    city: address.city || '',
    state: address.state || '',
    zipCode: address.zip_code || address.zipCode || '',
    country: address.country || 'US'
  };

  const handleChange = (field: keyof FormAddress, value: string) => {
    const updatedForm = {
      ...formAddress,
      [field]: value
    };
    
    // Convert back to shipping address format
    const updatedAddress: ShippingAddress = {
      address_line1: updatedForm.street,
      city: updatedForm.city,
      state: updatedForm.state,
      zip_code: updatedForm.zipCode,
      country: updatedForm.country,
      // Legacy compatibility
      street: updatedForm.street,
      zipCode: updatedForm.zipCode
    };
    
    onChange(updatedAddress);
  };

  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    const updatedAddress: ShippingAddress = {
      address_line1: standardizedAddress.street,
      city: standardizedAddress.city,
      state: standardizedAddress.state,
      zip_code: standardizedAddress.zipCode,
      country: standardizedAddress.country,
      formatted_address: standardizedAddress.formatted_address,
      place_id: standardizedAddress.place_id,
      // Legacy compatibility
      street: standardizedAddress.street,
      zipCode: standardizedAddress.zipCode
    };
    
    onChange(updatedAddress);
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <GooglePlacesAutocomplete
          value={formAddress.street}
          onChange={(value) => handleChange("street", value)}
          onAddressSelect={handleGooglePlacesSelect}
          label="Street Address"
          placeholder="Start typing your address..."
        />

        <div className="grid gap-2">
          <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
          <Input
            id="apartment"
            placeholder="Apt, suite, unit, etc."
            value={address.address_line2 || ''}
            onChange={(e) => onChange({ ...address, address_line2: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="City"
            value={formAddress.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="state">State</Label>
            <StateSelect
              value={formAddress.state}
              onChange={(state) => handleChange("state", state)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <CountrySelect
              value={formAddress.country}
              onChange={(country) => handleChange("country", country)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="zipCode">Zip / Postal Code</Label>
          <Input
            id="zipCode"
            placeholder="Zip Code"
            value={formAddress.zipCode}
            onChange={(e) => handleChange("zipCode", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressForm;
