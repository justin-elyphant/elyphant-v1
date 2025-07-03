
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import ConnectionsHeader from "@/components/connections/ConnectionsHeader";
import FriendsTabContent from "@/components/connections/FriendsTabContent";
import FollowingTabContent from "@/components/connections/FollowingTabContent";
import SuggestionsTabContent from "@/components/connections/SuggestionsTabContent";
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { RelationshipType } from "@/types/connections";

const Connections = () => {
  const [userData] = useLocalStorage("userData", null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [filters, setFilters] = useState({
    relationship: 'all' as RelationshipType | 'all',
    verificationStatus: 'all' as 'verified' | 'incomplete' | 'all'
  });
  
  const { 
    friends,
    following,
    suggestions,
    loading,
    error,
    handleRelationshipChange,
    handleSendVerificationRequest
  } = useConnectionsAdapter();
  
  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <ConnectionsHeader 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
        />
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
            <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
            <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="mt-6">
            <FriendsTabContent 
              friends={friends}
              searchTerm={searchTerm}
              onRelationshipChange={handleRelationshipChange}
              onVerificationRequest={handleSendVerificationRequest}
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
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Connections;
