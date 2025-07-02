
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LogOut, Users, ShoppingBag, Gift } from "lucide-react";

interface MobileMenuProps {
  links: Array<{ label: string; href: string }>;
  marketplaceItems: NavDropdownItem[];
  connectionsItems: NavDropdownItem[];
  isActive: (path: string) => boolean;
  onClose: () => void;
  signOut: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  links,
  marketplaceItems,
  connectionsItems,
  isActive,
  onClose,
  signOut,
}) => {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 top-16 z-40 bg-white border-t shadow-lg md:hidden">
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <p className="text-sm font-medium">Menu</p>
          <ThemeToggle size="sm" showTooltip={false} />
        </div>
        
        <nav className="flex flex-col space-y-3">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`py-3 px-4 rounded-md text-left ${isActive(link.href)
                ? "bg-primary/10 text-primary font-semibold" 
                : "hover:bg-muted"}`}
              onClick={onClose}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Mobile Marketplace Menu */}
          <div className="space-y-1 border-t pt-3">
            <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">Marketplace</p>
            {marketplaceItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`py-3 px-6 rounded-md flex items-center ${isActive(item.href)
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "hover:bg-muted"}`}
                onClick={onClose}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Mobile Connections Menu (for logged in users) */}
          {user && (
            <div className="space-y-1 border-t pt-3">
              <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">Connections</p>
              {connectionsItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`py-3 px-6 rounded-md flex items-center ${isActive(item.href)
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "hover:bg-muted"}`}
                  onClick={onClose}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          
          {/* Authentication buttons for mobile */}
          {!user ? (
            <div className="pt-4 border-t border-border flex flex-col space-y-3">
              <Button asChild className="w-full py-3">
                <Link to="/signup" onClick={onClose}>
                  Sign Up
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full py-3">
                <Link to="/login" onClick={onClose}>
                  Log In
                </Link>
              </Button>
            </div>
          ) : (
            <div className="pt-4 border-t border-border">
              <Button 
                variant="outline" 
                className="w-full py-3 text-destructive hover:text-destructive"
                onClick={() => {
                  signOut();
                  onClose();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
