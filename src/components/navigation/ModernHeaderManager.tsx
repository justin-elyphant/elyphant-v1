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
  const { headerState, isScrollingUp, config, scrollY } = useHeaderState();
  const headerRef = useRef<HTMLElement>(null);

  // Performance optimization: Add will-change for smooth transforms
  useEffect(() => {
    const header = headerRef.current;
    if (header) {
      header.style.willChange = 'transform, height, opacity';
      return () => {
        header.style.willChange = 'auto';
      };
    }
  }, []);

  // Handle case where AuthProvider context is not yet available
  if (!authContext) {
    return (
      <header 
        ref={headerRef}
        className={cn(
          "sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm transition-all duration-300",
          className
        )}
      >
        <nav className="bg-transparent">
          <div className="container-header">
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
        "sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border transition-all duration-300 ease-out",
        // Transform for smooth hide/show behavior
        headerState === 'minimal' && !isScrollingUp && scrollY > 300 
          ? 'transform -translate-y-2 shadow-lg' 
          : 'transform translate-y-0 shadow-sm',
        className
      )}
      style={{
        // CSS custom properties for smooth transitions
        '--header-height': config.height.includes('20') ? '80px' : config.height.includes('16') ? '64px' : '56px'
      } as React.CSSProperties}
    >
      <nav className="bg-transparent">
        <div className="container-header">
          <div className={cn(
            "flex items-center transition-all duration-300",
            config.height
          )}>
            {/* Progressive Logo */}
            <div className={cn(
              "flex-shrink-0 transition-all duration-300",
              config.logoSize
            )}>
              <Logo />
            </div>

            {/* Progressive Search Bar - Expands on scroll up */}
            {config.showSearch && (
              <div className={cn(
                "hidden md:flex transition-all duration-300",
                config.searchWidth,
                // Search expansion on scroll up
                isScrollingUp && headerState !== 'full' 
                  ? 'transform scale-105 opacity-100' 
                  : 'transform scale-100 opacity-90'
              )}>
                <AIEnhancedSearchBar />
              </div>
            )}

            {/* Breadcrumbs for deep pages */}
            {showBreadcrumbs && headerState === 'full' && (
              <div className="hidden lg:flex items-center text-sm text-muted-foreground mx-4">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <span>Current Page</span>
              </div>
            )}

            {/* Desktop Auth & Cart */}
            <div className="hidden md:flex items-center gap-commerce flex-shrink-0">
              {config.showCart && (
                <div className="relative group">
                  <OptimizedShoppingCartButton />
                  {/* Cart preview on hover - for Phase 5 enhancement */}
                  <div className="absolute top-full right-0 w-80 bg-white border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mt-2 z-50">
                    <div className="p-4 text-sm text-muted-foreground">
                      Cart preview coming soon
                    </div>
                  </div>
                </div>
              )}
              {user ? <UserButton /> : <AuthButtons />}
            </div>

            {/* Mobile Right Side - Adaptive to header state */}
            <div className={cn(
              "md:hidden flex items-center ml-auto transition-all duration-300",
              headerState === 'minimal' ? 'gap-1' : 'gap-3'
            )}>
              {user && headerState !== 'minimal' && <UserButton />}
              {config.showCart && <OptimizedShoppingCartButton />}
            </div>
          </div>

          {/* Mobile Search Bar - Responsive to header state */}
          {config.showSearch && (
            <div className={cn(
              "md:hidden bg-surface/30 border-t border-border/30 transition-all duration-300",
              headerState === 'minimal' ? 'py-1' : 'py-2'
            )}>
              <div className="px-2">
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