
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import Logo from "./components/Logo";
import AuthButtons from "./components/AuthButtons";
import SearchBar from "./components/SearchBar";
import UserButton from "@/components/auth/UserButton";
import CategoriesDropdown from "./components/CategoriesDropdown";
import { ProductProvider } from "@/contexts/ProductContext";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const location = useLocation();

  const alwaysShowSearchAndCategories =
    // Show on all routes unless Settings (which has its own nav)
    !location.pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation, always show SearchBar and CategoriesDropdown */}
          <div className="hidden md:flex items-center space-x-6">
            {alwaysShowSearchAndCategories && (
              <ProductProvider>
                <CategoriesDropdown
                  open={categoriesOpen}
                  onOpenChange={setCategoriesOpen}
                />
                <div className="w-80">
                  <SearchBar />
                </div>
              </ProductProvider>
            )}
            {/* Only show Marketplace navigation button if not already on it */}
            {location.pathname !== "/marketplace" && (
              <Button
                variant="ghost"
                onClick={() => navigate("/marketplace")}
                className="text-sm font-medium"
              >
                Marketplace
              </Button>
            )}

            {user ? <UserButton /> : <AuthButtons />}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t">
            <ProductProvider>
              {alwaysShowSearchAndCategories && (
                <CategoriesDropdown
                  open={categoriesOpen}
                  onOpenChange={setCategoriesOpen}
                />
              )}
              <div className="flex mb-4">
                <div className="flex-grow">
                  <SearchBar mobile />
                </div>
              </div>
            </ProductProvider>
            {/* Marketplace & Wishlists buttons */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/marketplace")}
            >
              Marketplace
            </Button>
            {/* Auth buttons for mobile */}
            {!user && (
              <div className="flex flex-col gap-2 pt-3 border-t">
                <Button
                  variant="purple"
                  className="w-full"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </Button>
              </div>
            )}
            {/* Add UserButton for mobile signed-in users */}
            {user && (
              <div className="pt-3 border-t">
                <UserButton />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
