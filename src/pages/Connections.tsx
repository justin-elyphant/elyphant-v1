import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Users, UserPlus, Clock, AlertCircle, Search } from "lucide-react";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Connection, RelationshipType } from "@/types/connections";
import ConnectionDetailPanel from "@/components/connections/ConnectionDetailPanel";
import MobileConnectionDetail from "@/components/connections/MobileConnectionDetail";
import ConnectionsHeroSection from "@/components/connections/ConnectionsHeroSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EnhancedConnectionSearch from "@/components/connections/EnhancedConnectionSearch";
import { AddConnectionSheet } from "@/components/connections/AddConnectionSheet";
import { AddConnectionFAB } from "@/components/connections/AddConnectionFAB";
import { MobileConnectionsHeader } from "@/components/connections/MobileConnectionsHeader";
import { OptimizedMobileConnectionCard } from "@/components/connections/OptimizedMobileConnectionCard";
import { MobilePullToRefresh } from "@/components/mobile/MobilePullToRefresh";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import MobileSwipeGestures from "@/components/mobile/MobileSwipeGestures";
import VoiceInputButton from "@/components/search/VoiceInputButton";
import SearchSuggestions from "@/components/search/SearchSuggestions";
import { triggerHapticFeedback } from "@/utils/haptics";
import "@/styles/connections-mobile.css";

// Lazy load heavy components
const FriendsTabContent = lazy(() => import("@/components/connections/FriendsTabContent"));
const SuggestionsTabContent = lazy(() => import("@/components/connections/SuggestionsTabContent"));
const PendingTabContent = lazy(() => import("@/components/connections/PendingTabContent"));
const ConnectionsHeader = lazy(() => import("@/components/connections/ConnectionsHeader"));
const PrivacyIntegration = lazy(() => import("@/components/connections/PrivacyIntegration"));

// Error fallback component
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

// Skeleton loading component
const ConnectionsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[...Array(count)].map((_, i) => (
      <Skeleton key={i} className="h-32 rounded-lg" />
    ))}
  </div>
);

const MobileConnectionsSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="connection-card-skeleton h-20 rounded-xl bg-muted animate-pulse" />
    ))}
  </div>
);

const Connections = () => {
  console.log('🚀 [Connections] Page component loaded!');
  const { user } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showFindFriendsDialog, setShowFindFriendsDialog] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [showRelationshipSheet, setShowRelationshipSheet] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get connections data
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

  // Handle relationship changes
  const handleRelationshipChange = async (connectionId: string, newRelationship: string, customValue?: string) => {
    console.log('🔄 [Connections] Updating relationship:', { connectionId, newRelationship, customValue });
    if (adapterHandleRelationshipChange) {
      await adapterHandleRelationshipChange(connectionId, newRelationship as RelationshipType);
    }
    triggerHapticFeedback('success');
  };

  // Handle auto-gift toggle
  const handleAutoGiftToggle = async (connectionId: string, enabled: boolean) => {
    console.log('🔄 [Connections] Toggling auto-gift:', { connectionId, enabled });
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

  // Mobile-specific handlers
  const handlePullToRefresh = useCallback(async () => {
    triggerHapticFeedback('light');
    await refreshPendingConnections();
  }, [refreshPendingConnections]);

  const handleSwipeLeft = useCallback((connectionId: string) => {
    triggerHapticFeedback('impact');
    console.log('Swipe left action for:', connectionId);
  }, []);

  const handleSwipeRight = useCallback((connectionId: string) => {
    triggerHapticFeedback('impact');
    console.log('Swipe right action for:', connectionId);
  }, []);

  const handleVoiceInput = useCallback(() => {
    setIsVoiceListening(!isVoiceListening);
    triggerHapticFeedback('selection');
  }, [isVoiceListening]);

  const openRelationshipSheet = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setShowRelationshipSheet(true);
    triggerHapticFeedback('light');
  }, []);

  const handleMobileRelationshipChange = useCallback((connectionId: string, relationship: RelationshipType) => {
    triggerHapticFeedback('success');
    setShowRelationshipSheet(false);
    setSelectedConnectionId(null);
    if (adapterHandleRelationshipChange) {
      adapterHandleRelationshipChange(connectionId, relationship);
    }
  }, [adapterHandleRelationshipChange]);

  // Search suggestions
  const searchSuggestions = React.useMemo(() => {
    if (!searchTerm) return [];
    const allConnections = [...safeFriends, ...safeSuggestions, ...safePending];
    return allConnections
      .filter(conn => conn?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(conn => conn.name)
      .slice(0, 5);
  }, [searchTerm, safeFriends, safeSuggestions, safePending]);

  // Filter connections by search term
  const filteredFriends = safeFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSuggestions = safeSuggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPending = safePending.filter(pending =>
    pending.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show mobile detail view if connection is selected on mobile
  if (isMobile && showMobileDetail && selectedConnection) {
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

  // Error state
  if (error) {
    return isMobile ? (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center p-4">
        <ConnectionsErrorFallback error={error} resetError={() => setError(null)} />
      </div>
    ) : (
      <SidebarLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <ConnectionsErrorFallback error={error} resetError={() => setError(null)} />
        </div>
      </SidebarLayout>
    );
  }

  // ========== MOBILE LAYOUT ==========
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <MobileConnectionsHeader />
        
        {/* Hero Section */}
        <div className="px-4 pt-4">
          <ConnectionsHeroSection
            friendsCount={safeFriends.length}
            pendingCount={safePending.length}
            onFindFriends={() => setShowFindFriendsDialog(true)}
            onInviteNew={() => setShowInviteSheet(true)}
            isMobile={true}
          />
        </div>
        
        {/* Search Bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(searchTerm.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="connections-search-input pl-10 pr-12 h-11"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <VoiceInputButton
                isListening={isVoiceListening}
                onVoiceInput={handleVoiceInput}
                mobile={true}
              />
            </div>
            <SearchSuggestions
              suggestions={searchSuggestions}
              isVisible={showSuggestions}
              onSuggestionClick={(suggestion) => {
                setSearchTerm(suggestion);
                setShowSuggestions(false);
                searchInputRef.current?.blur();
              }}
              mobile={true}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="connections-tabs">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-12 bg-transparent p-0">
              <TabsTrigger 
                value="friends" 
                className="connections-tab-button"
                onClick={() => triggerHapticFeedback('selection')}
              >
                <Users className="h-4 w-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="connections-tab-button"
                onClick={() => triggerHapticFeedback('selection')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="suggestions"
                className="connections-tab-button"
                onClick={() => triggerHapticFeedback('selection')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Suggestions
              </TabsTrigger>
            </TabsList>

            <MobilePullToRefresh onRefresh={handlePullToRefresh}>
              <MobileSwipeGestures enableQuickActions={true}>
                <TabsContent value="friends" className="mt-0 px-4 py-4 space-y-3">
                  {connectionsLoading ? (
                    <MobileConnectionsSkeleton />
                  ) : filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => (
                      <OptimizedMobileConnectionCard
                        key={friend.id}
                        connection={friend}
                        onSwipeLeft={() => handleSwipeLeft(friend.id)}
                        onSwipeRight={() => handleSwipeRight(friend.id)}
                        onRelationshipEdit={() => openRelationshipSheet(friend.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No friends found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm ? `No results for "${searchTerm}"` : "You haven't added any friends yet"}
                      </p>
                      <div className="space-y-2">
                        <Button onClick={() => setActiveTab("suggestions")}>Browse Suggestions</Button>
                        <Button variant="outline" onClick={() => setShowInviteSheet(true)}>Add Connection</Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="mt-0 px-4 py-4 space-y-3">
                  {connectionsLoading ? (
                    <MobileConnectionsSkeleton count={2} />
                  ) : filteredPending.length > 0 ? (
                    filteredPending.map((pending) => (
                      <OptimizedMobileConnectionCard
                        key={pending.id}
                        connection={pending}
                        onSwipeLeft={() => handleSwipeLeft(pending.id)}
                        onSwipeRight={() => handleSwipeRight(pending.id)}
                        isPending={true}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                      <p className="text-muted-foreground">All caught up!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="suggestions" className="mt-0 px-4 py-4 space-y-3">
                  {connectionsLoading ? (
                    <MobileConnectionsSkeleton count={4} />
                  ) : filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((suggestion) => (
                      <OptimizedMobileConnectionCard
                        key={suggestion.id}
                        connection={suggestion}
                        onSwipeLeft={() => handleSwipeLeft(suggestion.id)}
                        onSwipeRight={() => handleSwipeRight(suggestion.id)}
                        isSuggestion={true}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No suggestions found</h3>
                      <p className="text-muted-foreground mb-4">Check back later for new suggestions</p>
                      <Button variant="outline" onClick={() => setShowInviteSheet(true)}>Add Connection</Button>
                    </div>
                  )}
                </TabsContent>
              </MobileSwipeGestures>
            </MobilePullToRefresh>
          </Tabs>
        </div>

        {/* Relationship Selection Bottom Sheet */}
        <MobileBottomSheet
          isOpen={showRelationshipSheet}
          onClose={() => {
            setShowRelationshipSheet(false);
            setSelectedConnectionId(null);
          }}
          title="Change Relationship"
        >
          <div className="space-y-3 p-4">
            {(['friend', 'spouse', 'cousin', 'child', 'parent', 'sibling', 'colleague'] as RelationshipType[]).map((relationship) => (
              <Button
                key={relationship}
                variant="ghost"
                className="w-full justify-start h-12 text-left"
                onClick={() => selectedConnectionId && handleMobileRelationshipChange(selectedConnectionId, relationship)}
              >
                {relationship.charAt(0).toUpperCase() + relationship.slice(1)}
              </Button>
            ))}
          </div>
        </MobileBottomSheet>

        {/* FAB */}
        <AddConnectionFAB onClick={() => setShowInviteSheet(true)} />

        {/* Add Connection Sheet */}
        <AddConnectionSheet
          isOpen={showInviteSheet}
          onClose={() => setShowInviteSheet(false)}
          onConnectionAdded={() => {
            refreshPendingConnections();
            triggerHapticFeedback('success');
          }}
        />

        {/* Find Friends Dialog */}
        <Dialog open={showFindFriendsDialog} onOpenChange={setShowFindFriendsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Find New Connections</DialogTitle>
            </DialogHeader>
            <EnhancedConnectionSearch />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ========== DESKTOP LAYOUT ==========
  return (
    <SidebarLayout>
      <div className={`container max-w-7xl mx-auto py-8 px-4 ${selectedConnection ? 'grid grid-cols-12 gap-6' : ''}`}>
        <div className={selectedConnection ? 'col-span-5' : 'w-full'}>
          <Suspense fallback={<ConnectionsSkeleton />}>
            <div className="space-y-6">
              {/* Hero Section */}
              <ConnectionsHeroSection
                friendsCount={safeFriends.length}
                pendingCount={safePending.length}
                userName={profile?.name?.split(' ')[0]}
                onFindFriends={() => setShowFindFriendsDialog(true)}
                onInviteNew={() => setShowInviteSheet(true)}
              />

              {/* Tabs */}
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
                  <Suspense fallback={<ConnectionsSkeleton />}>
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
                  <Suspense fallback={<ConnectionsSkeleton count={3} />}>
                    <PendingTabContent
                      pendingConnections={pendingConnections}
                      searchTerm={searchTerm}
                      onRefresh={refreshPendingConnections}
                    />
                  </Suspense>
                </TabsContent>
                
                <TabsContent value="suggestions" className="mt-6">
                  <Suspense fallback={<ConnectionsSkeleton count={6} />}>
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

      {/* Find Friends Dialog */}
      <Dialog open={showFindFriendsDialog} onOpenChange={setShowFindFriendsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Find New Connections</DialogTitle>
          </DialogHeader>
          <EnhancedConnectionSearch />
        </DialogContent>
      </Dialog>

      {/* Invite New Connection Sheet */}
      <AddConnectionSheet
        isOpen={showInviteSheet}
        onClose={() => setShowInviteSheet(false)}
        onConnectionAdded={() => {
          toast.success("Invitation sent!");
        }}
      />
    </SidebarLayout>
  );
};

export default Connections;
