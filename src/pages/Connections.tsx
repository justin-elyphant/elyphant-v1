import React, { useState, useEffect, Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Users, UserPlus, Clock, AlertCircle } from "lucide-react";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileConnectionsPage } from "./MobileConnectionsPage";
import { toast } from "sonner";
import { Connection } from "@/types/connections";
import ConnectionDetailPanel from "@/components/connections/ConnectionDetailPanel";
import MobileConnectionDetail from "@/components/connections/MobileConnectionDetail";

// Lazy load heavy components
const FriendsTabContent = lazy(() => import("@/components/connections/FriendsTabContent"));
const SuggestionsTabContent = lazy(() => import("@/components/connections/SuggestionsTabContent"));
const PendingTabContent = lazy(() => import("@/components/connections/PendingTabContent"));
const ConnectionsHeader = lazy(() => import("@/components/connections/ConnectionsHeader"));
const PrivacyIntegration = lazy(() => import("@/components/connections/PrivacyIntegration"));

// Basic error boundary component
const ConnectionsErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
  <Card className="max-w-md mx-auto">
    <CardHeader className="text-center">
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <CardTitle className="text-red-900">Something went wrong</CardTitle>
    </CardHeader>
    <CardContent className="text-center space-y-4">
      <p className="text-muted-foreground">
        We encountered an error while loading your connections.
      </p>
      <Button onClick={resetError} className="w-full">
        Try Again
      </Button>
    </CardContent>
  </Card>
);

// Loading skeleton component
const ConnectionsLoading = () => (
  <div className="container max-w-4xl mx-auto py-8 px-4">
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

const Connections = () => {
  console.log('🚀 [Connections] Page component loaded!');
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  
  console.log('📱 [Connections] Mobile detection:', { 
    isMobile, 
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  });

  // Get connections data - MUST be called before any returns
  const { 
    friends,
    suggestions,
    pendingConnections, 
    loading: connectionsLoading,
    refreshPendingConnections,
    handleRelationshipChange: adapterHandleRelationshipChange
  } = useConnectionsAdapter();
  
  const safeFriends = Array.isArray(friends) ? friends : [];
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  const safePending = Array.isArray(pendingConnections) ? pendingConnections : [];
  
  // Check URL params for tab selection
  const searchParams = new URLSearchParams(window.location.search);
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab === 'pending' ? 'pending' : "friends");
  
  // Handle auto-accept from email link
  useEffect(() => {
    const acceptConnectionId = searchParams.get('accept');
    
    if (acceptConnectionId && user) {
      console.log('🔗 [Connections] Auto-accepting connection from email link:', acceptConnectionId);
      
      import('@/services/connections/connectionService')
        .then(({ acceptConnectionRequest }) => {
          return acceptConnectionRequest(acceptConnectionId);
        })
        .then(result => {
          if (result.success) {
            toast.success("Connection request accepted! Welcome to your network! 🎉");
            setActiveTab('friends');
            window.history.replaceState({}, '', '/connections');
            if (refreshPendingConnections) refreshPendingConnections();
          } else {
            toast.error("Unable to accept connection request. Please try manually.");
          }
        })
        .catch(err => {
          console.error('Error auto-accepting connection:', err);
          toast.error("Failed to accept connection. Please try from the Pending tab.");
        });
    }
  }, [user, searchParams, refreshPendingConnections]);
  
  const [filters, setFilters] = useState({
    relationship: 'all',
    verificationStatus: 'all'
  });

  // Handle relationship changes
  const handleRelationshipChange = async (connectionId: string, newRelationship: string, customValue?: string) => {
    console.log('🔄 [Connections] Updating relationship:', { connectionId, newRelationship, customValue });
    if (adapterHandleRelationshipChange) {
      await adapterHandleRelationshipChange(connectionId, newRelationship as any);
    }
  };

  // Handle auto-gift toggle
  const handleAutoGiftToggle = async (connectionId: string, enabled: boolean) => {
    console.log('🔄 [Connections] Toggling auto-gift:', { connectionId, enabled });
    // For now, just log - auto-gift functionality can be implemented later
    toast.success(`Auto-gift ${enabled ? 'enabled' : 'disabled'} for this connection`);
  };
  
  // Handle connection card click
  const handleConnectionClick = (connection: Connection) => {
    if (isMobile) {
      setSelectedConnection(connection);
      setShowMobileDetail(true);
    } else {
      setSelectedConnection(connection);
    }
  };

  // Check for mobile query parameter or device detection  
  const forceMobile = searchParams.get('mobile') === 'true';
  
  // Use mobile version when on mobile device or explicitly requested
  if (isMobile || forceMobile) {
    console.log('📱 [Connections] Rendering mobile version', { isMobile, forceMobile });
    
    // Show mobile detail view if connection is selected
    if (showMobileDetail && selectedConnection) {
      return (
        <MobileConnectionDetail
          connection={selectedConnection}
          onBack={() => {
            setShowMobileDetail(false);
            setSelectedConnection(null);
          }}
          onRelationshipChange={handleRelationshipChange}
          onAutoGiftToggle={handleAutoGiftToggle}
        />
      );
    }
    
    return <MobileConnectionsPage />;
  }
  
  console.log('🖥️ [Connections] Rendering desktop version');

  // Basic error boundary
  if (error) {
    return (
      <SidebarLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <ConnectionsErrorFallback 
            error={error} 
            resetError={() => setError(null)} 
          />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className={`container max-w-7xl mx-auto py-8 px-4 ${selectedConnection ? 'grid grid-cols-12 gap-6' : ''}`}>
        <div className={selectedConnection ? 'col-span-5' : 'w-full'}>
          <Suspense fallback={<ConnectionsLoading />}>
            <div className="space-y-6">
              {/* Basic header fallback */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="w-full sm:w-auto">
                  <h1 className="text-2xl font-bold mb-2">Connections</h1>
                  <p className="text-muted-foreground">
                    Manage your friends and connections
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Find Friends
                  </Button>
                </div>
              </div>

              {/* Privacy Settings Integration - Simplified */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Your privacy settings control who can connect with you</span>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Tabs */}
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="w-full max-w-2xl">
                  <TabsTrigger value="friends" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Friends
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1">
                    <Clock className="h-4 w-4 mr-2" />
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Suggestions
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="friends" className="mt-6">
                  <Suspense fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                      ))}
                    </div>
                  }>
                    <FriendsTabContent
                      friends={friends}
                      searchTerm={searchTerm}
                      onRelationshipChange={handleRelationshipChange}
                      onAutoGiftToggle={handleAutoGiftToggle}
                      onConnectionClick={handleConnectionClick}
                    />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="pending" className="mt-6">
                  <Suspense fallback={
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  }>
                    <PendingTabContent
                      pendingConnections={pendingConnections}
                      searchTerm={searchTerm}
                      onRefresh={refreshPendingConnections}
                    />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="suggestions" className="mt-6">
                  <Suspense fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                      ))}
                    </div>
                  }>
                    {suggestions.length > 0 ? (
                      <SuggestionsTabContent suggestions={suggestions} />
                    ) : (
                      <div className="text-center py-12">
                        <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Discover new connections</h3>
                        <p className="text-muted-foreground mb-4">
                          We'll suggest people you might know
                        </p>
                        <Button onClick={() => window.location.href = window.location.pathname}>
                          Explore Suggestions
                        </Button>
                      </div>
                    )}
                  </Suspense>
                </TabsContent>
              </Tabs>
            </div>
          </Suspense>
        </div>
        
        {/* Desktop Detail Panel */}
        {selectedConnection && (
          <div className="col-span-7">
            <ConnectionDetailPanel
              connection={selectedConnection}
              onClose={() => setSelectedConnection(null)}
              onRelationshipChange={handleRelationshipChange}
              onAutoGiftToggle={handleAutoGiftToggle}
            />
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Connections;