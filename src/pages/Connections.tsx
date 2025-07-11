import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import ConnectionsHeader from "@/components/connections/ConnectionsHeader";
import FriendsTabContent from "@/components/connections/FriendsTabContent";
import FollowingTabContent from "@/components/connections/FollowingTabContent";
import SuggestionsTabContent from "@/components/connections/SuggestionsTabContent";
import ConnectionsErrorBoundary from "@/components/connections/ConnectionsErrorBoundary";
import PrivacyIntegration from "@/components/connections/PrivacyIntegration";
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { RelationshipType } from "@/types/connections";
import { ConnectionFilters } from "@/types/connection-filters";
import { useAuth } from "@/contexts/auth";

const Connections = () => {
  const { user } = useAuth();
  const [userData] = useLocalStorage("userData", null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [filters, setFilters] = useState<ConnectionFilters>({
    relationship: 'all',
    verificationStatus: 'all'
  });
  
  const { 
    friends,
    following,
    suggestions,
    loading,
    error,
    handleRelationshipChange,
    handleSendVerificationRequest,
    filterConnections
  } = useConnectionsAdapter();

  // Apply search filtering
  const filteredFriends = filterConnections(friends, searchTerm);
  const filteredFollowing = filterConnections(following, searchTerm);
  const filteredSuggestions = filterConnections(suggestions, searchTerm);

  
  return (
    <ConnectionsErrorBoundary>
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <ConnectionsHeader 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            filters={filters}
            setFilters={setFilters}
          />

          {/* Privacy Settings Integration */}
          <div className="mb-6">
            <PrivacyIntegration showOwnSettings={true} />
          </div>

          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full max-w-md">
              <TabsTrigger value="friends" className="flex-1">
                Friends ({filteredFriends.length})
              </TabsTrigger>
              <TabsTrigger value="following" className="flex-1">
                Following ({filteredFollowing.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex-1">
                Suggestions ({filteredSuggestions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="friends" className="mt-6">
              <FriendsTabContent 
                friends={filteredFriends}
                searchTerm={searchTerm}
                onRelationshipChange={handleRelationshipChange}
                onVerificationRequest={handleSendVerificationRequest}
              />
            </TabsContent>
            
            <TabsContent value="following" className="mt-6">
              <FollowingTabContent 
                following={filteredFollowing}
                searchTerm={searchTerm}
              />
            </TabsContent>
            
            <TabsContent value="suggestions" className="mt-6">
              <SuggestionsTabContent suggestions={filteredSuggestions} />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ConnectionsErrorBoundary>
  );
};

export default Connections;
