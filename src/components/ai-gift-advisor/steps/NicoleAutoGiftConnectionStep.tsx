import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, Calendar, Gift, Sparkles, ArrowRight, CheckCircle2, Users, Search, UserPlus, Mail } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useConnections } from "@/hooks/profile/useConnections";
import { useSimpleNicole } from "@/hooks/useSimpleNicole";
import { useFriendSearch } from "@/hooks/useFriendSearch";
import { toast } from "sonner";

type NicoleAutoGiftConnectionStepProps = ReturnType<typeof useGiftAdvisorBot>;

const NicoleAutoGiftConnectionStep = ({ 
  nextStep, 
  setBudget, 
  setOccasion, 
  botState,
  selectFriend 
}: NicoleAutoGiftConnectionStepProps) => {
  const { connections } = useConnections();
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { sendMessage } = useSimpleNicole();
  const { results: searchResults, isLoading: searchLoading, searchForFriends, sendFriendRequest } = useFriendSearch();

  // Enhanced connections with upcoming events and relationship data
  const enhancedConnections = connections.map(conn => {
    const hasWishlist = Math.random() > 0.6; // Mock wishlist data
    const upcomingEvents = [
      { type: 'birthday', date: 'March 15th', daysAway: 28 },
      { type: 'anniversary', date: 'June 10th', daysAway: 115 }
    ].filter(() => Math.random() > 0.7);

    return {
      ...conn,
      hasWishlist,
      upcomingEvents,
      relationshipStrength: conn.relationship_type === 'friend' ? 'close_friend' : conn.relationship_type,
      pastGiftSuccess: Math.random() > 0.4
    };
  });

  const handleConnectionSelect = async (connection: any) => {
    setSelectedConnection(connection);
    setLoadingSetup(true);

    try {
      // Step 1: Use optimal 2-question flow - Nicole intelligently pre-analyzes
      const analysisMessage = `Set up auto-gifting for ${connection.connected_user_id}`;
      
      const nicoleResponse = await sendMessage(analysisMessage);
      
      // Step 2: Auto-configure based on Nicole's analysis
      if (connection.upcomingEvents.length > 0) {
        const primaryEvent = connection.upcomingEvents[0];
        setOccasion(primaryEvent.type);
        
        // Step 3: Set relationship-adjusted budget
        const baseBudget = 75; // Default base budget
        const relationshipMultiplier = connection.relationshipStrength === 'close_friend' ? 1.1 : 
                                     connection.relationshipStrength === 'family' ? 1.2 : 1.0;
        const suggestedBudget = Math.round(baseBudget * relationshipMultiplier);
        
        setBudget({ min: Math.round(suggestedBudget * 0.7), max: suggestedBudget });
      }

      // Step 4: Set the friend and move to confirmation
      selectFriend(connection);
      
      setTimeout(() => {
        nextStep("auto-gift-confirmation");
      }, 1500);

    } catch (error) {
      console.error('Auto-gift setup error:', error);
      setLoadingSetup(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (query.length >= 2) {
      searchForFriends(query);
    }
  };

  const handleConnectAndSelect = async (friend: any) => {
    if (friend.connectionStatus === 'connected') {
      // Path A: Already connected, proceed with selection  
      toast.success(`Perfect! I found ${friend.name} in your connections.`);
      await selectFriend({
        id: friend.id,
        connected_user_id: friend.name,
        relationship_type: 'friend',
        name: friend.name,
        email: friend.email
      });
      setShowSearch(false);
      return;
    }

    if (friend.connectionStatus === 'none') {
      // Path A: Found user, quick connect with context
      toast.success(`Great! I found ${friend.name} on Elyphant. Sending them a connection request...`);
      const success = await sendFriendRequest(friend.id, friend.name);
      if (success) {
        await selectFriend({
          id: friend.id,
          connected_user_id: friend.name,
          relationship_type: 'friend',
          name: friend.name,
          email: friend.email,
          status: 'pending'
        });
        setShowSearch(false);
        toast.success(`Connection request sent! Once ${friend.name} accepts, auto-gifting will be ready.`);
      }
    }
  };

  const handleInviteNew = () => {
    // Path B: User not found, invitation flow
    const userName = searchTerm.includes('@') ? '' : searchTerm;
    const userEmail = searchTerm.includes('@') ? searchTerm : '';
    
    toast.success(`I don't see ${userName || userEmail} on Elyphant yet. Let's invite them to join!`);
    
    nextStep("invite-new-friend", {
      pendingFriendData: {
        name: userName,
        email: userEmail,
        relationship: 'friend'
      }
    });
  };

  if (loadingSetup) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold">Setting up auto-gifting...</h2>
          <p className="text-muted-foreground">
            Nicole is analyzing {selectedConnection?.connected_user_id}'s preferences and upcoming events
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span>Analyzing relationship context</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span>Detecting upcoming occasions</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Setting up smart defaults</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Hey! Who should I help you set up auto-gifting for?</h2>
        <p className="text-muted-foreground">
          I'll search for them and handle the rest - whether they're already connected or need an invitation to join!
        </p>
      </div>

      {/* Search Toggle */}
      {!showSearch && enhancedConnections.length > 0 && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSearch(true)}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            Search for someone else
          </Button>
        </div>
      )}

      {/* Search Interface */}
      {(showSearch || enhancedConnections.length === 0) && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Found Users</h3>
              {searchResults.map((friend) => (
                <Card 
                  key={friend.id} 
                  className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/20"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.profile_image} />
                          <AvatarFallback>
                            {friend.name?.substring(0, 2).toUpperCase() || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{friend.name}</h3>
                            <Badge 
                              variant={friend.connectionStatus === 'connected' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {friend.connectionStatus === 'connected' ? 'Connected' : 
                               friend.connectionStatus === 'pending' ? 'Request Sent' : 'Not Connected'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {friend.username || friend.email}
                          </p>
                        </div>
                      </div>
                      
                       <Button
                        onClick={() => handleConnectAndSelect(friend)}
                        size="sm"
                        variant={friend.connectionStatus === 'connected' ? 'default' : 'outline'}
                        className="gap-2"
                      >
                        {friend.connectionStatus === 'connected' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Choose Them
                          </>
                        ) : friend.connectionStatus === 'pending' ? (
                          <>
                            <Users className="w-4 h-4" />
                            Choose (Pending)
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Connect & Choose
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Path B: No Results - Invitation Flow */}
          {searchTerm.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium">I don't see "{searchTerm}" on Elyphant yet</h3>
                  <p className="text-sm text-muted-foreground">
                    No worries! I can invite them to join so you can set up auto-gifting together.
                  </p>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleInviteNew}
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite "{searchTerm}" to Elyphant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showSearch && enhancedConnections.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSearch(false)}
              className="w-full"
            >
              ← Back to your connections
            </Button>
          )}
        </div>
      )}

      {/* Existing Connections */}
      {!showSearch && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {enhancedConnections.map((connection) => (
          <Card 
            key={connection.id} 
            className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/20"
            onClick={() => handleConnectionSelect(connection)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {connection.connected_user_id.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">
                      {connection.connected_user_id}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {connection.relationshipStrength.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {connection.hasWishlist && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span>Has wishlist</span>
                      </div>
                    )}
                    
                    {connection.upcomingEvents.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        <span>{connection.upcomingEvents[0].type} in {connection.upcomingEvents[0].daysAway} days</span>
                      </div>
                    )}
                    
                    {connection.pastGiftSuccess && (
                      <div className="flex items-center gap-1">
                        <Gift className="w-3 h-3 text-green-500" />
                        <span>Gift history</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {connection.upcomingEvents.length > 1 && (
                <div className="mt-3 pt-3 border-t border-muted">
                  <p className="text-xs text-muted-foreground">
                    +{connection.upcomingEvents.length - 1} more upcoming event{connection.upcomingEvents.length > 2 ? 's' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {enhancedConnections.length === 0 && !showSearch && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No connections found</h3>
              <p className="text-sm text-muted-foreground">
                You can search for existing friends or invite someone new to join Elyphant
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSearch(true)}
                >
                  Search Friends
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => nextStep("invite-new-friend")}
                >
                  Invite Someone New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NicoleAutoGiftConnectionStep;