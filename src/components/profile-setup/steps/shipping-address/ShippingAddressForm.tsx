
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "./CountrySelect";
import { StateSelect } from "./StateSelect";
import { ShippingAddress } from "@/types/shipping";

interface ShippingAddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

export function ShippingAddressForm({ address, onChange }: ShippingAddressFormProps) {
  const handleChange = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({
      ...address,
      [field]: fieldValue,
    });
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...address,
      address_line1: e.target.value,
    });
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...address,
      zip_code: e.target.value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          placeholder="123 Main St"
          value={address.address_line1 || ""}
          onChange={handleStreetChange}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="City"
            value={address.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="ZIP Code"
            value={address.zip_code || ""}
            onChange={handleZipCodeChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StateSelect
          value={address.state || ""}
          onChange={(state) => handleChange("state", state)}
        />
        <CountrySelect
          value={address.country || ""}
          onChange={(country) => handleChange("country", country)}
        />
      </div>
    </div>
  );
}
