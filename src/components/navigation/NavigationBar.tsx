import React from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCenter from "../notifications/NotificationCenter";
import NavigationLogo from "./components/NavigationLogo";
import UserDropdownMenu from "./components/UserDropdownMenu";
import MobileNavMenu from "./components/MobileNavMenu";
import DesktopNav from "./components/DesktopNav";
import AuthButtons from "./components/AuthButtons";
import { useNavigationState } from "./hooks/useNavigationState";

const NavigationBar = () => {
  const {
    user,
    profile,
    mobileMenuOpen,
    marketplaceItems,
    profileItems,
    toggleMobileMenu,
    handleSignOut
  } = useNavigationState();

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <NavigationLogo />
          <DesktopNav 
            marketplaceItems={marketplaceItems}
            profileItems={profileItems}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <NotificationCenter />
              <UserDropdownMenu 
                profile={profile} 
                email={user.email} 
                onSignOut={handleSignOut} 
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleMobileMenu}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center space-x-2">
                <AuthButtons />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      <MobileNavMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        onSignOut={handleSignOut}
        isAuthenticated={!!user}
        marketplaceItems={marketplaceItems}
        profileItems={profileItems}
      />
    </header>
  );
};

export default NavigationBar;
