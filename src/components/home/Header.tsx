
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

const Header = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const { itemCount } = useCart();
  const { profile } = useProfile();
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center mb-3 md:mb-0">
            <Logo />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-center">
            <CategoriesDropdown 
              open={isCategoriesOpen} 
              onOpenChange={setIsCategoriesOpen} 
            />
            <div className="w-full md:w-[500px] lg:w-[600px]">
              <SearchBar />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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
