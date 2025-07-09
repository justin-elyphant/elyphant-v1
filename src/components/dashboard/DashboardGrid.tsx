
import React from "react";
import GiftingHubCard from "./GiftingHubCard";
import FriendsCard from "./FriendsCard";
import SettingsCard from "./SettingsCard";
import MessagesCard from "./MessagesCard";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Main Gifting Hub - takes full width */}
      <div className="w-full">
        <GiftingHubCard />
      </div>

      {/* Secondary cards - connections, messages, settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex flex-col h-full">
          <FriendsCard />
        </div>
        <div className="flex flex-col h-full">
          <MessagesCard />
        </div>
        <div className="flex flex-col h-full">
          <SettingsCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;
