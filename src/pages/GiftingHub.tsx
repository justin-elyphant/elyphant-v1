import React from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import GiftingHubCard from "@/components/dashboard/GiftingHubCard";
import { EventsProvider } from "@/components/gifting/events/context/EventsContext";

const GiftingHub = () => {
  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4 pb-[140px] sm:pb-safe-bottom mobile-container ios-scroll">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Gifting
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your gift events, auto-gifting settings, and group projects
          </p>
        </div>
        
        <EventsProvider>
          <GiftingHubCard />
        </EventsProvider>
      </div>
    </SidebarLayout>
  );
};

export default GiftingHub;