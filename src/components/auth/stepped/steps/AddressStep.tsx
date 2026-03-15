import React from "react";
import StepLayout from "../StepLayout";
import { ShippingAddressForm } from "@/components/profile-setup/steps/shipping-address/ShippingAddressForm";
import { ShippingAddress } from "@/types/shipping";

interface AddressStepProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const AddressStep: React.FC<AddressStepProps> = ({
  address,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}) => {
  const isValid =
    !!(address.address_line1 || address.street) &&
    !!address.city &&
    !!address.state &&
    !!(address.zip_code || address.zipCode);

  return (
    <StepLayout
      heading="Where should gifts be delivered?"
      subtitle="Add your shipping address so friends can send you gifts directly"
      onNext={onNext}
      onBack={onBack}
      isNextDisabled={!isValid}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      <ShippingAddressForm
        address={address}
        onChange={onChange}
        showVerification={false}
      />
    </StepLayout>
  );
};

export default AddressStep;
