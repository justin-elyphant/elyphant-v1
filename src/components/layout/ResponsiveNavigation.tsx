
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Menu, X } from "lucide-react";
import Logo from "../home/components/Logo";
import UserButton from "../auth/UserButton";
import NotificationsDropdown from "../notifications/NotificationsDropdown";

interface NavLink {
  label: string;
  href: string;
}

interface ResponsiveNavigationProps {
  links?: NavLink[];
  className?: string;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  links = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Connections", href: "/connections" },
    { label: "Profile", href: "/profile-setup" },
    { label: "Wishlists", href: "/wishlists" }
  ],
  className = ""
}) => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`border-b bg-white shadow-sm sticky top-0 z-50 ${className}`}>
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {links.map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                className={`transition-colors ${isActive(link.href) 
                  ? "text-primary font-semibold" 
                  : "text-foreground/80 hover:text-foreground"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        
        {/* Right side actions */}
        <div className="flex items-center space-x-1">
          <NotificationsDropdown />
          
          {user ? (
            <UserButton />
          ) : (
            <>
              {!isMobile && (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Log In</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </>
          )}
          
          {/* Mobile menu toggle */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="py-3 px-4 border-t bg-background">
          <nav className="flex flex-col space-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`py-2 px-3 rounded-md ${isActive(link.href)
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "hover:bg-muted"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Authentication buttons for mobile */}
            {!user ? (
              <div className="pt-3 border-t border-border flex flex-col space-y-2">
                <Button asChild>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Log In
                  </Link>
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="mt-3 text-destructive hover:text-destructive"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
              >
                Log Out
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
