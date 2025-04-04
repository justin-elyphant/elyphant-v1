
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FavoritesTabContent = () => {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
      <p className="text-muted-foreground mb-4">When you find products you love, save them here for later.</p>
      <Button asChild>
        <Link to="/marketplace">Explore Marketplace</Link>
      </Button>
    </div>
  );
};

export default FavoritesTabContent;
