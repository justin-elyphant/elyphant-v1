
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import Logo from "./components/Logo";
import AuthButtons from "./components/AuthButtons";
import SearchBar from "./components/SearchBar";
import CategoriesDropdown from "./components/CategoriesDropdown";
import { ProductProvider } from "@/contexts/ProductContext";

/**
 * Clean header with desktop: logo (left), centered categories/search (center), auth (right).
 */
const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Always show search and categories everywhere (including '/')
  const alwaysShowSearchAndCategories = true;

  return (
    <header className="sticky top-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Desktop: 3-grid - Logo (left), Categories+Search (center), Auth (right) */}
        <div className="hidden md:grid grid-cols-3 items-center justify-between">
          {/* Logo (left) */}
          <div className="flex items-center col-span-1">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Center (categories + search bar) */}
          <div className="flex flex-col justify-center items-center col-span-1">
            {alwaysShowSearchAndCategories && (
              <ProductProvider>
                <div className="flex items-center gap-4 w-full justify-center">
                  <CategoriesDropdown
                    open={categoriesOpen}
                    onOpenChange={setCategoriesOpen}
                  />
                  <div className="w-96 max-w-full transition-all duration-200">
                    <SearchBar />
                  </div>
                </div>
              </ProductProvider>
            )}
          </div>

          {/* Auth (right) */}
          <div className="flex items-center justify-end col-span-1">
            {/* Auth buttons or nothing if user is signed in */}
            {user ? null : <AuthButtons />}
          </div>
        </div>

        {/* Mobile: Hamburger row */}
        <div className="flex md:hidden items-center justify-between">
          {/* Logo (left) */}
          <div className="flex items-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          {/* Hamburger */}
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

        {/* Mobile Slide-down menu: Search/Categories/Auth only, no links */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t">
            <ProductProvider>
              {alwaysShowSearchAndCategories && (
                <div className="flex flex-col gap-4 items-stretch">
                  <div>
                    <CategoriesDropdown
                      open={categoriesOpen}
                      onOpenChange={setCategoriesOpen}
                    />
                  </div>
                  <div>
                    {/* Center the search bar on mobile, add some margin and make it fill parent for better visibility */}
                    <SearchBar mobile />
                  </div>
                </div>
              )}
            </ProductProvider>
            {/* Auth on mobile */}
            {!user && (
              <div className="flex flex-col gap-2 pt-3 border-t mt-4">
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

