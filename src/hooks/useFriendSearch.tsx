
import { useState } from "react";
import { searchFriends, sendConnectionRequest, FriendSearchResult } from "@/services/search/friendSearchService";
import { getConnectionPermissions } from "@/services/search/privacyAwareFriendSearch";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const useFriendSearch = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FriendSearchResult[]>([]);

  const searchForFriends = async (query: string) => {
    console.log('🔍 [useFriendSearch] Starting search for:', query);
    
    if (!query || query.length < 2) {
      console.log('🔍 [useFriendSearch] Query too short, clearing results');
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 [useFriendSearch] Calling searchFriends with userId:', user?.id);
      const friendResults = await searchFriends(query, user?.id);
      console.log('🔍 [useFriendSearch] Search results received:', friendResults.length);
      setResults(friendResults);
    } catch (error) {
      console.error('🔍 [useFriendSearch] Friend search error:', error);
      toast.error("Error searching for friends");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string, targetName: string) => {
    if (!user) {
      toast.error("You must be logged in to send friend requests");
      return false;
    }

    try {
      // Check connection permissions first
      const permissions = await getConnectionPermissions(targetUserId, user.id);
      
      if (!permissions.canSendRequest) {
        toast.error(permissions.restrictionReason || "Cannot send connection request");
        return false;
      }

      const result = await sendConnectionRequest(targetUserId, 'friend');
      
      if (result.success) {
        toast.success(`Friend request sent to ${targetName}`);
        
        // Update the local results to reflect the new status
        setResults(prev => prev.map(friend => 
          friend.id === targetUserId 
            ? { ...friend, connectionStatus: 'pending' }
            : friend
        ));
        
        return true;
      } else {
        toast.error("Failed to send friend request");
        return false;
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error("Error sending friend request");
      return false;
    }
  };

  return {
    results,
    isLoading,
    searchForFriends,
    sendFriendRequest
  };
};
