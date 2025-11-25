import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { Link } from "react-router-dom";

const WishlistUpdatesWidget = () => {
  const { wishlists } = useUnifiedWishlistSystem();
  const totalItems = wishlists?.reduce((sum, list) => sum + (list.items?.length || 0), 0) || 0;
  const wishlistCount = wishlists?.length || 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-3">My Wishlists</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{wishlistCount}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-border">
          <Link 
            to="/wishlists" 
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Manage wishlists
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default WishlistUpdatesWidget;
