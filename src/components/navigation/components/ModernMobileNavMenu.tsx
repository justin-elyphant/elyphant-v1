
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  LogOut, 
  ShoppingBag, 
  Heart, 
  Package, 
  Clock, 
  Gift, 
  Smartphone, 
  Shirt, 
  Home as HomeIcon, 
  Dumbbell,
  BookOpen,
  User,
  Settings,
  Star,
  CreditCard,
  Headphones,
  Zap
} from "lucide-react";
import { NavDropdownItem } from "@/components/navigation/NavigationDropdown";

interface ModernMobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
  marketplaceItems: NavDropdownItem[];
  profileItems: NavDropdownItem[];
}

const ModernMobileNavMenu = ({ 
  isOpen, 
  onClose, 
  onSignOut, 
  isAuthenticated, 
  marketplaceItems, 
  profileItems 
}: ModernMobileNavMenuProps) => {
  if (!isOpen) return null;

  const quickActions = [
    { 
      label: "Cart", 
      href: "/cart", 
      icon: ShoppingBag, 
      badge: "3",
      color: "bg-blue-50 text-blue-600" 
    },
    { 
      label: "Wishlist", 
      href: "/my-wishlists", 
      icon: Heart, 
      color: "bg-red-50 text-red-600" 
    },
    { 
      label: "Orders", 
      href: "/orders", 
      icon: Package, 
      color: "bg-green-50 text-green-600" 
    },
    { 
      label: "Recent", 
      href: "/marketplace?recent=true", 
      icon: Clock, 
      color: "bg-purple-50 text-purple-600" 
    },
  ];

  const categoryIcons = {
    "All Products": ShoppingBag,
    "Electronics": Smartphone,
    "Fashion": Shirt,
    "Home & Garden": HomeIcon,
    "Sports & Outdoors": Dumbbell,
    "Books & Media": BookOpen,
  };

  const shopByOccasion = [
    { label: "Birthday Gifts", href: "/marketplace?occasion=birthday", icon: Gift },
    { label: "Holiday Deals", href: "/marketplace?occasion=holiday", icon: Star },
    { label: "Anniversary", href: "/marketplace?occasion=anniversary", icon: Heart },
    { label: "Just Because", href: "/marketplace?occasion=surprise", icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-muted px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Menu</h2>
              <p className="text-muted-foreground text-sm">Discover amazing gifts</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <LogOut className="h-5 w-5 rotate-180 text-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  onClick={onClose}
                  className="relative p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div className={`inline-flex p-2 rounded-lg ${action.color} mb-2`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{action.label}</div>
                  {action.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center text-xs"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <Separator />

          {/* Shop Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Shop by Category
            </h3>
            <div className="space-y-2">
              {marketplaceItems.map((item, index) => {
                const IconComponent = categoryIcons[item.label as keyof typeof categoryIcons] || ShoppingBag;
                return (
                  <Link
                    key={index}
                    to={item.href}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    onClick={onClose}
                  >
                    <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-purple-100 transition-colors">
                      <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Shop by Occasion */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Shop by Occasion
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {shopByOccasion.map((occasion) => (
                <Link
                  key={occasion.label}
                  to={occasion.href}
                  onClick={onClose}
                  className="p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-center group"
                >
                  <occasion.icon className="h-6 w-6 text-gray-600 group-hover:text-purple-600 mx-auto mb-2" />
                  <div className="text-xs font-medium text-gray-900">{occasion.label}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* User Account Section */}
          {isAuthenticated && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  My Account
                </h3>
                <div className="space-y-2">
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
                        className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        onClick={onClose}
                      >
                        <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-blue-100 transition-colors">
                          <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Support & Help */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link
                    to="/support"
                    onClick={onClose}
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-green-100 transition-colors">
                      <Headphones className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">Help & Support</span>
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Auth Buttons for Non-authenticated Users */}
          {!isAuthenticated && (
            <>
              <Separator />
              <div className="space-y-3">
                <Button 
                  asChild 
                  style={{ background: 'linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%)' }}
                  className="w-full h-12 text-white hover:opacity-90"
                >
                  <Link to="/signup" onClick={onClose}>
                    <User className="h-5 w-5 mr-2" />
                    Create Account
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full h-12 border-gray-300">
                  <Link to="/signin" onClick={onClose}>
                    Sign In
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Bottom Spacer */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default ModernMobileNavMenu;
