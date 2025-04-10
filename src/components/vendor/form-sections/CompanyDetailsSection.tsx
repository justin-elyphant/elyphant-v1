
import React from "react";
import { TextField } from "../form-fields/TextField";
import { UseFormReturn } from "react-hook-form";
import { VendorFormValues } from "../vendorSchema";

interface CompanyDetailsSectionProps {
  form: UseFormReturn<VendorFormValues>;
}

export const CompanyDetailsSection = ({ form }: CompanyDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <TextField
        control={form.control}
        name="companyName"
        label="Company Name"
        placeholder="Your company name"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          control={form.control}
          name="email"
          label="Email Address"
          placeholder="contact@company.com"
        />
        
        <TextField
          control={form.control}
          name="website"
          label="Website"
          placeholder="https://yourcompany.com"
        />
      </div>
    </div>
  );
};
