
import React from "react";
import { TextField } from "../form-fields/TextField";
import { SelectField } from "../form-fields/SelectField";
import { UseFormReturn } from "react-hook-form";
import { VendorFormValues } from "../vendorSchema";

interface IntegrationSectionProps {
  form: UseFormReturn<VendorFormValues>;
}

export const IntegrationSection = ({ form }: IntegrationSectionProps) => {
  const integrationOptions = [
    { value: "shopify", label: "Shopify Store" },
    { value: "directapi", label: "Direct API" },
    { value: "manual", label: "Manual Product Upload" }
  ];

  return (
    <div className="space-y-4">
      <SelectField
        control={form.control}
        name="integrationType"
        label="Integration Type"
        placeholder="Select an integration type"
        description="Choose how we'll import your products to our marketplace."
        options={integrationOptions}
      />
      
      <TextField
        control={form.control}
        name="productCategories"
        label="Product Categories"
        placeholder="e.g., Electronics, Clothing, Home Goods"
        description="List the main categories of products you sell."
      />
    </div>
  );
};
