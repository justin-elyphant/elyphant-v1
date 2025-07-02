
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LogOut, X } from "lucide-react";

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
    <div className="fixed inset-0 top-16 z-50 bg-white md:hidden overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h2 className="text-lg font-semibold">Menu</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" showTooltip={false} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Main Navigation Links */}
          <div className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block py-3 px-4 rounded-lg text-left transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={onClose}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Marketplace Section */}
          <div className="border-t pt-4">
            <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Marketplace
            </h3>
            <div className="space-y-1">
              {marketplaceItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={`flex items-center py-3 px-4 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  onClick={onClose}
                >
                  {item.icon && <span className="mr-3 text-lg">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Connections Section (for logged in users) */}
          {user && (
            <div className="border-t pt-4">
              <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Connections
              </h3>
              <div className="space-y-1">
                {connectionsItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    className={`flex items-center py-3 px-4 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    onClick={onClose}
                  >
                    {item.icon && <span className="mr-3 text-lg">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Authentication */}
        <div className="border-t bg-gray-50 p-4">
          {!user ? (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/signup" onClick={onClose}>
                  Sign Up
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login" onClick={onClose}>
                  Log In
                </Link>
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                signOut();
                onClose();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
