
import { useState, useEffect } from "react";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const breakpointValues = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Hook to detect the current breakpoint based on window width
 * @returns The current breakpoint name
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("lg");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < breakpointValues.sm) {
        setBreakpoint("xs");
      } else if (width < breakpointValues.md) {
        setBreakpoint("sm");
      } else if (width < breakpointValues.lg) {
        setBreakpoint("md");
      } else if (width < breakpointValues.xl) {
        setBreakpoint("lg");
      } else if (width < breakpointValues["2xl"]) {
        setBreakpoint("xl");
      } else {
        setBreakpoint("2xl");
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return breakpoint;
}

/**
 * Hook to detect if the current viewport matches or exceeds a specific breakpoint
 * @param breakpoint The minimum breakpoint to check for
 * @returns Boolean indicating if the current viewport is at or above the specified breakpoint
 */
export function useMinBreakpoint(breakpoint: Breakpoint): boolean {
  const currentBreakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"];
  
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const targetIndex = breakpointOrder.indexOf(breakpoint);
  
  return currentIndex >= targetIndex;
}
