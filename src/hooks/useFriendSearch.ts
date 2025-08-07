import { useState, useCallback } from "react";
import { searchFriends, FriendSearchResult, sendConnectionRequest } from "@/services/search/friendSearchService";
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
    try {
      setIsLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      const found = await searchFriends(query, user?.id);
      setResults(found);
    } catch (e: any) {
      console.error("useFriendSearch.searchForFriends error", e);
      setError(e?.message || "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendFriendRequestWrapper = useCallback(async (targetUserId: string, targetName?: string) => {
    const { success, error } = await sendConnectionRequest(targetUserId);
    if (!success) {
      console.error("useFriendSearch.sendFriendRequest error", error);
      return false;
    }
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
