
import React from "react";
import WishlistsCard from "./WishlistsCard";
import EventsCard from "./EventsCard";
import OrdersCard from "./OrdersCard";
import FriendsCard from "./FriendsCard";
import SettingsCard from "./SettingsCard";
import UpcomingEventsCard from "./UpcomingEventsCard";
import FavoritesCard from "./FavoritesCard";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Main cards - UpcomingEventsCard now takes full width */}
      <div>
        <UpcomingEventsCard />
      </div>

      {/* Secondary cards - grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WishlistsCard />
        <FavoritesCard />
        <EventsCard />
        <OrdersCard />
        <FriendsCard />
        <SettingsCard />
      </div>
    </div>
  );
};

export default DashboardGrid;
