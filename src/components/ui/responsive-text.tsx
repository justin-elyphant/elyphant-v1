
import React, { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveTextProps {
  children: ReactNode;
  mobileSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  desktopSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  className?: string;
}

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
};

/**
 * A component that renders text with different sizes on mobile and desktop
 */
export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  mobileSize = "base",
  desktopSize = "lg",
  as = "p",
  className = "",
}) => {
  const isMobile = useIsMobile();
  const Element = as;
  
  const size = isMobile ? mobileSize : desktopSize;
  
  return (
    <Element className={cn(sizeClasses[size], className)}>
      {children}
    </Element>
  );
};
