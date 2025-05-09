
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Logo from "./components/Logo";
import SearchBar from "./components/SearchBar";
import CategoriesDropdown from "./components/CategoriesDropdown";
import AuthButtons from "./components/AuthButtons";
import { useCart } from "@/contexts/CartContext";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const { itemCount } = useCart();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto py-3 md:py-4 px-3 md:px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3">
          <div className="flex items-center mb-2 md:mb-0 w-full md:w-auto justify-between">
            <Logo />
            
            {/* Only show cart & auth buttons in top row on mobile */}
            <div className="flex md:hidden items-center gap-3">
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-purple-600 text-white text-xs rounded-full">
                    {itemCount}
                  </Badge>
                )}
              </Link>
              <AuthButtons profileImage={profile?.profile_image} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 w-full justify-center">
            <CategoriesDropdown 
              open={isCategoriesOpen} 
              onOpenChange={setIsCategoriesOpen} 
            />
            <div className="w-full md:w-[500px] lg:w-[600px]">
              <SearchBar />
            </div>
          </div>
          
          {/* Hide this section on mobile as we moved it to top row */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-purple-600 text-white text-xs rounded-full">
                  {itemCount}
                </Badge>
              )}
            </Link>
            <AuthButtons profileImage={profile?.profile_image} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
