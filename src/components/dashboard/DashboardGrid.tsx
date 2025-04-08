
import React from "react";
import WishlistsCard from "./WishlistsCard";
import EventsCard from "./EventsCard";
import OrdersCard from "./OrdersCard";
import FriendsCard from "./FriendsCard";
import SettingsCard from "./SettingsCard";
import UpcomingEventsCard from "./UpcomingEventsCard";
import FindGiftsCard from "./FindGiftsCard";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Main cards - full width or 2/3 width on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingEventsCard />
        </div>
        <div>
          <FindGiftsCard />
        </div>
      </div>

      {/* Secondary cards - grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WishlistsCard />
        <EventsCard />
        <OrdersCard />
        <FriendsCard />
        <SettingsCard />
      </div>
    </div>
  );
};

export default DashboardGrid;
