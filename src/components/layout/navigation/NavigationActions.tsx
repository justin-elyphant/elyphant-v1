
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import UserButton from "@/components/auth/UserButton";

interface NavigationActionsProps {
  user: any;
  isMobile: boolean;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const NavigationActions: React.FC<NavigationActionsProps> = ({
  user,
  isMobile,
  mobileMenuOpen,
  toggleMobileMenu,
}) => {
  return (
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
  );
};

export default NavigationActions;
