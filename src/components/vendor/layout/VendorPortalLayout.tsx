import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { VendorGuard } from "@/components/vendor/auth/VendorGuard";
import VendorSidebar from "./VendorSidebar";
import VendorTopBar from "./VendorTopBar";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "vendor_sidebar_collapsed";

const VendorPortalLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  return (
    <VendorGuard>
      <div className="min-h-screen bg-background">
        <VendorSidebar collapsed={collapsed} onToggle={handleToggle} />
        <VendorTopBar sidebarCollapsed={collapsed} />
        <main
          className={cn(
            "pt-14 min-h-screen transition-all duration-200",
            collapsed ? "ml-[60px]" : "ml-[220px]"
          )}
        >
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </VendorGuard>
  );
};

export default VendorPortalLayout;
