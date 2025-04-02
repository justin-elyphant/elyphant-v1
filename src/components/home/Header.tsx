
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Gift className="h-6 w-6 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold">Elyphant</h1>
        </div>
        <nav className="flex items-center space-x-4">
          <Link to="/gifting" className="text-sm font-medium hover:text-primary">
            Wishlists
          </Link>
          <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Link to="/gifting">
              <Gift className="mr-2 h-4 w-4" />
              Create Wishlist
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
