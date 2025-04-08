
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShippingAddress } from "@/types/supabase";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";

interface ShippingAddressStepProps {
  value: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

// Common countries for shipping
const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "Mexico",
  "India"
];

const ShippingAddressStep: React.FC<ShippingAddressStepProps> = ({ value, onChange }) => {
  const handleChange = (field: keyof ShippingAddress, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleAddressSelect = (fullAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    onChange({
      street: fullAddress.address,
      city: fullAddress.city,
      state: fullAddress.state,
      zipCode: fullAddress.zipCode,
      country: fullAddress.country || value.country
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Where should gifts be delivered?</h3>
        <p className="text-sm text-muted-foreground">
          Your address is only shared with friends you explicitly allow
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="autocomplete">Street Address</Label>
          <AddressAutocomplete
            value={value.street}
            onChange={(val) => handleChange('street', val)}
            onAddressSelect={handleAddressSelect}
          />
          <p className="text-xs text-muted-foreground">
            Start typing to see address suggestions
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={value.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              placeholder="State/Province"
              value={value.state}
              onChange={(e) => handleChange('state', e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              placeholder="ZIP/Postal Code"
              value={value.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select 
              value={value.country} 
              onValueChange={(val) => handleChange('country', val)}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressStep;
