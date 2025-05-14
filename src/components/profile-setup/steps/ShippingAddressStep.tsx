
import React from "react";
import { ShippingAddress } from "@/types/shipping";
import ShippingAddressHeader from "./shipping-address/ShippingAddressHeader";
import { ShippingAddressForm } from "./shipping-address/ShippingAddressForm";

interface ShippingAddressStepProps {
  value: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

const ShippingAddressStep: React.FC<ShippingAddressStepProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-6">
      <ShippingAddressHeader />
      <ShippingAddressForm address={value} onChange={onChange} />
    </div>
  );
};

export default ShippingAddressStep;
