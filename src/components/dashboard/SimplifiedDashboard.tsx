import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import ShoppingFocusCard from "./simplified/ShoppingFocusCard";
import QuickShopCard from "./simplified/QuickShopCard";
import GiftRemindersCard from "./simplified/GiftRemindersCard";
import ProfileDataIntegrityPanel from "@/components/settings/ProfileDataIntegrityPanel";

const SimplifiedDashboard = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      {/* Profile Data Integrity Panel - Always show first */}
      <ProfileDataIntegrityPanel />

      {/* Main Shopping Section */}
      <div className="w-full">
        <ShoppingFocusCard />
      </div>

      {/* Secondary actions - responsive grid */}
      <div className={cn(
        "grid gap-6",
        isMobile ? "grid-cols-1" : "grid-cols-2"
      )}>
        <div className="flex flex-col h-full">
          <QuickShopCard />
        </div>
        <div className="flex flex-col h-full">
          <GiftRemindersCard />
        </div>
      </div>
    </div>
  );
};

export default SimplifiedDashboard;