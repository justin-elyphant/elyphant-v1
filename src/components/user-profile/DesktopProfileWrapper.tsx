import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DesktopProfileWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const DesktopProfileWrapper: React.FC<DesktopProfileWrapperProps> = ({
  children,
  className = ""
}) => {
  const isMobile = useIsMobile();

  // For mobile, don't apply any constraints - full width
  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  // For desktop, apply max-width constraints and centering
  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {children}
    </div>
  );
};

export default DesktopProfileWrapper;