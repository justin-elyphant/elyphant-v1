import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

// Enhanced auto-gift event tracking hook with webhook-inspired patterns
export interface AutoGiftEventLog {
  id: string;
  user_id: string;
  event_type: string;
  setup_token?: string;
  rule_id?: string;
  execution_id?: string;
  event_data: any;
  metadata: any;
  error_message?: string;
  created_at: string;
  expires_at?: string;
}

export const useAutoGiftEventTracking = () => {
  const { user } = useAuth();
  const [eventLogs, setEventLogs] = useState<AutoGiftEventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEventLogs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('auto_gift_event_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      setEventLogs(data || []);
    } catch (err) {
      console.error("Error loading auto-gift event logs:", err);
      setError("Failed to load event logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventLogs();
  }, [user?.id]);

  // Get events by type for specific analysis
  const getEventsByType = (eventType: string) => {
    return eventLogs.filter(log => log.event_type === eventType);
  };

  // Get setup flow events for debugging
  const getSetupFlowEvents = () => {
    return eventLogs.filter(log => 
      log.event_type.includes('setup') || 
      log.event_type.includes('rule')
    );
  };

  // Get recent execution events
  const getExecutionEvents = () => {
    return eventLogs.filter(log => 
      log.event_type.includes('execution') ||
      log.event_type.includes('scheduled')
    );
  };

  // Get error events for troubleshooting
  const getErrorEvents = () => {
    return eventLogs.filter(log => 
      log.event_type.includes('failed') || 
      log.error_message
    );
  };

  // Get setup completion rate
  const getSetupCompletionRate = () => {
    const setupInitiated = getEventsByType('auto_gift_setup_initiated').length;
    const setupCompleted = getEventsByType('auto_gift_rule_created').length;
    
    if (setupInitiated === 0) return 0;
    return Math.round((setupCompleted / setupInitiated) * 100);
  };

  return {
    eventLogs,
    loading,
    error,
    refreshLogs: loadEventLogs,
    getEventsByType,
    getSetupFlowEvents,
    getExecutionEvents,
    getErrorEvents,
    getSetupCompletionRate
  };
};