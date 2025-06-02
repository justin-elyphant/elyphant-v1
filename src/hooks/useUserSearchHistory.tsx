
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

const RECENT_SEARCHES_KEY = "recent_marketplace_searches";
const MAX_RECENT = 5;

interface SearchHistoryItem {
  id: string;
  search_term: string;
  search_type: string;
  created_at: string;
}

// Common system-generated search terms that should be filtered out
const SYSTEM_GENERATED_TERMS = [
  "fathers day gifts",
  "fathers day gift",
  "mothers day gifts", 
  "mothers day gift",
  "valentine day gifts",
  "christmas gifts",
  "holiday gifts",
  "graduation gifts",
  "easter gifts",
  "thanksgiving gifts",
  "hanukkah gifts"
];

export function useUserSearchHistory() {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper function to check if a search term is system-generated
  const isSystemGenerated = (term: string): boolean => {
    const normalizedTerm = term.toLowerCase().trim();
    return SYSTEM_GENERATED_TERMS.some(systemTerm => 
      normalizedTerm.includes(systemTerm) || systemTerm.includes(normalizedTerm)
    );
  };

  // Filter out system-generated terms from search results
  const filterSystemSearches = (searches: string[]): string[] => {
    return searches.filter(search => !isSystemGenerated(search));
  };

  // Load search history based on authentication status
  const loadSearchHistory = useCallback(async () => {
    if (!user) {
      // For anonymous users, use localStorage
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const searches = stored ? JSON.parse(stored) : [];
      setRecentSearches(filterSystemSearches(searches));
      return;
    }

    // For authenticated users, load from database
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_search_history')
        .select('search_term, created_at')
        .eq('user_id', user.id)
        .eq('search_type', 'marketplace')
        .order('created_at', { ascending: false })
        .limit(MAX_RECENT * 2); // Get more to account for filtering

      if (error) {
        console.error('Error loading search history:', error);
        return;
      }

      const searches = data?.map(item => item.search_term) || [];
      const filteredSearches = filterSystemSearches(searches).slice(0, MAX_RECENT);
      setRecentSearches(filteredSearches);
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new search term with option to mark as system-generated
  const addSearch = useCallback(async (term: string, isSystemSearch: boolean = false) => {
    if (!term.trim()) return;

    // Don't add system-generated searches to recent searches
    if (isSystemSearch || isSystemGenerated(term)) {
      console.log(`Skipping system-generated search: "${term}"`);
      return;
    }

    if (!user) {
      // For anonymous users, use localStorage
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const recent = stored ? JSON.parse(stored) : [];
      const filtered = recent.filter((s: string) => s !== term);
      const updated = [term, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(filterSystemSearches(updated));
      return;
    }

    // For authenticated users, save to database
    try {
      // First, check if this search term already exists for this user
      const { data: existing } = await supabase
        .from('user_search_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('search_term', term.trim())
        .eq('search_type', 'marketplace')
        .single();

      if (existing) {
        // Update the timestamp of existing search
        await supabase
          .from('user_search_history')
          .update({ created_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new search term
        await supabase
          .from('user_search_history')
          .insert({
            user_id: user.id,
            search_term: term.trim(),
            search_type: 'marketplace'
          });
      }

      // Reload the search history to reflect changes
      await loadSearchHistory();
    } catch (error) {
      console.error('Error saving search term:', error);
    }
  }, [user, loadSearchHistory]);

  // Clear all search history
  const clearSearchHistory = useCallback(async () => {
    if (!user) {
      // For anonymous users, clear localStorage
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
      return;
    }

    // For authenticated users, clear database entries
    try {
      await supabase
        .from('user_search_history')
        .delete()
        .eq('user_id', user.id)
        .eq('search_type', 'marketplace');

      setRecentSearches([]);
      toast.success("Search history cleared");
    } catch (error) {
      console.error('Error clearing search history:', error);
      toast.error("Failed to clear search history");
    }
  }, [user]);

  // Migrate localStorage searches to user account on login
  const migrateLocalStorageSearches = useCallback(async () => {
    if (!user) return;

    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return;

    try {
      const localSearches = JSON.parse(stored);
      if (!Array.isArray(localSearches) || localSearches.length === 0) return;

      // Filter out system-generated searches before migration
      const validSearches = filterSystemSearches(localSearches);

      // Insert valid local searches into database (in reverse order to maintain chronology)
      for (const term of validSearches.reverse()) {
        await supabase
          .from('user_search_history')
          .insert({
            user_id: user.id,
            search_term: term,
            search_type: 'marketplace'
          });
      }

      // Clear localStorage after migration
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      console.log('Migrated localStorage searches to user account');
    } catch (error) {
      console.error('Error migrating localStorage searches:', error);
    }
  }, [user]);

  // Load search history when component mounts or user changes
  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Migrate localStorage searches when user logs in
  useEffect(() => {
    if (user) {
      migrateLocalStorageSearches().then(() => {
        loadSearchHistory();
      });
    }
  }, [user, migrateLocalStorageSearches, loadSearchHistory]);

  return {
    recentSearches,
    loading,
    addSearch,
    clearSearchHistory,
    refreshSearchHistory: loadSearchHistory
  };
}
