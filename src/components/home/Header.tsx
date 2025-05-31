
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import Logo from "./components/Logo";
import AuthButtons from "./components/AuthButtons";
import EnhancedSearchBar from "./components/EnhancedSearchBar";
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
  const [botOpen, setBotOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-3">
        <ProductProvider>
          {/* Desktop header */}
          {!isMobile && (
            <div className="flex items-center justify-between">
              {/* Left: Logo and Search */}
              <div className="flex items-center gap-6 flex-1">
                <Link to="/" className="flex items-center">
                  <Logo />
                </Link>
                <div className="flex-1 max-w-2xl">
                  <EnhancedSearchBar />
                </div>
              </div>
              {/* Right: AI Bot + Cart + Notifications + Auth/Profile */}
              <div className="flex items-center gap-3">
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

          {/* Mobile header - Restructured */}
          {isMobile && (
            <>
              {/* Top row: Logo + Action buttons */}
              <div className="flex items-center justify-between mb-3">
                {/* Logo (left) */}
                <div className="flex items-center">
                  <Link to="/">
                    <Logo />
                  </Link>
                </div>
                
                {/* Action buttons (right) - Properly spaced */}
                <div className="flex items-center gap-2">
                  {/* AI Bot - Icon only */}
                  <BotButton onClick={() => setBotOpen(true)} />
                  
                  {/* Shopping cart */}
                  <div className="h-12 w-12 flex items-center justify-center">
                    <ShoppingCartButton />
                  </div>
                  
                  {/* Notifications */}
                  <div className="h-12 w-12 flex items-center justify-center">
                    <NotificationsDropdown />
                  </div>
                  
                  {/* Hamburger menu */}
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

              {/* Search row - Enhanced with integrated categories */}
              <div className="mb-2">
                <EnhancedSearchBar mobile />
              </div>

              {/* Mobile menu */}
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
