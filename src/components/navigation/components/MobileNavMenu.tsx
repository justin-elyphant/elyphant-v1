
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
  marketplaceItems: NavDropdownItem[];
  profileItems: NavDropdownItem[];
}

const MobileNavMenu = ({ 
  isOpen, 
  onClose, 
  onSignOut, 
  isAuthenticated, 
  marketplaceItems, 
  profileItems 
}: MobileNavMenuProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="md:hidden border-t">
      <div className="container py-4 space-y-2">
        <Link
          to="/"
          className="block px-4 py-2 rounded-md hover:bg-accent"
          onClick={onClose}
        >
          Home
        </Link>
        
        {/* Mobile Marketplace Menu */}
        <div className="space-y-1">
          <p className="px-4 py-1 text-sm font-semibold text-muted-foreground">Marketplace</p>
          {marketplaceItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
              onClick={onClose}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* User Account Menu Items */}
        {isAuthenticated && (
          <>
            <div className="space-y-1 pt-2 border-t border-border">
              <p className="px-4 py-1 text-sm font-semibold text-muted-foreground">Personal</p>
              <Link
                to="/dashboard"
                className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                onClick={onClose}
              >
                Dashboard
              </Link>
              <Link
                to="/account"
                className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                onClick={onClose}
              >
                Account
              </Link>
            </div>
            
            <div className="space-y-1 pt-2">
              <p className="px-4 py-1 text-sm font-semibold text-muted-foreground">Social & AI</p>
              <Link
                to="/social"
                className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                onClick={onClose}
              >
                Social Hub
              </Link>
              <Link
                to="/gifting"
                className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                onClick={onClose}
              >
                Gifting Hub
              </Link>
              <Link
                to="/nicole"
                className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                onClick={onClose}
              >
                Nicole AI
              </Link>
            </div>
            
            <div className="space-y-1 pt-2">
              <p className="px-4 py-1 text-sm font-semibold text-muted-foreground">Quick Access</p>
              {profileItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                  onClick={onClose}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full text-left block px-4 py-2 rounded-md hover:bg-red-100 text-red-500"
            >
              <span className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </span>
            </button>
          </>
        )}

        {!isAuthenticated && (
          <div className="space-y-2 pt-2 border-t">
            <Button asChild className="w-full">
              <Link to="/signup" onClick={onClose}>Sign Up</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/signin" onClick={onClose}>Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileNavMenu;
