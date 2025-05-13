
import React, { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileClassName?: string;
  desktopClassName?: string;
  className?: string;
  mobileBreakpoint?: number;
}

/**
 * A responsive layout component that applies different styles based on viewport size
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  mobileClassName = "",
  desktopClassName = "",
  className = "",
  mobileBreakpoint = 768,
}) => {
  const isMobile = useIsMobile(mobileBreakpoint);
  
  return (
    <div className={cn(className, isMobile ? mobileClassName : desktopClassName)}>
      {children}
    </div>
  );
};
