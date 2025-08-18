import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import ConnectionsHeader from "@/components/connections/ConnectionsHeader";
import FriendsTabContent from "@/components/connections/FriendsTabContent";
import SuggestionsTabContent from "@/components/connections/SuggestionsTabContent";
import PendingTabContent from "@/components/connections/PendingTabContent";
import ConnectionsErrorBoundary from "@/components/connections/ConnectionsErrorBoundary";
import PrivacyIntegration from "@/components/connections/PrivacyIntegration";
import { useState, useEffect } from "react";
import { RelationshipType, Connection } from "@/types/connections";
import { ConnectionFilters } from "@/types/connection-filters";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useRealtimeConnections } from "@/hooks/useRealtimeConnections";

const Connections = () => {
  const { user } = useAuth();
  const [userData] = useLocalStorage("userData", null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Check URL params for tab selection
  const searchParams = new URLSearchParams(window.location.search);
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab === 'pending' ? 'pending' : "friends");
  
  const [filters, setFilters] = useState<ConnectionFilters>({
    relationship: 'all',
    verificationStatus: 'all'
  });
  
  const {
    connections: enhancedConnections,
    pendingRequests,
    pendingInvitations,
    loading,
    error,
    fetchConnections,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection
  } = useEnhancedConnections();

  // Transform enhanced connections to match the expected interface
  const friends = enhancedConnections.filter(conn => conn.status === 'accepted').map(conn => {
    // Determine the target user ID (the user whose card we're displaying)
    const targetUserId = conn.user_id === user?.id ? conn.connected_user_id : conn.user_id;
    
    // Find the bidirectional permission record where target user granted permissions to current user
    const targetUserConnection = enhancedConnections.find(c => 
      c.user_id === targetUserId && c.connected_user_id === user?.id && c.status === 'accepted'
    );
    
    const permissions = targetUserConnection?.data_access_permissions || {};
    
    console.log('🔍 [Connections Page] Processing friend:', {
      connectionId: conn.id,
      targetUserId,
      permissions,
      name: conn.profile_name
    });
    
    return {
      id: conn.display_user_id || targetUserId || conn.id,
      connectionId: conn.id,
      name: conn.profile_name || conn.pending_recipient_name || 'Unknown',
      username: conn.profile_username || `@${conn.profile_name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
      imageUrl: conn.profile_image || '/placeholder.svg',
      mutualFriends: 0,
      type: 'friend' as const,
      lastActive: 'recently',
      relationship: conn.relationship_type as RelationshipType,
      dataStatus: {
        shipping: permissions?.shipping_address === false ? 'blocked' as const : 
                 permissions?.shipping_address === true ? 'verified' as const : 'missing' as const,
        birthday: permissions?.dob === false ? 'blocked' as const : 
                 permissions?.dob === true ? 'verified' as const : 'missing' as const,
        email: permissions?.email === false ? 'blocked' as const : 
               permissions?.email === true ? 'verified' as const : 'missing' as const
      },
      bio: conn.profile_bio || '',
      connectionDate: conn.created_at
    };
  });

  const suggestions: Connection[] = []; // Empty for now

  const pendingConnections = [...pendingRequests, ...pendingInvitations].map(conn => ({
    id: conn.display_user_id || (conn.user_id === user?.id ? conn.connected_user_id : conn.user_id) || conn.id,
    connectionId: conn.id,
    name: conn.profile_name || conn.pending_recipient_name || 'Unknown',
    username: conn.profile_username || `@${conn.profile_name?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
    imageUrl: conn.profile_image || '/placeholder.svg',
    mutualFriends: 0,
    type: 'friend' as const,
    lastActive: 'recently',
    relationship: conn.relationship_type as RelationshipType,
    dataStatus: {
      shipping: 'missing' as const,
      birthday: 'missing' as const,
      email: 'missing' as const
    },
    bio: conn.profile_bio || '',
    isPending: true,
    isIncoming: conn.connected_user_id === user?.id,
    connectionDate: conn.created_at
  }));

  // Adapter functions to match the expected interface
  const handleRelationshipChange = async (connectionId: string, newRelationship: RelationshipType) => {
    // This functionality would need to be added to enhanced connections
    toast.info('Relationship update feature coming soon');
  };

  const handleSendVerificationRequest = async (connectionId: string) => {
    toast.info('Verification request feature coming soon');
  };

  const filterConnections = (connections: Connection[], searchTerm: string) => {
    if (!searchTerm) return connections;
    const lowercaseSearch = searchTerm.toLowerCase();
    return connections.filter(conn => 
      conn.name.toLowerCase().includes(lowercaseSearch) ||
      conn.username.toLowerCase().includes(lowercaseSearch)
    );
  };

  const refreshPendingConnections = async () => {
    await fetchConnections();
  };

  const loadData = async () => {
    await fetchConnections();
  };

  // Set up real-time connection updates
  useRealtimeConnections(loadData);

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
