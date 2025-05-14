
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "./CountrySelect";
import { StateSelect } from "./StateSelect";
import { ShippingAddress } from "@/types/profile";

interface ShippingAddressFormProps {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
}

export function ShippingAddressForm({ value, onChange }: ShippingAddressFormProps) {
  const handleChange = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      address_line1: e.target.value,
    });
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
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
          value={value.address_line1 || ""}
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
            value={value.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="ZIP Code"
            value={value.zip_code || ""}
            onChange={handleZipCodeChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StateSelect
          value={value.state || ""}
          onChange={(state) => handleChange("state", state)}
        />
        <CountrySelect
          value={value.country || ""}
          onChange={(country) => handleChange("country", country)}
        />
      </div>
    </div>
  );
}
