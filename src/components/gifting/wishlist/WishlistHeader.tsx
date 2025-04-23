
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface WishlistHeaderProps {
  onCreateNew: () => void;
}

const WishlistHeader = ({ onCreateNew }: WishlistHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-6">
      <Button variant="outline" asChild>
        <Link to="/marketplace" className="flex items-center">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Shop Marketplace
        </Link>
      </Button>
      <Button onClick={onCreateNew}>
        <Plus className="h-4 w-4 mr-2" />
        New Wishlist
      </Button>
    </div>
  );
};

export default WishlistHeader;
