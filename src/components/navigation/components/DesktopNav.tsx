
import React from "react";
import { Link } from "react-router-dom";
import NavigationDropdown, { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

interface DesktopNavProps {
  marketplaceItems: NavDropdownItem[];
  profileItems: NavDropdownItem[];
}

const DesktopNav = ({ marketplaceItems, profileItems }: DesktopNavProps) => {
  return (
    <nav className="hidden md:flex items-center ml-8 space-x-4">
      <Link to="/" className="text-sm font-medium hover:text-primary transition-colors px-3 py-2">
        Home
      </Link>
      
      <NavigationDropdown 
        label="Marketplace" 
        items={marketplaceItems} 
        triggerClassName="text-sm font-medium"
      />
      
      {profileItems.length > 0 && (
        <NavigationDropdown 
          label="My Account" 
          items={profileItems} 
          triggerClassName="text-sm font-medium"
        />
      )}
    </nav>
  );
};

export default DesktopNav;
