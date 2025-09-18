import React from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import ModernHeaderManager from "./ModernHeaderManager";

interface UnifiedShopperHeaderProps {
  mode?: "main" | "minimal" | "marketplace-focused";
  className?: string;
  showSearch?: boolean;
  showCart?: boolean;
}

const UnifiedShopperHeader: React.FC<UnifiedShopperHeaderProps> = ({
  mode = "main",
  className,
  showSearch,
  showCart,
}) => {
  const location = useLocation();
  
  // Breadcrumbs disabled for cleaner header
  const showBreadcrumbs = false;

  return (
    <ModernHeaderManager 
      mode={mode}
      className={className}
      showBreadcrumbs={showBreadcrumbs}
    />
  );
};

export default UnifiedShopperHeader;