
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
 * Clean header: only logo, search, categories, auth; no "Connections/Profile/Dashboard/Marketplace" links.
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
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Desktop: Only Categories + Search + Auth */}
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

            {/* Auth buttons or nothing if user is signed in */}
            {user ? null : <AuthButtons />}
          </div>

          {/* Mobile: Hamburger menu */}
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
            {/* Auth on mobile */}
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
            {/* No links for signed-in user */}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

