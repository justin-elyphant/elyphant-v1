
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthButtons from "./AuthButtons";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/hooks/profile/useProfile";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useViewport } from "@/hooks/useViewport";

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
    { path: "/", label: "Home" },
    { path: "/marketplace", label: "Marketplace" },
    { path: "/wishlists", label: "Wishlists", requireAuth: true },
    { path: "/connections", label: "Friends", requireAuth: true },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-purple-700">
            Elyphant
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              (!item.requireAuth || user) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-purple-700 ${
                    location.pathname === item.path ? "text-purple-700" : "text-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
          
          {/* Auth buttons and notifications */}
          <div className="hidden md:flex items-center space-x-3">
            {user && <NotificationBell />}
            <AuthButtons profileImage={profile?.profile_image} />
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-3">
            {user && <NotificationBell />}
            <Button variant="ghost" size="sm" onClick={toggleMenu} className="p-1">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
        
        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-[56px] bg-white z-50 flex flex-col p-4 md:hidden">
            <div className="flex flex-col space-y-4 mb-6">
              {navItems.map((item) => (
                (!item.requireAuth || user) && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-base font-medium py-2 px-4 rounded-md ${
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
