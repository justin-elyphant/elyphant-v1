
import React, { useEffect } from "react";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { standardizedToForm } from "@/utils/addressStandardization";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
  disabled?: boolean;
}

const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  disabled = false
}: AddressAutocompleteProps) => {
  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    const formAddr = standardizedToForm(standardizedAddress);
    onAddressSelect({
      address: formAddr.street,
      city: formAddr.city,
      state: formAddr.state,
      zipCode: formAddr.zipCode,
      country: formAddr.country
    });
  };

  return (
    <GooglePlacesAutocomplete
      value={value}
      onChange={onChange}
      onAddressSelect={handleGooglePlacesSelect}
      label="Street Address"
      placeholder="Start typing your address..."
      disabled={disabled}
    />
  );
};

export default AddressAutocomplete;
