import React from "react";
import RecentOrderWidget from "../widgets/RecentOrderWidget";
import ShippingAddressWidget from "../widgets/ShippingAddressWidget";
import PaymentMethodWidget from "../widgets/PaymentMethodWidget";
import WishlistUpdatesWidget from "../widgets/WishlistUpdatesWidget";
import UpcomingAutoGiftsWidget from "../widgets/UpcomingAutoGiftsWidget";
import ConnectionsWidget from "../widgets/ConnectionsWidget";
import DashboardSectionHeader from "../DashboardSectionHeader";

const OverviewTab = () => {
  return (
    <div className="space-y-8">
      {/* Recent Order - Full Width */}
      <RecentOrderWidget />

      {/* Profile Section - Two Column Grid */}
      <div>
        <DashboardSectionHeader title="Profile" viewAllLink="/settings" viewAllText="View profile" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShippingAddressWidget />
          <PaymentMethodWidget />
        </div>
      </div>

      {/* Gifting Section - Two Column Grid */}
      <div>
        <DashboardSectionHeader title="Gifting" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WishlistUpdatesWidget />
          <UpcomingAutoGiftsWidget />
        </div>
      </div>

      {/* Connections - Full Width */}
      <ConnectionsWidget />
    </div>
  );
};

export default OverviewTab;
