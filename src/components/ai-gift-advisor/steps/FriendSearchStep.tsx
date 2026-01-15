import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { searchFriends, FriendSearchResult } from "@/services/search/privacyAwareFriendSearch";
import { sendConnectionRequest } from "@/services/connections/connectionService";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type FriendSearchStepProps = ReturnType<typeof useGiftAdvisorBot>;

const FriendSearchStep = ({ 
  nextStep, 
  selectFriend,
  botState 
}: FriendSearchStepProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const friendResults = await searchFriends(query, user?.id);
      setResults(friendResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Error searching for users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    const debounceTimer = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  };

  const handleConnectAndSelect = async (friend: FriendSearchResult) => {
    if (friend.connectionStatus === 'connected') {
      // Already connected, proceed with selection
      await selectFriend({
        id: friend.id,
        connected_user_id: friend.name,
        relationship_type: 'friend',
        name: friend.name,
        email: friend.email
      });
      return;
    }

    if (friend.connectionStatus === 'none') {
      // Send connection request and then select
      try {
        const result = await sendConnectionRequest(friend.id, 'friend');
        
        if (result.success) {
          toast.success(`Connection request sent! Setting up auto-gifting for ${friend.name}`);
          
          // Proceed with friend selection even though connection is pending
          await selectFriend({
            id: friend.id,
            connected_user_id: friend.name,
            relationship_type: 'friend',
            name: friend.name,
            email: friend.email,
            status: 'pending'
          });
        } else {
          toast.error("Failed to send connection request");
        }
      } catch (error) {
        console.error('Error sending connection request:', error);
        toast.error("Failed to send connection request");
      }
    }
  };

  const handleInviteNew = (friend: FriendSearchResult) => {
    // If user not found in platform, offer to invite them
    nextStep("invite-new-friend", {
      pendingFriendData: {
        name: friend.name,
        email: friend.email || searchTerm, // Use search term as email if available
        relationship: 'friend'
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => nextStep("nicole-auto-gift-connection")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Search for Friends</h2>
          <p className="text-muted-foreground">
            Find existing friends or discover someone new to set up auto-gifting
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Search Results</h3>
          {results.map((friend) => (
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
                      
                      {friend.bio && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleConnectAndSelect(friend)}
                    size="sm"
                    variant={friend.connectionStatus === 'connected' ? 'default' : 'outline'}
                  >
                    {friend.connectionStatus === 'connected' ? 'Select' : 
                     friend.connectionStatus === 'pending' ? 'Select (Pending)' : 'Connect & Select'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && !loading && results.length === 0 && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No users found for "{searchTerm}"</h3>
              <p className="text-sm text-muted-foreground">
                They might not be on Elyphant yet. Would you like to invite them?
              </p>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => nextStep("invite-new-friend", {
                  pendingFriendData: {
                    name: searchTerm.includes('@') ? '' : searchTerm,
                    email: searchTerm.includes('@') ? searchTerm : '',
                    relationship: 'friend'
                  }
                })}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite "{searchTerm}" to Elyphant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm.length < 2 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Start typing to search for friends...</p>
        </div>
      )}
    </div>
  );
};

export default FriendSearchStep;