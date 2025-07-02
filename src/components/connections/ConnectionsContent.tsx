
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConnectionsHeader from "./ConnectionsHeader";
import FriendsTabContent from "./FriendsTabContent";
import FollowingTabContent from "./FollowingTabContent";
import SuggestionsTabContent from "./SuggestionsTabContent";
import ConnectionRequests from "./ConnectionRequests";
import { ConnectionFilters } from "@/hooks/useConnections";

const ConnectionsContent = () => {
  const [activeTab, setActiveTab] = useState("friends");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ConnectionFilters>({
    relationship: "all",
    verificationStatus: "all"
  });

  // Mock data - in a real app, these would come from your data source
  const friends: any[] = [];
  const following: any[] = [];
  const suggestions: any[] = [];
  const requests: any[] = [];

  const handleRelationshipChange = (connectionId: string, newRelationship: any, customValue?: string) => {
    console.log("Relationship change:", connectionId, newRelationship, customValue);
  };

  const handleVerificationRequest = (connectionId: string, dataType: any) => {
    console.log("Verification request:", connectionId, dataType);
  };

  const handleAcceptRequest = (requestId: string) => {
    console.log("Accept request:", requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    console.log("Reject request:", requestId);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ConnectionsHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="mt-6">
          <FriendsTabContent 
            friends={friends}
            searchTerm={searchTerm}
            onRelationshipChange={handleRelationshipChange}
            onVerificationRequest={handleVerificationRequest}
          />
        </TabsContent>
        
        <TabsContent value="following" className="mt-6">
          <FollowingTabContent 
            following={following}
            searchTerm={searchTerm}
          />
        </TabsContent>
        
        <TabsContent value="suggestions" className="mt-6">
          <SuggestionsTabContent suggestions={suggestions} />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-6">
          <ConnectionRequests 
            requests={requests}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsContent;
