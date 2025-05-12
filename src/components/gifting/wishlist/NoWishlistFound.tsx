
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const NoWishlistFound = () => {
  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="flex items-center justify-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-full">
          <Lock className="h-10 w-10" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mt-6">Wishlist Not Available</h2>
      
      <p className="text-muted-foreground mt-3 mb-6">
        This wishlist may be private or no longer available.
      </p>
      
      <div className="flex flex-col gap-3">
        <Button asChild>
          <Link to="/marketplace">Browse Products</Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link to="/wishlists">
            <Eye className="h-4 w-4 mr-2" />
            View My Wishlists
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NoWishlistFound;
