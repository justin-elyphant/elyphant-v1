
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthButtons from "./AuthButtons";
import UserButton from "@/components/auth/UserButton";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { useViewport } from "@/hooks/useViewport";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import CategoryFilterBar from "./CategoryFilterBar";
import ShoppingCartButton from "@/components/marketplace/components/ShoppingCartButton";

const NavigationBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const { isMobile } = useViewport();
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchModalOpen(false);
  }, [location.pathname]);
  
  // Prevent body scroll when mobile menu or search modal is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = (isMenuOpen || isSearchModalOpen) ? 'hidden' : '';
      
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMenuOpen, isSearchModalOpen, isMobile]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSearchModal = () => {
    setIsSearchModalOpen(!isSearchModalOpen);
  };

  const navItems = [
    // Removed wishlists and connections/friends nav items
  ];

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          {/* Main navigation row - reduced height */}
          <div className="flex justify-between items-center h-16">
            {/* Logo - more compact */}
            <Link to="/" className="flex items-center cursor-pointer flex-shrink-0">
              <img 
                src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
                alt="Elyphant" 
                className="h-10 w-10 mr-2" 
              />
              <h1 className="text-xl font-bold text-purple-700">Elyphant</h1>
            </Link>
            
            {/* Desktop Search Bar - better proportions */}
            {!isMobile && (
              <div className="flex-1 max-w-2xl mx-8">
                <AIEnhancedSearchBar />
              </div>
            )}
            
            {/* Right side actions - more compact */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Mobile Search Icon */}
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSearchModal}
                  className="h-10 w-10"
                  aria-label="Search"
                >
                  <Search size={20} />
                </Button>
              )}
              
              <ShoppingCartButton />
              <div className="hidden md:flex">
                {user ? (
                  <UserButton />
                ) : (
                  <AuthButtons profileImage={profile?.profile_image} />
                )}
              </div>

              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMenu} 
                className="md:hidden h-10 w-10"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
          
          {/* Category filter bar - only on desktop, more compact */}
          {!isMobile && (
            <div className="py-2 border-t border-gray-100">
              <CategoryFilterBar />
            </div>
          )}
          
          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="fixed inset-0 top-[64px] bg-white z-50 flex flex-col p-4 md:hidden">
              {/* Mobile Search Bar */}
              <div className="mb-4">
                <AIEnhancedSearchBar mobile={true} />
                <div className="mt-2">
                  <CategoryFilterBar mobile={true} />
                </div>
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
                {user ? (
                  <UserButton />
                ) : (
                  <AuthButtons profileImage={profile?.profile_image} />
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Search Modal */}
      {isMobile && isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Search</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSearchModal}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </div>
            
            {/* Search Content */}
            <div className="p-4">
              <AIEnhancedSearchBar mobile={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationBar;
