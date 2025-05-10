
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import AuthButtons from "./components/AuthButtons";
import Logo from "./components/Logo";
import SearchBar from "./components/SearchBar";
import CategoriesDropdown from "./components/CategoriesDropdown";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ContextualHelp from "@/components/help/ContextualHelp";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Determine if the current route is the homepage
  const isHomePage = location.pathname === "/";

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Logo />

        {/* Search Bar (conditionally render on non-homepage) */}
        {!isHomePage && (
          <div className="flex-grow max-w-md mx-4">
            <SearchBar />
          </div>
        )}

        {/* Navigation and Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <CategoriesDropdown 
            open={isCategoriesOpen} 
            onOpenChange={setIsCategoriesOpen} 
          />
          <ContextualHelp
            id="categoriesHelp"
            content="Browse gifts by category to find the perfect present."
          >
            <span>Categories</span>
          </ContextualHelp>
          <Link to="/marketplace" className="hover:text-gray-600 transition-colors">
            Marketplace
          </Link>
          <ContextualHelp
            id="marketplaceHelp"
            content="Explore a wide range of products in our marketplace."
          >
            <span>Marketplace</span>
          </ContextualHelp>
          <Link to="/gifting" className="hover:text-gray-600 transition-colors">
            Gifting
          </Link>
          <ContextualHelp
            id="giftingHelp"
            content="Find personalized gift recommendations for your friends."
          >
            <span>Gifting</span>
          </ContextualHelp>
          <Link to="/wishlists" className="hover:text-gray-600 transition-colors">
            Wishlists
          </Link>
          <ContextualHelp
            id="wishlistsHelp"
            content="Create and manage your wishlists to share with others."
          >
            <span>Wishlists</span>
          </ContextualHelp>
          <NotificationCenter className="md:block hidden" />
          <AuthButtons />
        </div>

        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Toggle Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between px-4 py-6">
                  <Logo />
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Close menu">
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                </div>
                <div className="py-4">
                  <CategoriesDropdown 
                    open={isCategoriesOpen}
                    onOpenChange={setIsCategoriesOpen}
                  />
                  <Link
                    to="/marketplace"
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/gifting"
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Gifting
                  </Link>
                  <Link
                    to="/wishlists"
                    className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Wishlists
                  </Link>
                </div>
              </div>
              <div className="p-4">
                <AuthButtons />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
