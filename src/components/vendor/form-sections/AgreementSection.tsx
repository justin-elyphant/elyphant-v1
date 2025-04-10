
import React from "react";
import { CheckboxField } from "../form-fields/CheckboxField";
import { UseFormReturn } from "react-hook-form";
import { VendorFormValues } from "../vendorSchema";
import { MarketplaceModelCard } from "../MarketplaceModelCard";

interface AgreementSectionProps {
  form: UseFormReturn<VendorFormValues>;
}

export const AgreementSection = ({ form }: AgreementSectionProps) => {
  return (
    <div className="space-y-4">
      <MarketplaceModelCard />
      
      <CheckboxField
        control={form.control}
        name="markupAcknowledgment"
        label="I understand the 30% markup model"
        description="I acknowledge that Elyphant will list my products with a 30% markup and handle all customer interactions and payments."
      />
      
      <CheckboxField
        control={form.control}
        name="acceptTerms"
        label="I accept the terms and conditions"
        description="By checking this box, you agree to our terms of service, privacy policy, and vendor agreement."
      />
    </div>
  );
};
