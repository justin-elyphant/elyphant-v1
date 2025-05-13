
import React, { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  fullWidthOnMobile?: boolean;
}

/**
 * A container component that adapts its width and padding based on the viewport size
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = "",
  fullWidthOnMobile = true,
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "mx-auto px-4 w-full transition-all duration-300",
      isMobile && fullWidthOnMobile ? "max-w-full" : "max-w-7xl",
      isMobile ? "py-3" : "py-6",
      className
    )}>
      {children}
    </div>
  );
};
