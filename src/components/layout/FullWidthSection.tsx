
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FullWidthSectionProps {
  children: ReactNode;
  className?: string;
  background?: "white" | "gray" | "gradient" | "transparent";
  padding?: "none" | "minimal" | "standard" | "large";
}

/**
 * A section component that extends to full screen width for visual content
 */
export const FullWidthSection: React.FC<FullWidthSectionProps> = ({
  children,
  className = "",
  background = "transparent",
  padding = "standard",
}) => {
  const isMobile = useIsMobile();
  
  const backgroundClasses = {
    white: "bg-white",
    gray: "bg-gray-50",
    gradient: "bg-gradient-to-r from-purple-50 to-pink-50",
    transparent: "bg-transparent"
  };
  
  const paddingClasses = {
    none: "",
    minimal: isMobile ? "py-2" : "py-4",
    standard: isMobile ? "py-4" : "py-8",
    large: isMobile ? "py-6" : "py-12"
  };
  
  return (
    <section className={cn(
      "w-full",
      backgroundClasses[background],
      paddingClasses[padding],
      className
    )}>
      {children}
    </section>
  );
};
