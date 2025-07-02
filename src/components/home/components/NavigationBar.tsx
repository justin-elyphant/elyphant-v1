
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import MobileMenu from "@/components/layout/navigation/MobileMenu";
import Logo from "./Logo";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import AuthButtons from "./AuthButtons";
import UserDropdownMenu from "@/components/navigation/components/UserDropdownMenu";
import { HEADER_STYLES } from "./styleConstants";

const NavigationBar = () => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { label: "Home", href: "/" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Gifting", href: "/gifting" },
    { label: "Events", href: "/events" },
  ];

  const marketplaceItems: NavDropdownItem[] = [
    {
      label: "Browse Products",
      href: "/marketplace",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
  ];

  const connectionsItems: NavDropdownItem[] = [
    {
      label: "My Connections",
      href: "/connections",
      icon: <Menu className="h-4 w-4" />,
    },
  ];

  const isActive = (path: string) => {
    return window.location.pathname === path;
  };

  return (
    <>
      <nav className={HEADER_STYLES.navBar}>
        {/* Logo Section */}
        <div className={HEADER_STYLES.logoSection}>
          <Logo />
        </div>

        {/* Desktop Search Bar */}
        <div className={HEADER_STYLES.desktopSearch}>
          <AIEnhancedSearchBar />
        </div>

        {/* Desktop Actions */}
        <div className={HEADER_STYLES.desktopActions}>
          {!user ? (
            <AuthButtons />
          ) : (
            <>
              <Button variant="ghost" size="sm" className={HEADER_STYLES.cartButton}>
                <ShoppingCart className={HEADER_STYLES.cartIcon} />
                <span className={HEADER_STYLES.cartBadge}>0</span>
              </Button>
              <UserDropdownMenu 
                user={user} 
                onSignOut={signOut}
                marketplaceItems={marketplaceItems}
                connectionsItems={connectionsItems}
              />
            </>
          )}
        </div>

        {/* Mobile Actions - ONLY Cart and Hamburger Menu */}
        <div className={HEADER_STYLES.mobileActions}>
          <Button variant="ghost" size="sm" className={HEADER_STYLES.cartButton}>
            <ShoppingCart className={HEADER_STYLES.cartIcon} />
            <span className={HEADER_STYLES.cartBadge}>0</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={HEADER_STYLES.hamburgerButton}
          >
            <Menu className={HEADER_STYLES.hamburgerIcon} />
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={HEADER_STYLES.mobileMenu}>
          <MobileMenu
            links={links}
            marketplaceItems={marketplaceItems}
            connectionsItems={connectionsItems}
            isActive={isActive}
            onClose={() => setIsMobileMenuOpen(false)}
            signOut={signOut}
          />
        </div>
      )}
    </>
  );
};

export default NavigationBar;
