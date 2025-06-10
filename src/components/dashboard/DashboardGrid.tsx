
import React from "react";
import OrdersCard from "./OrdersCard";
import FriendsCard from "./FriendsCard";
import SettingsCard from "./SettingsCard";
import UpcomingEventsCard from "./UpcomingEventsCard";
import WishlistsCard from "./WishlistsCard";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Main hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <UpcomingEventsCard />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <WishlistsCard />
        </div>
      </div>

      {/* Secondary cards - grid layout with consistent heights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex flex-col h-full">
          <OrdersCard />
        </div>
        <div className="flex flex-col h-full">
          <FriendsCard />
        </div>
        <div className="flex flex-col h-full">
          <SettingsCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;
