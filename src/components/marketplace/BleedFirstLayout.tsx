
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface BleedFirstLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: "full-bleed" | "content-bleed";
  height?: "auto" | "min-screen" | "screen";
  background?: string;
}

const BleedFirstLayout: React.FC<BleedFirstLayoutProps> = ({
  children,
  className = "",
  variant = "content-bleed",
  height = "auto",
  background = "",
}) => {
  const isMobile = useIsMobile();
  
  const heightClasses = {
    auto: "",
    "min-screen": "min-h-screen",
    screen: "h-screen",
  };
  
  if (variant === "full-bleed") {
    // Complete edge-to-edge with no internal constraints
    return (
      <div className={cn(
        "w-full",
        heightClasses[height],
        background,
        className
      )}>
        {children}
      </div>
    );
  }
  
  // Content-bleed: Edge-to-edge visuals with internal content padding
  return (
    <div className={cn(
      "w-full",
      heightClasses[height],
      background,
      className
    )}>
      <div className={cn(
        "w-full h-full",
        isMobile 
          ? "px-4" // Minimal mobile padding for readability
          : "px-6 max-w-[1400px] mx-auto" // Desktop: content constraint with generous padding
      )}>
        {children}
      </div>
    </div>
  );
};

export default BleedFirstLayout;
