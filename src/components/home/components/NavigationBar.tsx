
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthButtons from "./AuthButtons";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useViewport } from "@/hooks/useViewport";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import ShoppingCartButton from "@/components/marketplace/components/ShoppingCartButton";

const NavigationBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const { isMobile } = useViewport();
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isMenuOpen ? 'hidden' : '';
      
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMenuOpen, isMobile]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    // Removed wishlists and connections/friends nav items
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-purple-700 flex-shrink-0 h-10 flex items-center">
            Elyphant
          </Link>
          
          {/* Desktop Search Bar (Nicole) - Centered */}
          {!isMobile && (
            <div className="flex-1 flex justify-center px-8">
              <div className="w-full max-w-2xl">
                <AIEnhancedSearchBar />
              </div>
            </div>
          )}
          
          {/* Desktop navigation - now empty since nav items removed */}
          <div className="hidden md:flex items-center space-x-3 h-10">
            {navItems.map((item) => (
              (!item.requireAuth || user) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-purple-700 h-10 flex items-center px-3 ${
                    location.pathname === item.path ? "text-purple-700" : "text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2 h-10">
            <ShoppingCartButton />
            {user && <NotificationBell />}
            <div className="hidden md:flex">
              <AuthButtons profileImage={profile?.profile_image} />
            </div>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size={isMobile ? "touch" : "icon"} 
              onClick={toggleMenu} 
              className="md:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={isMobile ? 24 : 20} /> : <Menu size={isMobile ? 24 : 20} />}
            </Button>
          </div>
        </div>
        
        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-[72px] bg-white z-50 flex flex-col p-4 md:hidden">
            {/* Mobile Search Bar (Nicole) */}
            <div className="mb-6">
              <AIEnhancedSearchBar mobile={true} />
            </div>
            
            <div className="flex flex-col space-y-4 mb-6">
              {navItems.map((item) => (
                (!item.requireAuth || user) && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-base font-medium py-3 px-4 rounded-md min-h-[48px] flex items-center ${
                      location.pathname === item.path
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
            
            <div className="mt-auto px-4 py-4 border-t">
              <AuthButtons profileImage={profile?.profile_image} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
