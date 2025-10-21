import React, { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Clock, Search, ArrowLeft } from "lucide-react";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback } from "@/utils/haptics";
import MobileSwipeGestures from "@/components/mobile/MobileSwipeGestures";
import VoiceInputButton from "@/components/search/VoiceInputButton";
import SearchSuggestions from "@/components/search/SearchSuggestions";
import { OptimizedMobileConnectionCard } from "@/components/connections/OptimizedMobileConnectionCard";
import { MobileConnectionsHeader } from "@/components/connections/MobileConnectionsHeader";
import { MobilePullToRefresh } from "@/components/mobile/MobilePullToRefresh";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { AddConnectionFAB } from "@/components/connections/AddConnectionFAB";
import { AddConnectionSheet } from "@/components/connections/AddConnectionSheet";
import { RelationshipType } from "@/types/connections";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import "@/styles/connections-mobile.css";

export const MobileConnectionsPage = () => {
  console.log('📱 [MobileConnectionsPage] Component loaded!');
  
  // Add error boundary try-catch
  try {
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("friends");
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [showRelationshipSheet, setShowRelationshipSheet] = useState(false);
    const [showAddConnectionSheet, setShowAddConnectionSheet] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    console.log('📱 [MobileConnectionsPage] State initialized:', { activeTab, searchTerm });
    
    // Handle auto-accept from email link
    React.useEffect(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const acceptConnectionId = searchParams.get('accept');
      
      if (acceptConnectionId && user) {
        console.log('🔗 [MobileConnectionsPage] Auto-accepting connection from email link:', acceptConnectionId);
        
        import('@/services/connections/connectionService')
          .then(({ acceptConnectionRequest }) => {
            return acceptConnectionRequest(acceptConnectionId);
          })
          .then(result => {
            if (result.success) {
              toast.success("Connection accepted! 🎉");
              setActiveTab('friends');
              window.history.replaceState({}, '', '/connections');
              if (refreshPendingConnections) refreshPendingConnections();
            } else {
              toast.error("Unable to accept connection. Please try manually.");
            }
          })
          .catch(err => {
            console.error('Error auto-accepting connection:', err);
            toast.error("Failed to accept connection.");
          });
      }
    }, [user]);
  
  const {
    friends,
    suggestions,
    pendingConnections,
    loading,
    refreshPendingConnections,
    handleRelationshipChange: adapterHandleRelationshipChange
  } = useConnectionsAdapter();
  
  const safeFriends = Array.isArray(friends) ? friends : [];
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  const safePending = Array.isArray(pendingConnections) ? pendingConnections : [];
  
  console.log('📱 [MobileConnectionsPage] Data loaded:', { 
    friendsCount: safeFriends.length, 
    suggestionsCount: safeSuggestions.length, 
    pendingCount: safePending.length,
    loading 
  });

  // Search suggestions based on connection names
  const searchSuggestions = React.useMemo(() => {
    if (!searchTerm) return [];
    const allConnections = [...safeFriends, ...safeSuggestions, ...safePending];
    return allConnections
      .filter(conn => conn?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(conn => conn.name)
      .slice(0, 5);
  }, [searchTerm, safeFriends, safeSuggestions, safePending]);

  const handlePullToRefresh = useCallback(async () => {
    triggerHapticFeedback('light');
    await refreshPendingConnections();
  }, [refreshPendingConnections]);

  const handleSwipeLeft = useCallback((connectionId: string) => {
    triggerHapticFeedback('impact');
    // Quick action - could be message or remove
    console.log('Swipe left action for:', connectionId);
  }, []);

  const handleSwipeRight = useCallback((connectionId: string) => {
    triggerHapticFeedback('impact');
    // Quick action - could be gift or connect
    console.log('Swipe right action for:', connectionId);
  }, []);

  const handleVoiceInput = useCallback(() => {
    setIsVoiceListening(!isVoiceListening);
    triggerHapticFeedback('selection');
    // Voice input implementation would go here
  }, [isVoiceListening]);

  const handleRelationshipChange = useCallback((connectionId: string, relationship: RelationshipType) => {
    triggerHapticFeedback('success');
    setShowRelationshipSheet(false);
    setSelectedConnectionId(null);
    if (adapterHandleRelationshipChange) {
      adapterHandleRelationshipChange(connectionId, relationship);
    }
  }, [adapterHandleRelationshipChange]);

  const openRelationshipSheet = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setShowRelationshipSheet(true);
    triggerHapticFeedback('light');
  }, []);

  const filteredFriends = safeFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuggestions = safeSuggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPending = safePending.filter(pending =>
    pending.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Mobile Header */}
      <MobileConnectionsHeader />
      
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

      {/* Tabs Navigation */}
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

          {/* Pull to Refresh Wrapper */}
          <MobilePullToRefresh onRefresh={handlePullToRefresh}>
            <MobileSwipeGestures enableQuickActions={true}>
              <TabsContent value="friends" className="mt-0 px-4 py-4 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="connection-card-skeleton h-20 rounded-xl" />
                    ))}
                  </div>
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
                      <Button onClick={() => setActiveTab("suggestions")}>
                        Browse Suggestions
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddConnectionSheet(true)}>
                        Add Connection
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-0 px-4 py-4 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="connection-card-skeleton h-20 rounded-xl" />
                    ))}
                  </div>
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
                    <p className="text-muted-foreground">
                      {searchTerm ? `No results for "${searchTerm}"` : "All caught up!"}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suggestions" className="mt-0 px-4 py-4 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="connection-card-skeleton h-20 rounded-xl" />
                    ))}
                  </div>
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
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? `No results for "${searchTerm}"` : "Check back later for new suggestions"}
                    </p>
                    <Button variant="outline" onClick={() => setShowAddConnectionSheet(true)}>
                      Add Connection
                    </Button>
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
              onClick={() => selectedConnectionId && handleRelationshipChange(selectedConnectionId, relationship)}
            >
              {relationship.charAt(0).toUpperCase() + relationship.slice(1)}
            </Button>
          ))}
        </div>
      </MobileBottomSheet>

      {/* Add Connection FAB */}
      <AddConnectionFAB onClick={() => setShowAddConnectionSheet(true)} />

      {/* Add Connection Bottom Sheet */}
      <AddConnectionSheet
        isOpen={showAddConnectionSheet}
        onClose={() => setShowAddConnectionSheet(false)}
        onConnectionAdded={() => {
          refreshPendingConnections();
          triggerHapticFeedback('success');
        }}
      />
    </div>
  );
  } catch (error) {
    console.error('📱 [MobileConnectionsPage] Error:', error);
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            An error occurred while loading the mobile connections page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
};