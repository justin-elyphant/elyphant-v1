import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import ECommerceNavigation from "../navigation/ECommerceNavigation";

interface OptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const OptimizedLayout: React.FC<OptimizedLayoutProps> = ({ children, className }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <ECommerceNavigation />
      
      {/* Main Content */}
      <main className={cn(
        "flex-1",
        isMobile ? "pb-20" : "pb-8", // Account for mobile bottom nav
        className
      )}>
        {children}
      </main>
    </div>
  );
};

export default OptimizedLayout;