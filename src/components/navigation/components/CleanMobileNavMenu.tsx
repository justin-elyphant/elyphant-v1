
import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Zap, LogOut, ShoppingBag } from "lucide-react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { usePendingConnectionsCount } from "@/hooks/usePendingConnectionsCount";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/auth";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useProfileDataIntegrity } from "@/hooks/common/useProfileDataIntegrity";
import { getNavigationConfig } from "../config/navigationConfig";
import { navigationStyles, getNavItemClasses } from "../shared/NavigationStyles";

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
  const { unreadCount: notificationsCount } = useNotifications();
  const unreadMessagesCount = useUnreadMessagesCount();
  const { hasIssues } = useProfileDataIntegrity();

  // Get unified navigation configuration
  const badges = {
    cart: getItemCount(),
    messages: unreadMessagesCount,
    notifications: notificationsCount,
    connections: pendingConnectionsCount,
    issues: hasIssues ? 1 : 0
  };
  
  const { sections, quickActions } = getNavigationConfig(isAuthenticated, badges);

  if (!isOpen) return null;

  return createPortal(
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

          {/* Quick Actions Section */}
          <div className={navigationStyles.mobileGrid}>
            {quickActions.map((action) => (
              <Link
                key={action.id}
                to={action.href}
                className={navigationStyles.quickActionCard}
                onClick={onClose}
              >
                <div className={navigationStyles.quickActionIcon}>
                  {action.icon}
                </div>
                <span className={navigationStyles.quickActionLabel}>{action.label}</span>
              </Link>
            ))}
          </div>

          <Separator />

          {/* Unified Sections */}
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className={navigationStyles.sectionHeader}>
                {section.icon && <span className="mr-2">{section.icon}</span>}
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={getNavItemClasses(false)}
                    onClick={onClose}
                  >
                    {item.icon && (
                      <span className="mr-3 text-primary group-hover:text-primary">
                        {item.icon}
                      </span>
                    )}
                    <span className={navigationStyles.navItemLabel}>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <NotificationBadge 
                        count={item.badge} 
                        className={navigationStyles.badge}
                      />
                    )}
                  </Link>
                ))}
              </div>
              <Separator />
            </div>
          ))}

          {/* Authentication Actions */}
          {isAuthenticated ? (
            <div>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className={navigationStyles.signOutButton}
              >
                <LogOut className="h-5 w-5 mr-3 group-hover:text-destructive" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className={navigationStyles.authPrompt}>
              <div className="mb-4">
                <div className="h-12 w-12 bg-primary/10 text-primary mx-auto mb-3 opacity-70 rounded-full flex items-center justify-center">
                  <span className="h-6 w-6">👋</span>
                </div>
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
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CleanMobileNavMenu;
