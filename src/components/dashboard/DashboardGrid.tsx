
import React from "react";
import FindGiftsCard from "./FindGiftsCard";
import WishlistsCard from "./WishlistsCard";
import EventsCard from "./EventsCard";
import OrdersCard from "./OrdersCard";
import FriendsCard from "./FriendsCard";
import SettingsCard from "./SettingsCard";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Full-width Find Gifts card */}
      <div className="w-full">
        <FindGiftsCard />
      </div>
      
      {/* Grid layout for the remaining cards */}
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
