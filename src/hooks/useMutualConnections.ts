
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export const useMutualConnections = () => {
  const { user } = useAuth();

  const calculateMutualFriends = async (targetUserId: string): Promise<number> => {
    if (!user || user.id === targetUserId) return 0;

    try {
      // Get current user's accepted connections
      const { data: userConnections, error: userError } = await supabase
        .from('user_connections')
        .select('connected_user_id, user_id')
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (userError) throw userError;

      // Get target user's accepted connections
      const { data: targetConnections, error: targetError } = await supabase
        .from('user_connections')
        .select('connected_user_id, user_id')
        .or(`user_id.eq.${targetUserId},connected_user_id.eq.${targetUserId}`)
        .eq('status', 'accepted');

      if (targetError) throw targetError;

      // Extract unique user IDs for both users
      const userConnectionIds = new Set(
        userConnections?.map(conn => 
          conn.user_id === user.id ? conn.connected_user_id : conn.user_id
        ) || []
      );

      const targetConnectionIds = new Set(
        targetConnections?.map(conn => 
          conn.user_id === targetUserId ? conn.connected_user_id : conn.user_id
        ) || []
      );

      // Find intersection (mutual connections)
      const mutualConnections = [...userConnectionIds].filter(id => 
        targetConnectionIds.has(id)
      );

      return mutualConnections.length;
    } catch (error) {
      console.error('Error calculating mutual friends:', error);
      return 0;
    }
  };

  return { calculateMutualFriends };
};
