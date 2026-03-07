import React from "react";
import AdvertisingDashboard from "@/components/marketplace/AdvertisingDashboard";

const VendorAdvertisingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Advertising
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage sponsored ads and promotions.
        </p>
      </div>
      <AdvertisingDashboard />
    </div>
  );
};

export default VendorAdvertisingPage;
