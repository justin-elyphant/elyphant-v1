
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface BleedFirstLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const BleedFirstLayout: React.FC<BleedFirstLayoutProps> = ({
  children,
  className = "",
}) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    // Mobile: Full bleed for maximum product visibility
    return (
      <div className={`w-full ${className}`}>
        {children}
      </div>
    );
  }
  
  // Desktop: Strategic container with generous margins for products
  return (
    <div className={`w-full max-w-[1400px] mx-auto px-4 lg:px-6 ${className}`}>
      {children}
    </div>
  );
};

export default BleedFirstLayout;
