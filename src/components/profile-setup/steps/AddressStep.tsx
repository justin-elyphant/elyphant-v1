import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileData } from "../hooks/types";
import { ShippingAddress } from "@/hooks/settings/types";

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

  const handleChange = (field: string, fieldValue: string) => {
    updateProfileData('address', {
      ...currentAddress,
      [field]: fieldValue
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
        <div className="grid gap-2">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            placeholder="123 Main St"
            value={currentAddress.street || ""}
            onChange={(e) => handleChange("street", e.target.value)}
          />
        </div>

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
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="City"
            value={currentAddress.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="State"
              value={currentAddress.state || ""}
              onChange={(e) => handleChange("state", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              placeholder="ZIP Code"
              value={currentAddress.zipCode || ""}
              onChange={(e) => handleChange("zipCode", e.target.value)}
            />
          </div>
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
      </div>
    </div>
  );
};

export default AddressStep;
