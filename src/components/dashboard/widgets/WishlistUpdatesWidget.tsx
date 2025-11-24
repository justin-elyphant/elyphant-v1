import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { Link } from "react-router-dom";

const WishlistUpdatesWidget = () => {
  const { wishlists } = useUnifiedWishlistSystem();
  const totalItems = wishlists?.reduce((sum, list) => sum + (list.items?.length || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          My Wishlists
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{wishlists?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Active Wishlists</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/wishlists">
              Manage Wishlists
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WishlistUpdatesWidget;
