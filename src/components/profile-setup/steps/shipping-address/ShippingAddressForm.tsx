
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShippingAddress } from "@/types/profile";
import CountrySelect from "./CountrySelect";
import StateSelect from "./StateSelect";

interface ShippingAddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

export const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({ address, onChange }) => {
  // Convert between API and form formats
  const formAddress = {
    street: address.address_line1 || address.street || "",
    city: address.city || "",
    state: address.state || "",
    zipCode: address.zip_code || address.zipCode || "",
    country: address.country || "US"
  };

  const handleChange = (field: string, value: string) => {
    // Update the form data
    const updatedForm = {
      ...formAddress,
      [field]: value
    };
    
    // Convert back to API format when calling onChange
    onChange({
      address_line1: updatedForm.street,
      city: updatedForm.city,
      state: updatedForm.state,
      zip_code: updatedForm.zipCode,
      country: updatedForm.country,
      // Add aliases for compatibility
      street: updatedForm.street,
      zipCode: updatedForm.zipCode
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          placeholder="123 Main St"
          value={formAddress.street}
          onChange={(e) => handleChange("street", e.target.value)}
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
  );
};

export default ShippingAddressForm;
