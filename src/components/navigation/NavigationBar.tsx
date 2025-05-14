
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Menu, X, Settings, User, LogOut, Bell, Home, ShoppingBag, Gift, Users } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationCenter from "../notifications/NotificationCenter";
import { toast } from "sonner";
import NavigationDropdown, { NavDropdownItem } from "./NavigationDropdown";

const NavigationBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Define dropdown menus
  const marketplaceItems: NavDropdownItem[] = [
    { label: "All Products", href: "/marketplace", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "Categories", href: "/marketplace/categories", icon: <Gift className="h-4 w-4" /> },
    { label: "Trending", href: "/marketplace/trending" },
    { label: "Deals", href: "/marketplace/deals" }
  ];
  
  const profileItems: NavDropdownItem[] = user ? [
    { label: "Dashboard", href: "/dashboard", icon: <Home className="h-4 w-4" /> },
    { label: "Profile", href: "/profile", icon: <User className="h-4 w-4" /> },
    { label: "Wishlists", href: "/wishlists", icon: <Gift className="h-4 w-4" /> },
    { label: "Connections", href: "/connections", icon: <Users className="h-4 w-4" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> }
  ] : [];

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      navigate("/");
      toast.success("You have been signed out");
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold">
            GiftHub
          </Link>
          
          <nav className="hidden md:flex items-center ml-8 space-x-4">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors px-3 py-2">
              Home
            </Link>
            
            <NavigationDropdown 
              label="Marketplace" 
              items={marketplaceItems} 
              triggerClassName="text-sm font-medium"
            />
            
            {user && (
              <NavigationDropdown 
                label="My Account" 
                items={profileItems} 
                triggerClassName="text-sm font-medium"
              />
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.profile_image || undefined} />
                      <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background">
                  <DropdownMenuLabel>
                    {profile?.name || user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/settings" className="flex w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/notifications" className="flex w-full">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Menu with improved dropdowns */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            {/* Mobile Marketplace Menu */}
            <div className="space-y-1">
              <p className="px-4 py-1 text-sm font-semibold text-muted-foreground">Marketplace</p>
              {marketplaceItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
            
            {/* User Account Menu Items */}
            {user && (
              <>
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="px-4 py-1 text-sm font-semibold text-muted-foreground">My Account</p>
                  {profileItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className="block px-6 py-2 rounded-md hover:bg-accent flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.label}
                    </Link>
                  ))}
                </div>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left block px-4 py-2 rounded-md hover:bg-red-100 text-red-500"
                >
                  <span className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default NavigationBar;
