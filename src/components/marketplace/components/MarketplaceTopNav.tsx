
import React from "react";
import FavoritesDropdown from "../FavoritesDropdown";
import ShoppingCartButton from "./ShoppingCartButton";

interface MarketplaceTopNavProps {
  onSignUpRequired: () => void;
}

const MarketplaceTopNav: React.FC<MarketplaceTopNavProps> = ({ onSignUpRequired }) => {
  return (
    <div className="flex items-center gap-4">
      <FavoritesDropdown onSignUpRequired={onSignUpRequired} />
      <ShoppingCartButton />
    </div>
  );
};

export default MarketplaceTopNav;
