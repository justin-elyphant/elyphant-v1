
import React from "react";
import MarketplaceContent from "./MarketplaceContent";

const MarketplaceWrapper: React.FC = () => {
  console.log("MarketplaceWrapper rendering");
  
  return (
    <div className="marketplace-container">
      <MarketplaceContent />
    </div>
  );
};

export default MarketplaceWrapper;
