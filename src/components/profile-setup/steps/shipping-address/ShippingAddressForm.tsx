
import React from "react";
import { ShippingAddress } from "@/types/supabase";
import AddressSearchField from "./AddressSearchField";
import CityStateFields from "./CityStateFields";
import ZipCountryFields from "./ZipCountryFields";

interface ShippingAddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({ 
  address, 
  onChange 
}) => {
  const handleChange = (field: keyof ShippingAddress, value: string) => {
    onChange({
      ...address,
      [field]: value
    });
  };

  const handleAddressSelect = (selectedAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    onChange({
      street: selectedAddress.address,
      city: selectedAddress.city,
      state: selectedAddress.state,
      zipCode: selectedAddress.zipCode,
      country: selectedAddress.country || address.country
    });
  };

  return (
    <div className="space-y-4">
      <AddressSearchField 
        value={address.street || ""}
        onChange={(value) => handleChange('street', value)}
        onAddressSelect={handleAddressSelect}
      />
      
      <CityStateFields 
        cityValue={address.city || ""}
        stateValue={address.state || ""}
        onCityChange={(value) => handleChange('city', value)}
        onStateChange={(value) => handleChange('state', value)}
      />
      
      <ZipCountryFields 
        zipValue={address.zipCode || ""}
        countryValue={address.country || ""}
        onZipChange={(value) => handleChange('zipCode', value)}
        onCountryChange={(value) => handleChange('country', value)}
      />
    </div>
  );
};

export default ShippingAddressForm;
