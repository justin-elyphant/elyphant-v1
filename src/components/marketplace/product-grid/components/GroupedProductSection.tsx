import React from "react";
import { Product } from "@/contexts/ProductContext";

interface GroupedProductData {
  wishlistItems: Product[];
  preferenceItems: Product[];
  regularItems: Product[];
  hasGrouping: boolean;
}

interface GroupedProductSectionProps {
  groupedProducts: GroupedProductData;
  viewMode: "grid" | "list" | "modern";
  renderProductCard: (product: Product) => React.ReactNode;
}

const GroupedProductSection: React.FC<GroupedProductSectionProps> = ({ 
  groupedProducts, 
  viewMode, 
  renderProductCard 
}) => {
  const getGridClassNames = () => {
    return viewMode === 'modern' 
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
      : viewMode === 'grid' 
        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6' 
        : 'space-y-4';
  };
  
  return (
    <>
      {/* Wishlist items section */}
      {groupedProducts.wishlistItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">From Wishlist</h3>
          <div className={getGridClassNames()}>
            {groupedProducts.wishlistItems.map(renderProductCard)}
          </div>
        </div>
      )}
      
      {/* Preference-based items section */}
      {groupedProducts.preferenceItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Based on Preferences</h3>
          <div className={getGridClassNames()}>
            {groupedProducts.preferenceItems.map(renderProductCard)}
          </div>
        </div>
      )}
      
      {/* Other recommended items section */}
      {groupedProducts.regularItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">More Recommendations</h3>
          <div className={getGridClassNames()}>
            {groupedProducts.regularItems.map(renderProductCard)}
          </div>
        </div>
      )}
    </>
  );
};

export default GroupedProductSection;
