
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { ShoppingCart, Menu, X, Search, Gift, Users, ShoppingBag, Heart, Calendar, Settings, User, HelpCircle, Info, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserDropdownMenu from "@/components/navigation/components/UserDropdownMenu";

const NavigationBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
      setSearchQuery("");
    }
  };

  const handleProtectedNavigation = (path: string, label: string) => {
    if (!user) {
      navigate(`/signin?redirect=${encodeURIComponent(path)}`);
      return;
    }
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const publicShopItems = [
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { label: "Categories", href: "/marketplace?category=all", icon: Gift },
    { label: "Trending", href: "/marketplace?sort=popular", icon: Heart },
  ];

  const protectedAccountItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Orders", href: "/orders" },
    { label: "My Wishlists", href: "/my-wishlists" },
    { label: "Events & Dates", href: "/events" },
    { label: "Settings", href: "/settings" },
    { label: "Profile", href: "/profile" },
  ];

  const protectedConnectItems = [
    { label: "My Friends", href: "/connections" },
    { label: "Find Friends", href: "/connections?tab=suggestions" },
    { label: "Messages", href: "/messages" },
  ];

  const supportItems = [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "About Us", href: "/about" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Desktop Navigation */}
      <div className="hidden md:flex container mx-auto px-4 py-4 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-purple-600">Elyphant</span>
        </Link>

        <div className="flex items-center space-x-6">
          <Link to="/marketplace" className="text-gray-700 hover:text-purple-600">
            Marketplace
          </Link>
          <Link to="/events" className="text-gray-700 hover:text-purple-600">
            Events
          </Link>
          {user && (
            <Link to="/connections" className="text-gray-700 hover:text-purple-600">
              Friends
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/marketplace">
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </Button>
          
          {user ? (
            <UserDropdownMenu />
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-purple-600">Elyphant</span>
          </Link>

          <div className="flex items-center space-x-3">
            {/* Shopping Cart */}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/marketplace">
                <ShoppingCart className="w-5 h-5" />
              </Link>
            </Button>

            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <div className="px-4 py-4 space-y-6">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search for gifts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <Button type="submit" size="sm">
                  Search
                </Button>
              </form>

              {/* SHOP Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Shop</h3>
                <div className="space-y-2">
                  {publicShopItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* MY ACCOUNT Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">My Account</h3>
                <div className="space-y-2">
                  {protectedAccountItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleProtectedNavigation(item.href, item.label)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <User className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CONNECT Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Connect</h3>
                <div className="space-y-2">
                  {protectedConnectItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleProtectedNavigation(item.href, item.label)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SUPPORT Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Support</h3>
                <div className="space-y-2">
                  {supportItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <HelpCircle className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Authentication Section */}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2">
                      <p className="text-sm text-gray-600">Signed in as</p>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors w-full text-left text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      asChild
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/signin">Sign In</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;
