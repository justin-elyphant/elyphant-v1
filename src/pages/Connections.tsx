
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import ConnectionsHeader from "@/components/connections/ConnectionsHeader";
import FriendsTabContent from "@/components/connections/FriendsTabContent";
import SuggestionsTabContent from "@/components/connections/SuggestionsTabContent";
import PendingTabContent from "@/components/connections/PendingTabContent";
import ConnectionsErrorBoundary from "@/components/connections/ConnectionsErrorBoundary";
import PrivacyIntegration from "@/components/connections/PrivacyIntegration";
import { useState, useEffect } from "react";
import { RelationshipType } from "@/types/connections";
import { ConnectionFilters } from "@/types/connection-filters";
import { useAuth } from "@/contexts/auth";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

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
    suggestions,
    pendingConnections,
    loading,
    error,
    handleRelationshipChange,
    handleSendVerificationRequest,
    filterConnections,
    refreshPendingConnections
  } = useConnectionsAdapter();

  // Apply search filtering
  const filteredFriends = filterConnections(friends, searchTerm);
  const filteredSuggestions = filterConnections(suggestions, searchTerm);
  const filteredPendingConnections = filterConnections(pendingConnections, searchTerm);

  // Log connection counts for debugging
  useEffect(() => {
    console.log('📊 [Connections] Current counts:', {
      friends: filteredFriends.length,
      pending: filteredPendingConnections.length,
      suggestions: filteredSuggestions.length
    });
  }, [filteredFriends.length, filteredPendingConnections.length, filteredSuggestions.length]);

  return (
    <SidebarLayout>
      <ConnectionsErrorBoundary>
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
            <TabsList className="w-full max-w-2xl">
              <TabsTrigger value="friends" className="flex-1">
                Friends ({filteredFriends.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">
                Pending ({filteredPendingConnections.length})
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
            
            <TabsContent value="pending" className="mt-6">
              <PendingTabContent 
                pendingConnections={filteredPendingConnections} 
                searchTerm={searchTerm}
                onRefresh={refreshPendingConnections}
              />
            </TabsContent>
            
            <TabsContent value="suggestions" className="mt-6">
              <SuggestionsTabContent suggestions={filteredSuggestions} />
            </TabsContent>
          </Tabs>
        </div>
      </ConnectionsErrorBoundary>
    </SidebarLayout>
  );
};

export default Connections;
