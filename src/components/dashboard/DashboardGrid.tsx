
import React from "react";
import GiftsCard from "./GiftsCard";
import OrdersCard from "./OrdersCard";
import FriendsCard from "./FriendsCard";
import SettingsCard from "./SettingsCard";
import UpcomingEventsCard from "./UpcomingEventsCard";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Main cards - UpcomingEventsCard takes full width */}
      <div>
        <UpcomingEventsCard />
      </div>

      {/* Secondary cards - grid layout with consistent heights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col h-full">
          <GiftsCard />
        </div>
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
