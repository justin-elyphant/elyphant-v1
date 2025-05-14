
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth";
import Logo from "../home/components/Logo";
import { getDefaultLinks, getMarketplaceItems, getConnectionsItems } from "./navigation/navigationData";
import DesktopNavigation from "./navigation/DesktopNavigation";
import NavigationActions from "./navigation/NavigationActions";
import MobileMenu from "./navigation/MobileMenu";

interface NavLink {
  label: string;
  href: string;
}

interface ResponsiveNavigationProps {
  links?: NavLink[];
  className?: string;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  links = getDefaultLinks(),
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

  // Get navigation items
  const marketplaceItems = getMarketplaceItems();
  const connectionsItems = getConnectionsItems();

  return (
    <header className={`border-b bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 ${className}`}>
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <DesktopNavigation 
            links={links} 
            marketplaceItems={marketplaceItems}
            connectionsItems={connectionsItems}
            isActive={isActive}
            showConnections={!!user}
          />
        )}
        
        {/* Right side actions */}
        <NavigationActions 
          user={user}
          isMobile={isMobile}
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
        />
      </div>
      
      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <MobileMenu
          links={links}
          marketplaceItems={marketplaceItems}
          connectionsItems={connectionsItems}
          isActive={isActive}
          onClose={() => setMobileMenuOpen(false)}
          signOut={signOut}
        />
      )}
    </header>
  );
};
