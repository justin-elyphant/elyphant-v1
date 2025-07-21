
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useCart } from "@/contexts/CartContext";
import { LogOut, Users, ShoppingBag, Gift, CreditCard, Zap } from "lucide-react";

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
  const { cartItems } = useCart();

  return (
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
            onClick={onClose}
          >
            {link.label}
          </Link>
        ))}
        
        {/* Quick Checkout Access */}
        {user && cartItems.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <Button 
              asChild 
              className="w-full justify-start bg-primary hover:bg-primary/90"
            >
              <Link to="/checkout" onClick={onClose}>
                <Zap className="h-4 w-4 mr-2" />
                Quick Checkout ({cartItems.length} items)
              </Link>
            </Button>
            <Button 
              variant="outline" 
              asChild 
              className="w-full justify-start"
            >
              <Link to="/cart" onClick={onClose}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                View Cart
              </Link>
            </Button>
          </div>
        )}
        
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
              onClick={onClose}
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
                onClick={onClose}
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
              <Link to="/auth" onClick={onClose}>
                Sign Up
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth" onClick={onClose}>
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
              onClose();
            }}
          >
            Log Out
          </Button>
        )}
      </nav>
    </div>
  );
};

export default MobileMenu;
