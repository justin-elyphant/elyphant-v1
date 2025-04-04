
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import AddressAutocomplete from "./AddressAutocomplete";

interface AddressSectionProps {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleAddressAutocomplete: (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  address,
  handleChange,
  handleAddressAutocomplete
}) => {
  const handleStreetChange = (value: string) => {
    // Create a synthetic event object to match the handleChange function's expected parameters
    const syntheticEvent = {
      target: {
        name: "address.street",
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleChange(syntheticEvent);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Shipping Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <AddressAutocomplete
            value={address.street}
            onChange={handleStreetChange}
            onAddressSelect={handleAddressAutocomplete}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input 
            id="city"
            name="address.city"
            value={address.city}
            onChange={handleChange}
            placeholder="New York"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input 
            id="state"
            name="address.state"
            value={address.state}
            onChange={handleChange}
            placeholder="NY"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="zipCode">Postal/Zip Code</Label>
          <Input 
            id="zipCode"
            name="address.zipCode"
            value={address.zipCode}
            onChange={handleChange}
            placeholder="10001"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input 
            id="country"
            name="address.country"
            value={address.country}
            onChange={handleChange}
            placeholder="United States"
          />
        </div>
      </div>
    </div>
  );
};

export default AddressSection;
