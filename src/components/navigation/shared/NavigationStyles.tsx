import { cn } from "@/lib/utils";

export const navigationStyles = {
  // Section Headers
  sectionHeader: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center",
  
  // Navigation Items
  navItem: "flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground group",
  navItemActive: "bg-accent text-primary font-medium",
  navItemIcon: "h-5 w-5 text-primary group-hover:text-primary mr-3",
  navItemLabel: "font-medium",
  
  // Dropdown Items (Desktop)
  dropdownItem: "flex items-center cursor-pointer",
  dropdownIcon: "mr-2 h-4 w-4",
  dropdownLabel: "relative",
  
  // Quick Action Cards
  quickActionCard: "flex flex-col items-center p-4 rounded-xl bg-card hover:bg-accent transition-colors border",
  quickActionIcon: "h-6 w-6 text-primary mb-2",
  quickActionLabel: "text-sm font-medium text-foreground",
  
  // Mobile Grid
  mobileGrid: "grid grid-cols-2 gap-3",
  
  // Separators
  separator: "my-4",
  
  // Special Actions
  signOutButton: "w-full flex items-center p-3 rounded-lg hover:bg-destructive/10 transition-colors text-destructive group",
  authPrompt: "bg-primary/5 rounded-xl p-6 border border-primary/10 text-center",
  
  // Cart Summary
  cartSummary: "bg-primary/5 rounded-xl p-4 border border-primary/10",
  cartHeader: "flex items-center justify-between mb-3",
  cartTitle: "font-semibold text-foreground flex items-center",
  cartAmount: "text-2xl font-bold text-foreground mb-3",
  
  // Badges
  badge: "ml-auto",
  badgeMobile: "absolute -top-2 -right-2 min-w-[18px] h-[18px] text-xs",
  badgeDesktop: "absolute -top-2 -right-2 min-w-[1rem] h-4 text-xs"
};

// Helper function to get navigation item classes
export const getNavItemClasses = (isActive: boolean, variant: 'mobile' | 'desktop' = 'mobile') => {
  const base = navigationStyles.navItem;
  const active = isActive ? navigationStyles.navItemActive : "";
  return cn(base, active);
};

// Helper function for icon classes
export const getIconClasses = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };
  return cn(sizeMap[size], "text-primary group-hover:text-primary mr-3");
};