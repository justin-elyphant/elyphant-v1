
import React, { useState } from "react";
import { CategoriesSidebar } from "./products/CategoriesSidebar";
import { ProductSettingsCard } from "./products/ProductSettingsCard";
import { ProductContent } from "./products/ProductContent";

const VendorProductsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Categories Sidebar */}
      <div className="md:col-span-1">
        <CategoriesSidebar 
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory} 
        />
        
        <ProductSettingsCard />
      </div>

      {/* Products Section */}
      <div className="md:col-span-3">
        <ProductContent 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeCategory={activeCategory}
          fulfillmentFilter={fulfillmentFilter}
          setFulfillmentFilter={setFulfillmentFilter}
        />
      </div>
    </div>
  );
};

export default VendorProductsTab;
