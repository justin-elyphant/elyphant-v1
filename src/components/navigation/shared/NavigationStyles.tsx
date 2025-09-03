import { cn } from "@/lib/utils";

export const navigationStyles = {
  // Section Headers
  sectionHeader: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center",
  
  // Navigation Items - Enhanced with consistent interactions
  navItem: "flex items-center p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-all duration-200 text-foreground group touch-manipulation",
  navItemActive: "bg-accent text-primary font-medium shadow-sm",
  navItemIcon: "h-5 w-5 text-primary group-hover:text-primary/90 group-active:text-primary mr-3 transition-colors duration-200",
  navItemLabel: "font-medium transition-colors duration-200",
  
  // Dropdown Items (Desktop) - Enhanced hover states
  dropdownItem: "flex items-center cursor-pointer hover:bg-accent/80 active:bg-accent transition-all duration-200 rounded-sm",
  dropdownIcon: "mr-2 h-4 w-4 transition-colors duration-200",
  dropdownLabel: "relative transition-colors duration-200",
  
  // Quick Action Cards - Enhanced touch interactions
  quickActionCard: "flex flex-col items-center p-4 rounded-xl bg-card hover:bg-accent active:bg-accent/80 transition-all duration-200 border shadow-sm hover:shadow-md touch-manipulation",
  quickActionIcon: "h-6 w-6 text-primary mb-2 transition-transform duration-200 group-hover:scale-105 group-active:scale-95",
  quickActionLabel: "text-sm font-medium text-foreground transition-colors duration-200",
  
  // Mobile Grid
  mobileGrid: "grid grid-cols-2 gap-3",
  
  // Separators
  separator: "my-4",
  
  // Special Actions - Enhanced destructive state
  signOutButton: "w-full flex items-center p-3 rounded-lg hover:bg-destructive/10 active:bg-destructive/20 transition-all duration-200 text-destructive group touch-manipulation",
  authPrompt: "bg-primary/5 rounded-xl p-6 border border-primary/10 text-center",
  
  // Cart Summary
  cartSummary: "bg-primary/5 rounded-xl p-4 border border-primary/10 shadow-sm",
  cartHeader: "flex items-center justify-between mb-3",
  cartTitle: "font-semibold text-foreground flex items-center",
  cartAmount: "text-2xl font-bold text-foreground mb-3",
  
  // Badges - Enhanced consistency
  badge: "ml-auto transition-transform duration-200 hover:scale-105",
  badgeMobile: "absolute -top-2 -right-2 min-w-[18px] h-[18px] text-xs transition-all duration-200",
  badgeDesktop: "absolute -top-2 -right-2 min-w-[1rem] h-4 text-xs transition-all duration-200",
  
  // Loading States
  loadingSpinner: "animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full",
  loadingContainer: "flex items-center justify-center p-4",
  
  // Focus States (for accessibility)
  focusRing: "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
  
  // Touch Targets
  touchTarget: "min-h-[44px] min-w-[44px] touch-manipulation",
  
  // Animation Classes
  enterAnimation: "animate-fade-in",
  exitAnimation: "animate-fade-out",
  scaleAnimation: "transition-transform duration-200 hover:scale-105 active:scale-95"
};

// Helper function to get navigation item classes with enhanced states
export const getNavItemClasses = (isActive: boolean, variant: 'mobile' | 'desktop' = 'mobile') => {
  const base = navigationStyles.navItem;
  const active = isActive ? navigationStyles.navItemActive : "";
  const focus = navigationStyles.focusRing;
  return cn(base, active, focus);
};

// Helper function for icon classes with enhanced states
export const getIconClasses = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };
  return cn(sizeMap[size], "text-primary group-hover:text-primary/90 group-active:text-primary mr-3 transition-colors duration-200");
};

// Helper for touch-friendly interactive elements
export const getTouchInteractiveClasses = (isActive?: boolean) => {
  return cn(
    navigationStyles.touchTarget,
    navigationStyles.focusRing,
    navigationStyles.scaleAnimation,
    isActive && "text-primary"
  );
};