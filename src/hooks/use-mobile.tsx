
import { useEffect, useState } from "react";

/**
 * Hook to detect if the current viewport is mobile-sized
 * Optimized for iframe environments
 * @param breakpoint The width in pixels below which we consider the viewport to be mobile (default: 768px)
 * @returns A boolean indicating if the current viewport is mobile-sized
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    // Safe initial value calculation
    if (typeof window === "undefined") return false;
    try {
      return window.innerWidth < breakpoint;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth < breakpoint);
      } catch (error) {
        console.warn('Error in resize handler:', error);
      }
    };

    // Set initial value safely
    handleResize();

    // Add event listener with error handling
    window.addEventListener("resize", handleResize, { passive: true });

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
