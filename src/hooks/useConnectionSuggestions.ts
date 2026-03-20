import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Connection } from "@/types/connections";

const DISMISSED_KEY = 'dismissed_suggestions';

const getDismissedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

export const dismissSuggestion = (id: string) => {
  const dismissed = getDismissedIds();
  dismissed.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
};

export const useConnectionSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user interests
      const { data: profile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();

      const interests: string[] = Array.isArray(profile?.interests)
        ? (profile.interests as string[])
        : [];

      // Single RPC call — all scoring server-side
      const { data, error } = await supabase.rpc('get_suggested_connections', {
        requesting_user_id: user.id,
        user_interests: interests,
        suggestion_limit: 15,
      });

      if (error) throw error;

      const dismissed = getDismissedIds();

      const mapped: Connection[] = (data || [])
        .filter((row: any) => !dismissed.has(row.id))
        .map((row: any) => ({
          id: row.id,
          name: row.name || 'Unknown User',
          username: row.username || '@unknown',
          imageUrl: row.profile_image || '/placeholder.svg',
          mutualFriends: Number(row.mutual_count) || 0,
          type: 'suggestion' as const,
          lastActive: 'Recently',
          relationship: 'friend' as const,
          dataStatus: {
            shipping: 'missing' as const,
            birthday: 'missing' as const,
            email: 'missing' as const,
          },
          bio: row.bio || '',
          reason:
            row.mutual_count > 0
              ? `${row.mutual_count} mutual connection${row.mutual_count > 1 ? 's' : ''}`
              : row.common_interests > 0
              ? `${row.common_interests} shared interest${row.common_interests > 1 ? 's' : ''}`
              : 'New to the platform',
        }));

      setSuggestions(mapped);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSuggestions();
  }, [user]);

  return { suggestions, loading, refreshSuggestions: generateSuggestions };
};
