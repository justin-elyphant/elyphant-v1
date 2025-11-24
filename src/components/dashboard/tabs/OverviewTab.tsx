import React from "react";
import UpcomingAutoGiftsWidget from "../widgets/UpcomingAutoGiftsWidget";
import WishlistUpdatesWidget from "../widgets/WishlistUpdatesWidget";
import QuickActionsGrid from "../widgets/QuickActionsGrid";

const OverviewTab = () => {
  return (
    <div className="space-y-6">
      <UpcomingAutoGiftsWidget />
      <WishlistUpdatesWidget />
      <QuickActionsGrid />
    </div>
  );
};

export default OverviewTab;
