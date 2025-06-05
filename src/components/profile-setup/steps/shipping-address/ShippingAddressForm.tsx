
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShippingAddress } from "@/types/profile";
import CountrySelect from "./CountrySelect";
import StateSelect from "./StateSelect";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { databaseToForm, formToDatabase, standardizedToForm } from "@/utils/addressStandardization";

interface ShippingAddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

export const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({ address, onChange }) => {
  // Convert database format to form format for display
  const formAddress = databaseToForm(address);

  const handleChange = (field: string, value: string) => {
    const updatedForm = {
      ...formAddress,
      [field]: value
    };
    
    // Convert back to database format when calling onChange
    const dbAddress = formToDatabase(updatedForm);
    onChange({
      ...dbAddress,
      // Add aliases for compatibility
      street: dbAddress.address_line1,
      zipCode: dbAddress.zip_code
    });
  };

  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    const formAddr = standardizedToForm(standardizedAddress);
    const dbAddress = formToDatabase(formAddr);
    
    onChange({
      ...dbAddress,
      formatted_address: standardizedAddress.formatted_address,
      place_id: standardizedAddress.place_id,
      // Add aliases for compatibility
      street: dbAddress.address_line1,
      zipCode: dbAddress.zip_code
    });
  };

  return (
    <div className="grid gap-4">
      <GooglePlacesAutocomplete
        value={formAddress.street}
        onChange={(value) => handleChange("street", value)}
        onAddressSelect={handleGooglePlacesSelect}
        label="Street Address"
        placeholder="Start typing your address..."
      />

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
  );
};

export default ShippingAddressForm;
