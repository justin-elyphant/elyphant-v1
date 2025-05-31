
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
import UserButton from "@/components/auth/UserButton";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import BotButton from "@/components/ai-gift-advisor/BotButton";
import GiftAdvisorBot from "@/components/ai-gift-advisor/GiftAdvisorBot";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [botOpen, setBotOpen] = useState(false);
  const isMobile = useIsMobile();

  const alwaysShowSearchAndCategories = true;

  return (
    <header className="sticky top-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-3">
        <ProductProvider>
          {/* Desktop header */}
          {!isMobile && (
            <div className="flex items-center justify-between">
              {/* Left: Logo, Categories, SearchBar */}
              <div className="flex items-center gap-4 flex-1">
                <Link to="/" className="flex items-center mr-4">
                  <Logo />
                </Link>
                {alwaysShowSearchAndCategories && (
                  <div className="flex items-center gap-4 w-auto">
                    <CategoriesDropdown open={categoriesOpen} onOpenChange={setCategoriesOpen} />
                    <div className="w-[480px] max-w-full transition-all duration-200">
                      <SearchBar />
                    </div>
                  </div>
                )}
              </div>
              {/* Right: AI Bot + Cart + Notifications + Auth/Profile */}
              <div className="flex items-center justify-end gap-3">
                <BotButton onClick={() => setBotOpen(true)} />
                <ShoppingCartButton />
                <NotificationsDropdown />
                {user ? (
                  <UserButton />
                ) : (
                  <AuthButtons />
                )}
              </div>
            </div>
          )}

          {/* Mobile header - Enhanced touch targets and spacing */}
          {isMobile && (
            <>
              {/* Hamburger row with improved spacing */}
              <div className="flex items-center justify-between py-2">
                {/* Logo (left) */}
                <div className="flex items-center">
                  <Link to="/">
                    <Logo />
                  </Link>
                </div>
                {/* Right side actions with better touch targets */}
                <div className="flex items-center gap-3">
                  {/* AI Bot button - enhanced for mobile */}
                  <BotButton 
                    onClick={() => setBotOpen(true)} 
                    className="h-12 w-12 p-3 touch-manipulation" 
                  />
                  {/* Shopping cart - enhanced touch target */}
                  <div className="h-12 w-12 flex items-center justify-center">
                    <ShoppingCartButton />
                  </div>
                  {/* Notifications - enhanced touch target */}
                  <div className="h-12 w-12 flex items-center justify-center">
                    <NotificationsDropdown />
                  </div>
                  {/* Hamburger menu - enhanced touch target */}
                  <button
                    className="h-12 w-12 flex items-center justify-center touch-manipulation rounded-lg hover:bg-gray-100 transition-colors"
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

              {/* Mobile Search Bar area with improved spacing */}
              <div className="py-3">
                <div className="flex w-full gap-3 items-center">
                  {/* Enhanced mobile search bar */}
                  <div className="flex-1 min-h-[48px]">
                    <SearchBar mobile />
                  </div>
                  {/* Categories dropdown with proper touch target */}
                  <div className="flex-none min-h-[48px] flex items-center">
                    <CategoriesDropdown
                      open={categoriesOpen}
                      onOpenChange={setCategoriesOpen}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Slide-down menu with enhanced touch targets */}
              {mobileMenuOpen && (
                <div className="py-4 border-t">
                  {!user && (
                    <div className="flex flex-col gap-3 pt-3 border-t mt-4">
                      <Button
                        variant="purple"
                        className="w-full h-12 text-base touch-manipulation"
                        onClick={() => navigate("/signup")}
                      >
                        Sign Up
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-12 text-base touch-manipulation"
                        onClick={() => navigate("/login")}
                      >
                        Log In
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* AI Gift Advisor Bot Modal */}
          <GiftAdvisorBot 
            isOpen={botOpen} 
            onClose={() => setBotOpen(false)} 
          />
        </ProductProvider>
      </div>
    </header>
  );
};

export default Header;
