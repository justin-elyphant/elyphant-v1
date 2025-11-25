import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { useHeaderState } from "@/hooks/useHeaderState";

// Component imports
import Logo from "@/components/home/components/Logo";
import AuthButtons from "@/components/home/components/AuthButtons";
import UserButton from "@/components/auth/UserButton";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import OptimizedShoppingCartButton from "@/components/marketplace/components/OptimizedShoppingCartButton";
import MobileAuthMenu from "./MobileAuthMenu";
import DesktopHorizontalNav from "./DesktopHorizontalNav";
import SearchIconTrigger from "./SearchIconTrigger";

interface ModernHeaderManagerProps {
  mode?: "main" | "minimal" | "marketplace-focused";
  className?: string;
  showBreadcrumbs?: boolean;
}

const ModernHeaderManager: React.FC<ModernHeaderManagerProps> = ({
  mode = "main",
  className,
  showBreadcrumbs = false,
}) => {
  const authContext = useAuth();
  const { isScrolled, config } = useHeaderState();
  const headerRef = useRef<HTMLElement>(null);

  // Handle case where AuthProvider context is not yet available
  if (!authContext) {
    return (
      <header 
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 bg-white border-b border-border shadow-sm transition-all duration-300",
          className
        )}
      >
        <nav className="bg-transparent">
          <div className="w-full px-4" style={{ width: '100%', maxWidth: 'none' }}>
            <div className={cn("flex items-center justify-between", config.height)}>
              <div className={cn("flex-shrink-0", config.logoSize)}>
                <Logo />
              </div>
              <div className="hidden md:flex items-center space-x-4" />
              <div className="md:hidden" />
            </div>
          </div>
        </nav>
      </header>
    );
  }

  const { user } = authContext;

  return (
    <header 
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 bg-white border-b border-border transition-shadow duration-300",
        // Only subtle shadow change on scroll
        isScrolled ? 'shadow-md' : 'shadow-sm',
        className
      )}
    >
      <nav className="bg-transparent">
        <div className="w-full px-4" style={{ width: '100%', maxWidth: 'none' }}>
          <div className={cn(
            "flex items-center gap-6 md:gap-8",
            config.height
          )}>
            {/* Logo */}
            <div className="flex-shrink-0 w-24 lg:w-40">
              <Logo />
            </div>

            {/* Search Bar - Right on tablet, centered on desktop */}
            {config.showSearch && (
              <div className="hidden md:flex flex-1 md:justify-end lg:justify-center">
                <div className="w-full max-w-md">
                  <AIEnhancedSearchBar />
                </div>
              </div>
            )}

            {/* Desktop Right Utilities */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0 min-w-[200px]">
              {config.showCart && <OptimizedShoppingCartButton />}
              {user ? <UserButton /> : <AuthButtons />}
            </div>

            {/* Mobile Right Side - always consistent */}
            <div className="md:hidden flex items-center ml-auto gap-2">
              {config.showCart && <OptimizedShoppingCartButton />}
              {user ? <UserButton /> : <MobileAuthMenu />}
            </div>
          </div>

          {/* Mobile Search Bar - always visible */}
          {config.showSearch && (
            <div className="md:hidden bg-gray-50/80 border-t border-gray-200 py-3">
              <div className="px-4">
                <AIEnhancedSearchBar mobile />
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default ModernHeaderManager;