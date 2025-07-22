
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FullBleedSectionProps {
  children: ReactNode;
  className?: string;
  background?: string;
  height?: "auto" | "min-screen" | "screen" | "large";
  contentPadding?: boolean;
}

/**
 * A true bleed-first section that extends edge-to-edge in all directions
 */
export const FullBleedSection: React.FC<FullBleedSectionProps> = ({
  children,
  className = "",
  background = "",
  height = "auto",
  contentPadding = true,
}) => {
  const isMobile = useIsMobile();
  
  const heightClasses = {
    auto: "",
    "min-screen": "min-h-screen",
    screen: "h-screen",
    large: isMobile ? "min-h-[60vh]" : "min-h-[80vh]",
  };
  
  return (
    <section className={cn(
      "w-full relative overflow-hidden",
      heightClasses[height],
      background,
      className
    )}>
      {contentPadding ? (
        <div className={cn(
          "w-full h-full relative z-10",
          isMobile 
            ? "px-4 py-8" 
            : "px-6 py-12 max-w-[1400px] mx-auto"
        )}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
};
