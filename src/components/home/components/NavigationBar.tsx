import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NavigationLogo from "@/components/navigation/components/NavigationLogo";
import UserDropdownMenu from "@/components/navigation/components/UserDropdownMenu";
import MobileMenu from "@/components/layout/navigation/MobileMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShoppingCart, Menu, Gift, Users, ShoppingBag } from "lucide-react";

const NavigationBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const links = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  const marketplaceItems = [
    { label: "Browse Gifts", href: "/marketplace", icon: <Gift className="h-4 w-4" /> },
    { label: "My Cart", href: "/cart", icon: <ShoppingCart className="h-4 w-4" /> },
    { label: "My Orders", href: "/orders", icon: <ShoppingBag className="h-4 w-4" /> },
  ];

  const connectionsItems = [
    { label: "Find Friends", href: "/connections", icon: <Users className="h-4 w-4" /> },
    { label: "My Wishlists", href: "/my-wishlists", icon: <Gift className="h-4 w-4" /> },
  ];

  const handleAuthRedirect = (targetPath: string) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`);
      return false;
    }
    return true;
  };

  const handleProtectedNavigation = (path: string, e: React.MouseEvent) => {
    const protectedRoutes = ['/dashboard', '/cart', '/orders', '/connections', '/my-wishlists'];
    
    if (protectedRoutes.includes(path) && !user) {
      e.preventDefault();
      handleAuthRedirect(path);
      setIsMobileMenuOpen(false);
    }
  };

  if (isMobile) {
    return (
      <nav className="flex items-center justify-between px-4 py-3 bg-white border-b">
        {/* Logo */}
        <NavigationLogo />

        {/* Mobile Actions - Only Cart and Menu */}
        <div className="flex items-center space-x-2">
          {/* Shopping Cart */}
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            onClick={(e) => handleProtectedNavigation('/cart', e)}
          >
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <MobileMenu
                links={links}
                marketplaceItems={marketplaceItems}
                connectionsItems={connectionsItems}
                isActive={isActive}
                onClose={() => setIsMobileMenuOpen(false)}
                signOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    );
  }

  // Desktop Navigation (unchanged)
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <NavigationLogo />
      
      <div className="flex items-center space-x-6">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive(link.href) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        {!user ? (
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        ) : (
          <UserDropdownMenu onSignOut={handleSignOut} />
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
