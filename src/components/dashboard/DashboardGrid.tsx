
import React from "react";
import GiftingHubCard from "./GiftingHubCard";
import SocialHubCard from "./SocialHubCard";
import SettingsCard from "./SettingsCard";
import ProfileDataIntegrityPanel from "@/components/settings/ProfileDataIntegrityPanel";
import ActiveGroupProjectsWidget from "./ActiveGroupProjectsWidget";
import GroupGiftAnalytics from "./GroupGiftAnalytics";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Profile Data Integrity Panel - Top Priority */}
      <ProfileDataIntegrityPanel />

      {/* Main Gifting Hub - takes full width */}
      <div className="w-full">
        <GiftingHubCard />
      </div>

      {/* Group Projects and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveGroupProjectsWidget />
        <GroupGiftAnalytics />
      </div>

      {/* Secondary cards - social hub and settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col h-full">
          <SocialHubCard />
        </div>
        <div className="flex flex-col h-full">
          <SettingsCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;
