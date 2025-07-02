
import React, { useState } from "react";
import GiftSchedulingTabs from "./GiftSchedulingTabs";

const GiftSchedulingContent = () => {
  const [selectedTab, setSelectedTab] = useState("upcoming");
  
  // Mock data - in a real app, these would come from your data source
  const upcomingGifts = [];
  const pastGifts = [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gift Scheduling</h1>
        <p className="text-gray-600 mt-2">
          Plan and schedule your gifts in advance
        </p>
      </div>
      
      <GiftSchedulingTabs 
        upcomingGifts={upcomingGifts}
        pastGifts={pastGifts}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
    </div>
  );
};

export default GiftSchedulingContent;
