
import React from "react";
import GiftingHubCard from "./GiftingHubCard";
import SocialHubCard from "./SocialHubCard";
import QuickGiftCTA from "./QuickGiftCTA";

import ProfileDataIntegrityPanel from "@/components/settings/ProfileDataIntegrityPanel";

const DashboardGrid = () => {
  return (
    <div className="space-y-6">
      {/* Profile Data Integrity Panel - Top Priority */}
      <ProfileDataIntegrityPanel />

      {/* Quick Gift Setup CTA */}
      <QuickGiftCTA />

      {/* Main Gifting Hub - takes full width and includes group features */}
      <div className="w-full">
        <GiftingHubCard />
      </div>

      {/* Secondary cards - social hub */}
      <div className="w-full">
        <SocialHubCard />
      </div>
    </div>
  );
};

export default DashboardGrid;
