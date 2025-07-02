
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
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

  // Prevent scroll on body when menu is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed inset-0 top-16 z-50 bg-white md:hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="p-2 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Main Navigation Links */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2">
                Navigation
              </h3>
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block py-3 px-4 rounded-lg text-left transition-colors ${
                    isActive(link.href)
                      ? "bg-purple-100 text-purple-700 font-semibold" 
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Marketplace Section */}
            {marketplaceItems.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                  Marketplace
                </h3>
                <div className="space-y-1">
                  {marketplaceItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className={`flex items-center py-3 px-4 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? "bg-purple-100 text-purple-700 font-semibold" 
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={onClose}
                    >
                      {item.icon && <span className="mr-3">{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Connections Section (for logged in users) */}
            {user && connectionsItems.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                  Connections
                </h3>
                <div className="space-y-1">
                  {connectionsItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className={`flex items-center py-3 px-4 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? "bg-purple-100 text-purple-700 font-semibold" 
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={onClose}
                    >
                      {item.icon && <span className="mr-3">{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Authentication */}
        <div className="border-t bg-gray-50 p-4 shrink-0">
          {!user ? (
            <div className="space-y-3">
              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                <Link to="/signup" onClick={onClose}>
                  Sign Up
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/signin" onClick={onClose}>
                  Sign In
                </Link>
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => {
                signOut();
                onClose();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
