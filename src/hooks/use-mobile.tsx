
import { useEffect, useState } from "react";

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param breakpoint The width in pixels below which we consider the viewport to be mobile (default: 768px)
 * @returns A boolean indicating if the current viewport is mobile-sized
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
