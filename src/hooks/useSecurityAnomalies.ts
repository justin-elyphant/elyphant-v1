import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityAnomaly {
  id: string;
  anomaly_type: string;
  risk_score: number;
  details: any;
  created_at: string;
}

export const useSecurityAnomalies = (userId: string | undefined) => {
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAnomalies = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_active_anomalies', {
          target_user_id: userId,
        });

      if (error) throw error;

      setAnomalies(data || []);
      setUnreadCount((data || []).length);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();

    // Set up real-time subscription for new anomalies
    const channel = supabase
      .channel('security_anomalies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_anomalies',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAnomalies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const resolveAnomaly = async (anomalyId: string) => {
    try {
      const { error } = await supabase.rpc('resolve_anomaly', {
        anomaly_id: anomalyId,
      });

      if (error) throw error;

      // Refresh anomalies
      await fetchAnomalies();
    } catch (error) {
      console.error('Error resolving anomaly:', error);
      throw error;
    }
  };

  return {
    anomalies,
    loading,
    unreadCount,
    resolveAnomaly,
    refetch: fetchAnomalies,
  };
};
