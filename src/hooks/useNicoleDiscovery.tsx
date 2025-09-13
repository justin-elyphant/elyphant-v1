import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface NicoleDiscoveryLog {
  id: string;
  user_id: string;
  recipient_id?: string;
  recipient_email?: string;
  recipient_phone?: string;
  discovery_trigger: 'proactive_scan' | 'manual_request' | 'event_detection';
  discovery_status: 'initiated' | 'contacted' | 'data_collected' | 'rule_created' | 'completed';
  contact_method?: 'sms' | 'email';
  data_collected: {
    preferences: Record<string, any>;
    interests: string[];
    budget_hints: string[];
    conversation_insights: Record<string, any>;
  };
  confidence_metrics: {
    preference_confidence: number;
    budget_confidence: number;
    timing_confidence: number;
    overall_score: number;
  };
  timeline_events: Array<{
    timestamp: string;
    event: string;
    details: string;
  }>;
  related_execution_id?: string;
  related_rule_id?: string;
  conversation_summary?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface NicoleAttribution {
  agent: string;
  discovery_method?: string;
  confidence_score: number;
  data_sources: string[];
}

export const useNicoleDiscovery = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [discoveryLogs, setDiscoveryLogs] = useState<NicoleDiscoveryLog[]>([]);

  // Fetch Nicole discovery logs for the user
  const fetchDiscoveryLogs = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nicole_discovery_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscoveryLogs(((data || []) as any).map((d: any) => ({
        ...d,
        discovery_trigger: d.discovery_trigger as NicoleDiscoveryLog['discovery_trigger'],
        discovery_status: d.discovery_status as NicoleDiscoveryLog['discovery_status'],
        contact_method: d.contact_method as NicoleDiscoveryLog['contact_method'],
      })) as NicoleDiscoveryLog[]);
    } catch (error) {
      console.error('Error fetching Nicole discovery logs:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new Nicole discovery log entry
  const createDiscoveryLog = useCallback(async (
    discoveryData: Omit<NicoleDiscoveryLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('nicole_discovery_log')
        .insert({
          ...discoveryData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the logs
      await fetchDiscoveryLogs();
      
      return data;
    } catch (error) {
      console.error('Error creating Nicole discovery log:', error);
      return null;
    }
  }, [user?.id, fetchDiscoveryLogs]);

  // Update an existing discovery log
  const updateDiscoveryLog = useCallback(async (
    id: string, 
    updates: Partial<NicoleDiscoveryLog>
  ) => {
    try {
      const { data, error } = await supabase
        .from('nicole_discovery_log')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the logs
      await fetchDiscoveryLogs();
      
      return data;
    } catch (error) {
      console.error('Error updating Nicole discovery log:', error);
      return null;
    }
  }, [user?.id, fetchDiscoveryLogs]);

  // Get Nicole discoveries by status
  const getDiscoveriesByStatus = useCallback((status: NicoleDiscoveryLog['discovery_status']) => {
    return discoveryLogs.filter(log => log.discovery_status === status);
  }, [discoveryLogs]);

  // Get recent Nicole activity
  const getRecentActivity = useCallback((days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return discoveryLogs.filter(log => 
      new Date(log.created_at) >= cutoffDate
    );
  }, [discoveryLogs]);

  // Get discoveries for specific recipient
  const getDiscoveriesForRecipient = useCallback((recipientEmail: string) => {
    return discoveryLogs.filter(log => 
      log.recipient_email === recipientEmail
    );
  }, [discoveryLogs]);

  // Add timeline event to a discovery log
  const addTimelineEvent = useCallback(async (
    discoveryId: string,
    event: string,
    details: string
  ) => {
    const log = discoveryLogs.find(l => l.id === discoveryId);
    if (!log) return;

    const newEvent = {
      timestamp: new Date().toISOString(),
      event,
      details
    };

    const updatedEvents = [...log.timeline_events, newEvent];
    
    return updateDiscoveryLog(discoveryId, {
      timeline_events: updatedEvents
    });
  }, [discoveryLogs, updateDiscoveryLog]);

  useEffect(() => {
    if (user?.id) {
      fetchDiscoveryLogs();
    }
  }, [user?.id, fetchDiscoveryLogs]);

  return {
    loading,
    discoveryLogs,
    fetchDiscoveryLogs,
    createDiscoveryLog,
    updateDiscoveryLog,
    getDiscoveriesByStatus,
    getRecentActivity,
    getDiscoveriesForRecipient,
    addTimelineEvent
  };
};