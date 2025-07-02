
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import UserDropdownMenu from '@/components/navigation/components/UserDropdownMenu';
import Logo from './Logo';
import SearchBar from './SearchBar';

const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleProtectedNavigation = (path: string) => {
    if (!user) {
      navigate(`/sign-in?redirect=${encodeURIComponent(path)}`);
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const handlePublicNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" onClick={() => handlePublicNavigation('/marketplace')}>
              Marketplace
            </Button>
            
            {user ? (
              <>
                <Button variant="ghost" onClick={() => handleProtectedNavigation('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => handleProtectedNavigation('/connections')}>
                  Connections
                </Button>
                <UserDropdownMenu onSignOut={handleSignOut} />
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/sign-in')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/sign-up')}>
                  Sign Up
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Mobile Search */}
                <div className="mb-6">
                  <SearchBar />
                </div>

                <div className="space-y-6">
                  {/* SHOP Section */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">SHOP</h3>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => handlePublicNavigation('/marketplace')}>
                        Browse Products
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => handlePublicNavigation('/categories')}>
                        Categories
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => handlePublicNavigation('/trending')}>
                        Trending
                      </Button>
                    </div>
                  </div>

                  {/* MY ACCOUNT Section */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">MY ACCOUNT</h3>
                    <div className="space-y-2">
                      {user ? (
                        <>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/dashboard')}>
                            Dashboard
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/orders')}>
                            Order History
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/wishlists')}>
                            My Wishlists
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/events')}>
                            Events & Dates
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/settings')}>
                            Account Settings
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/sign-in')}>
                            Sign In
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/sign-up')}>
                            Create Account
                          </Button>
                          <div className="text-sm text-gray-500 px-3 py-2">
                            Sign in to access your orders, wishlists, and more
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CONNECT Section */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">CONNECT</h3>
                    <div className="space-y-2">
                      {user ? (
                        <>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/connections')}>
                            Friends & Family
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/messages')}>
                            Messages
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => handleProtectedNavigation('/shared-wishlists')}>
                            Shared Wishlists
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-gray-500 px-3 py-2">
                            Create an account to connect with friends and share wishlists
                          </div>
                          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/sign-up?redirect=/connections')}>
                            Join to Connect
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* SUPPORT Section */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">SUPPORT</h3>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => handlePublicNavigation('/help')}>
                        Help Center
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => handlePublicNavigation('/contact')}>
                        Contact Us
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" onClick={() => handlePublicNavigation('/about')}>
                        About Us
                      </Button>
                    </div>
                  </div>

                  {/* Sign Out for authenticated users */}
                  {user && (
                    <div className="pt-4 border-t">
                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
