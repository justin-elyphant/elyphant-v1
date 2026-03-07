import React from "react";
import { ProductProvider } from "@/contexts/ProductContext";
import VendorProductsTab from "@/components/vendor/VendorProductsTab";

const VendorProductsPage: React.FC = () => {
  return (
    <ProductProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product catalog.
          </p>
        </div>
        <VendorProductsTab />
      </div>
    </ProductProvider>
  );
};

export default VendorProductsPage;
