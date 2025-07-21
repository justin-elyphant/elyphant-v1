import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileData } from "../hooks/types";
import { ShippingAddress } from "@/hooks/settings/types";
import AddressAutocomplete from "@/components/settings/AddressAutocomplete";

interface AddressStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({ profileData, updateProfileData }) => {
  const defaultAddress: ShippingAddress = {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US"
  };
  
  const currentAddress: ShippingAddress = (profileData.address && Object.keys(profileData.address).length > 0) 
    ? profileData.address 
    : defaultAddress;

  const [addressQuery, setAddressQuery] = useState(currentAddress.street || "");

  const handleChange = (field: string, fieldValue: string) => {
    updateProfileData('address', {
      ...currentAddress,
      [field]: fieldValue
    });
  };

  const handleAddressSelect = (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    updateProfileData('address', {
      ...currentAddress,
      street: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Where should gifts be delivered?</h3>
        <p className="text-sm text-muted-foreground">
          This address will be used for gift deliveries
        </p>
      </div>
      
      <div className="grid gap-4">
        <AddressAutocomplete
          value={addressQuery}
          onChange={setAddressQuery}
          onAddressSelect={handleAddressSelect}
        />

        <div className="grid gap-2">
          <Label htmlFor="line2">Apartment, Suite, Unit, etc. (optional)</Label>
          <Input
            id="line2"
            placeholder="Apt 2B, Suite 100, Unit 4..."
            value={currentAddress.line2 || ""}
            onChange={(e) => handleChange("line2", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="country">Country</Label>
          <Select value={currentAddress.country || "US"} onValueChange={(country) => handleChange("country", country)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show selected address details for confirmation */}
        {(currentAddress.street || currentAddress.city) && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Selected Address:</p>
            <div className="space-y-1 text-sm">
              <p>{currentAddress.street}</p>
              <p>{currentAddress.city}, {currentAddress.state} {currentAddress.zipCode}</p>
              <p>{currentAddress.country}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressStep;
