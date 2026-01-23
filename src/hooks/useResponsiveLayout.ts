import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Unified responsive layout hook for tablet content density enhancements.
 * 
 * Industry Standard (Amazon, Target, Lululemon pattern):
 * - Keep iOS Capacitor "app shell" (bottom nav, safe areas, haptics) identical on phones AND tablets
 * - Only enhance CONTENT layouts for better screen utilization on 768px-1024px devices
 * 
 * Breakpoints:
 * - Phone: < 768px (single column layouts)
 * - Tablet: 768px - 1024px (2-column layouts, split views)
 * - Desktop: > 1024px (sidebar navigation, 3-column layouts)
 */
export function useResponsiveLayout() {
  // Using the existing useIsMobile hook with different breakpoints
  const isUnderTablet = useIsMobile(768);   // < 768px
  const isUnderDesktop = useIsMobile(1024); // < 1024px
  
  const isPhone = isUnderTablet;
  const isTablet = !isUnderTablet && isUnderDesktop; // 768px - 1024px
  const isDesktop = !isUnderDesktop;
  
  return {
    // Device classification
    isPhone,
    isTablet,
    isDesktop,
    
    // Navigation shell type (for iOS Capacitor patterns)
    // Both phones AND tablets use the mobile shell (bottom nav, safe areas, haptics)
    usesMobileShell: isUnderDesktop,
    
    // Content layout helpers
    gridColumns: isPhone ? 1 : isTablet ? 2 : 3,
    
    // Common layout patterns
    contentMaxWidth: isPhone ? 'full' : isTablet ? '4xl' : '6xl',
    
    // For components that need more granular control
    breakpoint: isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop',
  };
}

export type ResponsiveLayout = ReturnType<typeof useResponsiveLayout>;
