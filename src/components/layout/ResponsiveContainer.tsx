
import React, { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  fullWidthOnMobile?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
  padding?: "none" | "minimal" | "standard" | "large";
}

/**
 * A container component that selectively applies constraints for text content only
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = "",
  fullWidthOnMobile = true,
  maxWidth = "full",
  padding = "minimal",
}) => {
  const isMobile = useIsMobile();
  
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "7xl": "max-w-7xl",
    full: "max-w-none w-full"
  };
  
  const paddingClasses = {
    none: "",
    minimal: "px-4",
    standard: "px-6",
    large: "px-8"
  };
  
  // On mobile with fullWidthOnMobile, use minimal constraints
  const shouldUseFullWidth = isMobile && fullWidthOnMobile;
  
  return (
    <div 
      className={cn(
        "w-full transition-all duration-300",
        shouldUseFullWidth ? "max-w-none" : maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
      style={{ width: '100%', maxWidth: 'none' }}
    >
      {children}
    </div>
  );
};
