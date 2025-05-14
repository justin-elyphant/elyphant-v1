
import React from "react";
import { Link } from "react-router-dom";
import NavigationDropdown, { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

interface DesktopNavigationProps {
  links: Array<{ label: string; href: string }>;
  marketplaceItems: NavDropdownItem[];
  connectionsItems: NavDropdownItem[];
  isActive: (path: string) => boolean;
  showConnections: boolean;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  links,
  marketplaceItems,
  connectionsItems,
  isActive,
  showConnections,
}) => {
  return (
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
      
      {showConnections && (
        <NavigationDropdown 
          label="Connections" 
          items={connectionsItems}
          triggerClassName="text-sm font-medium text-foreground/80 hover:text-foreground"
          variant={isActive("/connections") ? "default" : "ghost"}
        />
      )}
    </nav>
  );
};

export default DesktopNavigation;
