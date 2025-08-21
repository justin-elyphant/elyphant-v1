
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  X, 
  ShoppingBag, 
  Heart, 
  Package, 
  User, 
  Settings,
  HelpCircle,
  LogOut,
  Users,
  Zap,
  Clock,
  Gift,
  Star,
  Search,
  Bell
} from "lucide-react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { usePendingConnectionsCount } from "@/hooks/usePendingConnectionsCount";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";

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
  const { cartItems, cartTotal, getItemCount } = useCart();
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden animate-fade-in" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-background shadow-2xl overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header with User Profile */}
        <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
          {isAuthenticated && user ? (
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-background/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-6">
              <h2 className="text-lg font-semibold text-foreground">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-background/80 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Actions Section - Cart & Express Features */}
          {isAuthenticated && cartItems.length > 0 && (
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
                  Cart Summary
                </h3>
                <span className="text-sm font-medium text-primary">
                  {getItemCount()} items
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground mb-3">
                ${cartTotal.toFixed(2)}
              </div>
              <div className="space-y-2">
                <Button 
                  asChild 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link to="/checkout" onClick={onClose}>
                    <Zap className="h-4 w-4 mr-2" />
                    Express Checkout
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full"
                >
                  <Link to="/cart" onClick={onClose}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    View Cart Details
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Quick Links Section */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/search"
              className="flex flex-col items-center p-4 rounded-xl bg-card hover:bg-accent transition-colors border"
              onClick={onClose}
            >
              <Search className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">Search</span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/wishlists"
                className="flex flex-col items-center p-4 rounded-xl bg-card hover:bg-accent transition-colors border"
                onClick={onClose}
              >
                <Heart className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-foreground">Wishlist</span>
              </Link>
            )}
            <Link
              to="/gift-ideas"
              className="flex flex-col items-center p-4 rounded-xl bg-card hover:bg-accent transition-colors border"
              onClick={onClose}
            >
              <Gift className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">Gift Ideas</span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className="flex flex-col items-center p-4 rounded-xl bg-card hover:bg-accent transition-colors border"
                onClick={onClose}
              >
                <Package className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-medium text-foreground">Orders</span>
              </Link>
            )}
          </div>

          <Separator />

          {/* Shop Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Shop
            </h3>
            <div className="space-y-1">
              {marketplaceItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                  onClick={onClose}
                >
                  {item.icon && (
                    <span className="mr-3 text-primary group-hover:text-primary">
                      {item.icon}
                    </span>
                  )}
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
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
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
                        className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                        onClick={onClose}
                      >
                        <IconComponent className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  {/* Connections with notification badge */}
                  <Link
                    to="/connections"
                    className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group relative"
                    onClick={onClose}
                  >
                    <Users className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
                    <span className="font-medium">Connections</span>
                    {pendingConnectionsCount > 0 && (
                      <NotificationBadge 
                        count={pendingConnectionsCount} 
                        className="ml-auto"
                      />
                    )}
                  </Link>

                  {/* Notifications */}
                  <Link
                    to="/notifications"
                    className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                    onClick={onClose}
                  >
                    <Bell className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
                    <span className="font-medium">Notifications</span>
                  </Link>
                </div>
              </div>

              <Separator />

              {/* Recently Viewed */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Recent Activity
                </h3>
                <Link
                  to="/recently-viewed"
                  onClick={onClose}
                  className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                >
                  <Clock className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
                  <span className="font-medium">Recently Viewed</span>
                </Link>
              </div>

              <Separator />

              {/* Help & Support */}
              <div>
                <Link
                  to="/support"
                  onClick={onClose}
                  className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                >
                  <HelpCircle className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
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
                  className="w-full flex items-center p-3 rounded-lg hover:bg-destructive/10 transition-colors text-destructive group"
                >
                  <LogOut className="h-5 w-5 mr-3 group-hover:text-destructive" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            /* Guest User Section */
            <>
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 text-center">
                <div className="mb-4">
                  <User className="h-12 w-12 text-primary mx-auto mb-3 opacity-70" />
                  <h3 className="font-semibold text-foreground mb-2">Welcome!</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Sign in to access your wishlists, orders, and personalized shopping experience
                  </p>
                </div>
                <div className="space-y-3">
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link to="/auth" onClick={onClose}>
                      Sign In
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/auth" onClick={onClose}>
                      Create Account
                    </Link>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Guest Features */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Explore
                </h3>
                <div className="space-y-1">
                  <Link
                    to="/featured-deals"
                    onClick={onClose}
                    className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                  >
                    <Star className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
                    <span className="font-medium">Featured Deals</span>
                  </Link>
                  <Link
                    to="/gift-guides"
                    onClick={onClose}
                    className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                  >
                    <Gift className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
                    <span className="font-medium">Gift Guides</span>
                  </Link>
                </div>
              </div>

              <Separator />

              {/* Help for Guest Users */}
              <div>
                <Link
                  to="/support"
                  onClick={onClose}
                  className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group"
                >
                  <HelpCircle className="h-5 w-5 text-primary group-hover:text-primary mr-3" />
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
