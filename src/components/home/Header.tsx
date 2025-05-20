
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
import ShoppingCartButton from "@/components/marketplace/components/ShoppingCartButton";
import UserAvatarMenu from "@/components/user/UserAvatarMenu";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

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
        {/* Desktop: Flex - Logo, Categories, SearchBar (left), Auth (right) */}
        <div className="hidden md:flex items-center justify-between">
          {/* Left: Logo, Categories, SearchBar */}
          <div className="flex items-center gap-4 flex-1">
            <Link to="/" className="flex items-center mr-4">
              <Logo />
            </Link>
            {alwaysShowSearchAndCategories && (
              <ProductProvider>
                <div className="flex items-center gap-4 w-auto">
                  <CategoriesDropdown open={categoriesOpen} onOpenChange={setCategoriesOpen} />
                  <div className="w-[480px] max-w-full transition-all duration-200">
                    <SearchBar />
                  </div>
                </div>
              </ProductProvider>
            )}
          </div>
          {/* Right: Cart + Notifications + Auth/Profile */}
          <div className="flex items-center justify-end gap-2">
            <ShoppingCartButton />
            <NotificationsDropdown />
            {user ? (
              <UserAvatarMenu />
            ) : (
              <AuthButtons />
            )}
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
          <div className="flex items-center gap-2">
            {/* Shopping cart icon on mobile */}
            <ShoppingCartButton />
            {/* Notifications bell on mobile */}
            <NotificationsDropdown />
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
        </div>

        {/* Mobile Search Bar area with just ONE CategoriesDropdown */}
        <div className="block md:hidden mt-3">
          <ProductProvider>
            <div className="flex w-full gap-3 items-center">
              {/* Prominently show the mobile search bar */}
              <div className="flex-1">
                <SearchBar mobile />
              </div>
              {/* Only one CategoriesDropdown on mobile */}
              <div className="flex-none">
                <CategoriesDropdown
                  open={categoriesOpen}
                  onOpenChange={setCategoriesOpen}
                />
              </div>
            </div>
          </ProductProvider>
        </div>

        {/* Mobile Slide-down menu: Auth only, no search/categories */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t">
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
