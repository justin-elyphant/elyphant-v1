
import React from "react";
import FavoritesDropdown from "../FavoritesDropdown";
import OptimizedShoppingCartButton from "./OptimizedShoppingCartButton";

interface MarketplaceTopNavProps {
  onSignUpRequired: () => void;
}

const MarketplaceTopNav: React.FC<MarketplaceTopNavProps> = ({ onSignUpRequired }) => {
  return (
    <div className="flex items-center gap-4">
      <FavoritesDropdown onSignUpRequired={onSignUpRequired} />
      <OptimizedShoppingCartButton />
    </div>
  );
};

export default MarketplaceTopNav;
