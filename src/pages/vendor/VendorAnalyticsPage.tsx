import React from "react";
import VendorAnalyticsTab from "@/components/vendor/VendorAnalyticsTab";

const VendorAnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your product and sales performance.
        </p>
      </div>
      <VendorAnalyticsTab />
    </div>
  );
};

export default VendorAnalyticsPage;
