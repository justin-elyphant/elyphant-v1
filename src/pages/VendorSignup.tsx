
import React from "react";
import { VendorApplicationForm } from "@/components/vendor/VendorApplicationForm";
import { VendorBenefitsCard } from "@/components/vendor/VendorBenefitsCard";

const VendorSignup = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Become a Vendor</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <VendorApplicationForm />
        </div>
        <div>
          <VendorBenefitsCard />
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;
