
import React from "react";
import ShippingAddressStep from "./ShippingAddressStep";
import { ProfileData } from "../hooks/types";

interface AddressStepProps {
  profileData: ProfileData;
  updateProfileData: (field: keyof ProfileData, value: any) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({ profileData, updateProfileData }) => {
  return (
    <ShippingAddressStep
      value={profileData.shipping_address}
      onChange={(address) => updateProfileData("shipping_address", address)}
    />
  );
};

export default AddressStep;
