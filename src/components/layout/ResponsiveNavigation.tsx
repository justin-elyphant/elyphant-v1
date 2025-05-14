
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Menu, X, ShoppingBag, Gift, Users } from "lucide-react";
import Logo from "../home/components/Logo";
import UserButton from "../auth/UserButton";
import { NotificationsDropdown } from "../notifications/NotificationsDropdown";
import NavigationDropdown, { NavDropdownItem } from "../navigation/NavigationDropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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

  // Define dropdown menus
  const marketplaceItems: NavDropdownItem[] = [
    { label: "All Products", href: "/marketplace", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "Categories", href: "/marketplace/categories", icon: <Gift className="h-4 w-4" /> },
    { label: "Trending", href: "/marketplace/trending" }
  ];

  const connectionsItems: NavDropdownItem[] = [
    { label: "My Friends", href: "/connections/friends", icon: <Users className="h-4 w-4" /> },
    { label: "Find Friends", href: "/connections/find", icon: <Users className="h-4 w-4" /> },
    { label: "Invitations", href: "/connections/invitations" }
  ];

  return (
    <header className={`border-b bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 ${className}`}>
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
            
            <NavigationDropdown 
              label="Marketplace" 
              items={marketplaceItems}
              triggerClassName="text-sm font-medium text-foreground/80 hover:text-foreground"
              variant={isActive("/marketplace") ? "default" : "ghost"}
            />
            
            {user && (
              <NavigationDropdown 
                label="Connections" 
                items={connectionsItems}
                triggerClassName="text-sm font-medium text-foreground/80 hover:text-foreground"
                variant={isActive("/connections") ? "default" : "ghost"}
              />
            )}
          </nav>
        )}
        
        {/* Right side actions */}
        <div className="flex items-center space-x-1">
          <ThemeToggle size="icon" variant="ghost" />
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
      
      {/* Mobile Menu with improved dropdowns */}
      {isMobile && mobileMenuOpen && (
        <div className="py-3 px-4 border-t bg-background">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <p className="text-sm font-medium">Settings</p>
            <ThemeToggle size="sm" showTooltip={false} />
          </div>
          
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
            
            {/* Mobile Marketplace Menu */}
            <div className="space-y-1 border-t pt-2">
              <p className="px-3 py-1 text-sm font-semibold text-muted-foreground">Marketplace</p>
              {marketplaceItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`py-2 px-4 rounded-md flex items-center ${isActive(item.href)
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "hover:bg-muted"}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* Mobile Connections Menu (for logged in users) */}
            {user && (
              <div className="space-y-1 border-t pt-2">
                <p className="px-3 py-1 text-sm font-semibold text-muted-foreground">Connections</p>
                {connectionsItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    className={`py-2 px-4 rounded-md flex items-center ${isActive(item.href)
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "hover:bg-muted"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
            
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
}
