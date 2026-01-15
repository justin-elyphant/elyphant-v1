import { useState, useCallback } from "react";
import { searchFriends, FriendSearchResult } from "@/services/search/privacyAwareFriendSearch";
import { sendConnectionRequest } from "@/services/connections/connectionService";
import { supabase } from "@/integrations/supabase/client";

interface UseFriendSearchResult {
  results: FriendSearchResult[];
  isLoading: boolean;
  error: string | null;
  searchForFriends: (query: string) => Promise<void>;
  sendFriendRequest: (targetUserId: string, targetName?: string) => Promise<boolean>;
  clear: () => void;
}

export const useFriendSearch = (): UseFriendSearchResult => {
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchForFriends = useCallback(async (query: string) => {
    console.log('🔍 [useFriendSearch.ts] Starting search for:', query);
    
    try {
      setIsLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 [useFriendSearch.ts] Current user ID:', user?.id);
      
      const found = await searchFriends(query, user?.id);
      console.log('🔍 [useFriendSearch.ts] Search results:', found);
      setResults(found);
    } catch (e: any) {
      console.error("🔍 [useFriendSearch.ts] searchForFriends error", e);
      setError(e?.message || "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendFriendRequestWrapper = useCallback(async (targetUserId: string, targetName?: string) => {
    console.log('🔍 [useFriendSearch] Sending friend request to:', { targetUserId, targetName });
    
    const { success, error } = await sendConnectionRequest(targetUserId);
    
    if (!success) {
      console.error('🔍 [useFriendSearch] sendFriendRequest failed:', error);
      setError(error?.message || 'Failed to send connection request');
      return false;
    }
    
    console.log('🔍 [useFriendSearch] Friend request sent successfully');
    
    // Optimistically update result status
    setResults(prev => prev.map(r => r.id === targetUserId ? { ...r, connectionStatus: 'pending' } : r));
    return true;
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isLoading, error, searchForFriends, sendFriendRequest: sendFriendRequestWrapper, clear };
};
