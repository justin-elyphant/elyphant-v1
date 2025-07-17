
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Connection } from "@/types/connections";
import { useMutualConnections } from "./useMutualConnections";

export const useConnectionSuggestions = () => {
  const { user } = useAuth();
  const { calculateMutualFriends } = useMutualConnections();
  const [suggestions, setSuggestions] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get users who are not already connected
      const { data: existingConnections } = await supabase
        .from('user_connections')
        .select('connected_user_id, user_id')
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

      const connectedUserIds = new Set(
        existingConnections?.map(conn => 
          conn.user_id === user.id ? conn.connected_user_id : conn.user_id
        ) || []
      );
      connectedUserIds.add(user.id); // Don't suggest self

      // Get current user's profile for interest matching
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', user.id)
        .single();

      const userInterests = currentUserProfile?.interests || [];

      // Get all profiles excluding connected users
      const connectedUserIdsArray = Array.from(connectedUserIds);
      let profilesQuery = supabase
        .from('profiles')
        .select('id, name, username, profile_image, bio, interests');
      
      // Only add the filter if there are connected users to exclude
      if (connectedUserIdsArray.length > 0) {
        profilesQuery = profilesQuery.not('id', 'in', `(${connectedUserIdsArray.join(',')})`);
      }
      
      const { data: profiles, error } = await profilesQuery;

      if (error) throw error;

      // Score and rank suggestions
      const scoredSuggestions = await Promise.all(
        (profiles || []).map(async (profile) => {
          const mutualFriends = await calculateMutualFriends(profile.id);
          
          // Calculate interest similarity
          const profileInterests = profile.interests || [];
          const commonInterests = userInterests.filter(interest => 
            profileInterests.includes(interest)
          );
          
          // Scoring algorithm
          let score = 0;
          score += mutualFriends * 10; // High weight for mutual connections
          score += commonInterests.length * 5; // Medium weight for common interests
          score += profile.bio ? 2 : 0; // Small bonus for complete profiles
          score += profile.profile_image ? 1 : 0; // Small bonus for profile image

          const connection: Connection = {
            id: profile.id,
            name: profile.name || 'Unknown User',
            username: profile.username || '@unknown',
            imageUrl: profile.profile_image || '/placeholder.svg',
            mutualFriends,
            type: 'suggestion' as const,
            lastActive: 'Recently',
            relationship: 'friend' as const,
            dataStatus: {
              shipping: 'missing' as const,
              birthday: 'missing' as const,
              email: 'missing' as const
            },
            interests: profileInterests,
            bio: profile.bio || '',
            reason: mutualFriends > 0 
              ? `${mutualFriends} mutual connection${mutualFriends > 1 ? 's' : ''}`
              : commonInterests.length > 0
              ? `Shares ${commonInterests.length} interest${commonInterests.length > 1 ? 's' : ''}`
              : 'New to the platform',
            score
          };

          return connection;
        })
      );

      // Sort by score and take top 10
      const topSuggestions = scoredSuggestions
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10);

      setSuggestions(topSuggestions);
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
