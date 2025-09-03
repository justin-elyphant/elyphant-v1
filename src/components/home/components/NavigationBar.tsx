
import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import Logo from "./Logo";
import AuthButtons from "./AuthButtons";
import UserButton from "@/components/auth/UserButton";

// Import directly instead of lazy loading to avoid context issues
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import OptimizedShoppingCartButton from "@/components/marketplace/components/OptimizedShoppingCartButton";

const NavigationBar = () => {
  const authContext = useAuth();
  const location = useLocation();

  // Handle case where AuthProvider context is not yet available
  if (!authContext) {
    return (
      <nav className="bg-transparent">
        <div className="container-header">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Logo />
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="h-10 w-20 surface-secondary rounded animate-pulse" />
            </div>
            <div className="md:hidden">
              <div className="h-10 w-10 surface-secondary rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const { user, signOut } = authContext;

  // Don't load heavy components on auth pages for better performance
  const isAuthPage = ['/auth', '/reset-password'].includes(location.pathname);
  const shouldShowSearch = !isAuthPage;
  const shouldShowCart = !isAuthPage;

  return (
    <nav className="bg-transparent">
      <div className="container-header">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Search Bar */}
          {shouldShowSearch && (
            <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-4">
              <AIEnhancedSearchBar />
            </div>
          )}

          {/* Desktop Auth & Cart */}
          <div className="hidden md:flex items-center gap-commerce">
            {shouldShowCart && <OptimizedShoppingCartButton />}
            {user ? <UserButton /> : <AuthButtons />}
          </div>

          {/* Mobile Right Side - Only Cart and User */}
          <div className="md:hidden flex items-center gap-tight">
            {shouldShowCart && <OptimizedShoppingCartButton />}
            {user && <UserButton />}
          </div>
        </div>

        {/* Mobile Search Bar - Below header */}
        {shouldShowSearch && (
          <div className="md:hidden touch-padding-sm pt-2 pb-6">
            <AIEnhancedSearchBar mobile />
          </div>
        )}
      </div>

    </nav>
  );
};

export default NavigationBar;
