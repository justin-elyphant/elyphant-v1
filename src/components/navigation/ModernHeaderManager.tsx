import React, { useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { useHeaderState } from "@/hooks/useHeaderState";
import { Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

// Component imports
import Logo from "@/components/home/components/Logo";
import AuthButtons from "@/components/home/components/AuthButtons";
import UserButton from "@/components/auth/UserButton";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";
import OptimizedShoppingCartButton from "@/components/marketplace/components/OptimizedShoppingCartButton";
import MobileAuthMenu from "./MobileAuthMenu";

import CategoryLinks from "./CategoryLinks";

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
  const navigate = useNavigate();

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
        <div className="w-full px-4 md:px-8 overflow-x-hidden" style={{ width: '100%', maxWidth: 'none' }}>
          <div className={cn(
            "flex items-center",
            config.height
          )}>
            {/* Logo - fixed width for consistent alignment */}
            <div className="flex-shrink-0 mr-4 lg:mr-6">
              <Logo />
            </div>

            {/* Desktop + Tablet Search Bar - centered in main row */}
            {config.showSearch && (
              <div className="hidden md:flex flex-1 justify-center">
                <div className="w-full max-w-2xl">
                  <AIEnhancedSearchBar />
                </div>
              </div>
            )}

            {/* Spacer for mobile to push utilities right */}
            <div className="flex-1 md:hidden" />

            {/* Desktop + Tablet Right Utilities */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0 ml-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/connections")}
                aria-label="Connections"
              >
                <Users className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/wishlists")}
                aria-label="Wishlists"
              >
                <Heart className="h-6 w-6" />
              </Button>
              {config.showCart && <OptimizedShoppingCartButton />}
              {user ? <UserButton /> : <AuthButtons />}
            </div>

            {/* Mobile Right Side (phone only) */}
            <div className="md:hidden flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/connections")}
                aria-label="Connections"
              >
                <Users className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/wishlists")}
                aria-label="Wishlists"
              >
                <Heart className="h-6 w-6" />
              </Button>
              {config.showCart && <OptimizedShoppingCartButton />}
              {user ? <UserButton /> : <MobileAuthMenu />}
            </div>
          </div>

          {/* Desktop + Tablet Category Strip - second row */}
          <div className="hidden md:flex items-center justify-center py-1">
            <CategoryLinks />
          </div>

          {/* Mobile-only Search Bar */}
          {config.showSearch && (
            <div className="md:hidden py-2">
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