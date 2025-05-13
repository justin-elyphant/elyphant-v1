
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledGift } from "@/types/gift-scheduling";
import ScheduledGiftsList from "./ScheduledGiftsList";

interface GiftSchedulingTabsProps {
  upcomingGifts: ScheduledGift[];
  pastGifts: ScheduledGift[];
  selectedTab: string;
  setSelectedTab: (value: string) => void;
}

const GiftSchedulingTabs: React.FC<GiftSchedulingTabsProps> = ({
  upcomingGifts,
  pastGifts,
  selectedTab,
  setSelectedTab
}) => {
  return (
    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="upcoming">
          Upcoming ({upcomingGifts.length})
        </TabsTrigger>
        <TabsTrigger value="history">
          History ({pastGifts.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upcoming">
        <ScheduledGiftsList gifts={upcomingGifts} type="upcoming" />
      </TabsContent>
      
      <TabsContent value="history">
        <ScheduledGiftsList gifts={pastGifts} type="history" />
      </TabsContent>
    </Tabs>
  );
};

export default GiftSchedulingTabs;
