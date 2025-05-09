
import React from "react";
import { Product } from "@/contexts/ProductContext";
import StandardProductGrid from "./StandardProductGrid";

interface GroupedProductsType {
  wishlistItems: Product[];
  preferenceItems: Product[];
  regularItems: Product[];
  hasGrouping: boolean;
}

interface GroupedProductSectionProps {
  groupedProducts: GroupedProductsType;
  viewMode: "grid" | "list" | "modern";
  renderProductCard: (product: Product) => React.ReactNode;
}

const GroupedProductSection: React.FC<GroupedProductSectionProps> = ({
  groupedProducts,
  viewMode,
  renderProductCard
}) => {
  const { wishlistItems, preferenceItems, regularItems } = groupedProducts;
  
  return (
    <div className="space-y-8">
      {/* Wishlist items section */}
      {wishlistItems.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">From Your Wishlist</h3>
          <StandardProductGrid
            products={wishlistItems}
            viewMode={viewMode}
            renderProductCard={renderProductCard}
          />
        </div>
      )}
      
      {/* Preference items section */}
      {preferenceItems.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Based on Your Preferences</h3>
          <StandardProductGrid
            products={preferenceItems}
            viewMode={viewMode}
            renderProductCard={renderProductCard}
          />
        </div>
      )}
      
      {/* Regular items section */}
      {regularItems.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">
            {wishlistItems.length > 0 || preferenceItems.length > 0 ? "More Items" : "All Items"}
          </h3>
          <StandardProductGrid
            products={regularItems}
            viewMode={viewMode}
            renderProductCard={renderProductCard}
          />
        </div>
      )}
    </div>
  );
};

export default GroupedProductSection;
