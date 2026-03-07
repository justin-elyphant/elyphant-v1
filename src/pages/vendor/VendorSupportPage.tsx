import React from "react";
import VendorSupportTab from "@/components/vendor/VendorSupportTab";

const VendorSupportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Support & Returns
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage customer support requests.
        </p>
      </div>
      <VendorSupportTab />
    </div>
  );
};

export default VendorSupportPage;
