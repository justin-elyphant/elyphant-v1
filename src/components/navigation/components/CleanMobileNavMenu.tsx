
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  ShoppingBag, 
  Heart, 
  Package, 
  User, 
  Settings,
  HelpCircle,
  LogOut,
  Users
} from "lucide-react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { usePendingConnectionsCount } from "@/hooks/usePendingConnectionsCount";

interface CleanMobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
  marketplaceItems: NavDropdownItem[];
  profileItems: NavDropdownItem[];
}

const CleanMobileNavMenu = ({ 
  isOpen, 
  onClose, 
  onSignOut, 
  isAuthenticated, 
  marketplaceItems, 
  profileItems 
}: CleanMobileNavMenuProps) => {
  const pendingConnectionsCount = usePendingConnectionsCount();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Shop Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Shop
            </h3>
            <div className="space-y-1">
              {marketplaceItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                  onClick={onClose}
                >
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Authenticated User Section */}
          {isAuthenticated ? (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  My Account
                </h3>
                <div className="space-y-1">
                  {profileItems.map((item, index) => {
                    const getIcon = () => {
                      if (item.label === "Profile") return User;
                      if (item.label === "Settings") return Settings;
                      if (item.label === "Orders") return Package;
                      if (item.label === "Wishlists") return Heart;
                      return User;
                    };
                    const IconComponent = getIcon();
                    
                    return (
                      <Link
                        key={index}
                        to={item.href}
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                        onClick={onClose}
                      >
                        <IconComponent className="h-5 w-5 text-gray-500 mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Connections with notification badge */}
                  <Link
                    to="/connections"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-900 relative"
                    onClick={onClose}
                  >
                    <Users className="h-5 w-5 text-gray-500 mr-3" />
                    <span className="font-medium">Connections</span>
                    {pendingConnectionsCount > 0 && (
                      <NotificationBadge 
                        count={pendingConnectionsCount} 
                        className="ml-auto"
                      />
                    )}
                  </Link>
                </div>
              </div>

              <Separator />

              {/* Help & Support */}
              <div>
                <Link
                  to="/support"
                  onClick={onClose}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                >
                  <HelpCircle className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="font-medium">Help & Support</span>
                </Link>
              </div>

              <Separator />

              {/* Sign Out */}
              <div>
                <button
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            /* Guest User Section */
            <>
              <div>
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    Sign in to access your wishlists, orders, and personalized features
                  </p>
                  <div className="space-y-3">
                    <Button asChild className="w-full">
                      <Link to="/signin" onClick={onClose}>
                        Sign In
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/signup" onClick={onClose}>
                        Create Account
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Help for Guest Users */}
              <div>
                <Link
                  to="/support"
                  onClick={onClose}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                >
                  <HelpCircle className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="font-medium">Help & Support</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanMobileNavMenu;
