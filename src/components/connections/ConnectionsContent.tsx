
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConnectionsHeader from "./ConnectionsHeader";
import FriendsTabContent from "./FriendsTabContent";
import FollowingTabContent from "./FollowingTabContent";
import SuggestionsTabContent from "./SuggestionsTabContent";
import ConnectionRequests from "./ConnectionRequests";

const ConnectionsContent = () => {
  const [activeTab, setActiveTab] = useState("friends");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ConnectionsHeader />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="mt-6">
          <FriendsTabContent />
        </TabsContent>
        
        <TabsContent value="following" className="mt-6">
          <FollowingTabContent />
        </TabsContent>
        
        <TabsContent value="suggestions" className="mt-6">
          <SuggestionsTabContent />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <ConnectionRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsContent;
