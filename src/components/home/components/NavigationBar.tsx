import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, LogIn, ShoppingBag, User, Heart, Calendar, Settings, Users, HelpCircle } from "lucide-react";
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

  // Enhanced mobile menu structure for modern e-commerce
  const getMenuSections = () => {
    const sections = [
      {
        title: "SHOP",
        items: [
          { label: "Marketplace", path: "/marketplace", icon: ShoppingBag, requireAuth: false },
          { label: "Categories", path: "/marketplace/categories", icon: Search, requireAuth: false },
          { label: "Trending", path: "/marketplace/trending", icon: Heart, requireAuth: false },
        ]
      }
    ];

    // Add authenticated sections
    if (user) {
      sections.push(
        {
          title: "MY ACCOUNT",
          items: [
            { label: "Dashboard", path: "/dashboard", icon: User, requireAuth: true },
            { label: "My Orders", path: "/orders", icon: ShoppingBag, requireAuth: true },
            { label: "My Wishlists", path: "/wishlists", icon: Heart, requireAuth: true },
            { label: "Events & Dates", path: "/events", icon: Calendar, requireAuth: true },
            { label: "Settings", path: "/profile-setup", icon: Settings, requireAuth: true },
          ]
        },
        {
          title: "CONNECT",
          items: [
            { label: "My Friends", path: "/connections/friends", icon: Users, requireAuth: true },
            { label: "Find Friends", path: "/connections/find", icon: Users, requireAuth: true },
          ]
        }
      );
    }

    // Always show support section
    sections.push({
      title: "SUPPORT",
      items: [
        { label: "Help Center", path: "/help", icon: HelpCircle, requireAuth: false },
        { label: "Contact Us", path: "/contact", icon: HelpCircle, requireAuth: false },
      ]
    });

    return sections;
  };

  const handleProtectedRoute = (path: string, requireAuth: boolean) => {
    if (requireAuth && !user) {
      // Redirect to sign-in with return path
      return `/signin?redirect=${encodeURIComponent(path)}`;
    }
    return path;
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          {/* Main navigation row */}
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center cursor-pointer flex-shrink-0">
              <img 
                src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
                alt="Elyphant" 
                className="h-10 w-10 mr-2" 
              />
              <h1 className="text-xl font-bold text-purple-700">Elyphant</h1>
            </Link>
            
            {/* Desktop Search Bar */}
            {!isMobile && (
              <div className="flex-1 max-w-2xl mx-8">
                <AIEnhancedSearchBar />
              </div>
            )}
            
            {/* Right side actions */}
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
              
              {/* Mobile Sign In Button */}
              {isMobile && !user && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                  className="h-10 w-10"
                  aria-label="Sign In"
                >
                  <Link to="/signin">
                    <LogIn size={20} />
                  </Link>
                </Button>
              )}
              
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
          
          {/* Category filter bar - desktop only */}
          {!isMobile && (
            <div className="py-2 border-t border-gray-100">
              <CategoryFilterBar />
            </div>
          )}
          
          {/* Enhanced Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="fixed inset-0 top-[64px] bg-white z-50 flex flex-col md:hidden overflow-y-auto">
              {/* Mobile Search Bar - Keep at top */}
              <div className="p-4 border-b border-gray-100">
                <AIEnhancedSearchBar mobile={true} />
                <div className="mt-2">
                  <CategoryFilterBar mobile={true} />
                </div>
              </div>
              
              {/* Enhanced Menu Sections */}
              <div className="flex-1 px-4 py-2">
                {getMenuSections().map((section, sectionIndex) => (
                  <div key={section.title} className={sectionIndex > 0 ? "mt-6" : ""}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-2">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const IconComponent = item.icon;
                        const targetPath = handleProtectedRoute(item.path, item.requireAuth);
                        
                        return (
                          <Link
                            key={item.path}
                            to={targetPath}
                            className={`flex items-center py-3 px-4 rounded-lg min-h-[48px] transition-colors ${
                              location.pathname === item.path
                                ? "bg-purple-50 text-purple-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                            }`}
                            onClick={() => {
                              setIsMenuOpen(false);
                              // Show sign-in prompt for protected routes
                              if (item.requireAuth && !user) {
                                // The link already handles this with redirect parameter
                              }
                            }}
                          >
                            <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                            <span className="text-base">{item.label}</span>
                            {item.requireAuth && !user && (
                              <span className="ml-auto text-xs text-gray-400">Sign in</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Authentication Section */}
              <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.full_name || user.email}
                        </p>
                        <p className="text-xs text-gray-500">Signed in</p>
                      </div>
                    </div>
                    <UserButton />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 px-2">
                      Sign in to access your account, orders, and wishlists
                    </p>
                    <AuthButtons profileImage={profile?.profile_image} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Search Modal - Keep existing */}
      {isMobile && isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
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
