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
  
  // Show breadcrumbs on deep pages
  const showBreadcrumbs = location.pathname.split('/').length > 2;

  return (
    <ModernHeaderManager 
      mode={mode}
      className={className}
      showBreadcrumbs={showBreadcrumbs}
    />
  );
};

export default UnifiedShopperHeader;