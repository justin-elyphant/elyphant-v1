import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface AutoGiftExecutionWithNicole {
  id: string;
  user_id: string;
  rule_id?: string;
  event_id?: string;
  execution_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  selected_products?: any;
  total_amount?: number;
  order_id?: string;
  error_message?: string;
  ai_agent_source?: {
    agent: string;
    discovery_method?: string;
    confidence_score: number;
    data_sources: string[];
  };
  created_at: string;
  updated_at: string;
}

export const useNicoleExecutions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [executions, setExecutions] = useState<AutoGiftExecutionWithNicole[]>([]);

  // Fetch executions with Nicole attribution
  const fetchExecutions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automated_gift_executions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error fetching Nicole executions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get Nicole-discovered executions
  const getNicoleExecutions = useCallback(() => {
    return executions.filter(execution => 
      execution.ai_agent_source?.agent === 'nicole'
    );
  }, [executions]);

  // Get executions with high confidence scores
  const getHighConfidenceExecutions = useCallback((threshold: number = 0.8) => {
    return executions.filter(execution => 
      execution.ai_agent_source?.confidence_score >= threshold
    );
  }, [executions]);

  // Update execution with Nicole attribution
  const updateExecutionAttribution = useCallback(async (
    executionId: string,
    attribution: {
      agent: string;
      discovery_method?: string;
      confidence_score: number;
      data_sources: string[];
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from('automated_gift_executions')
        .update({
          ai_agent_source: attribution
        })
        .eq('id', executionId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh executions
      await fetchExecutions();
      
      return data;
    } catch (error) {
      console.error('Error updating execution attribution:', error);
      return null;
    }
  }, [user?.id, fetchExecutions]);

  // Get Nicole statistics
  const getNicoleStats = useCallback(() => {
    const nicoleExecutions = getNicoleExecutions();
    const totalExecutions = executions.length;
    
    const avgConfidence = nicoleExecutions.length > 0 
      ? nicoleExecutions.reduce((sum, exec) => 
          sum + (exec.ai_agent_source?.confidence_score || 0), 0
        ) / nicoleExecutions.length
      : 0;

    const successfulExecutions = nicoleExecutions.filter(
      exec => exec.status === 'completed'
    ).length;

    return {
      totalNicoleExecutions: nicoleExecutions.length,
      totalExecutions,
      nicolePercentage: totalExecutions > 0 
        ? (nicoleExecutions.length / totalExecutions) * 100 
        : 0,
      avgConfidence: avgConfidence * 100,
      successRate: nicoleExecutions.length > 0 
        ? (successfulExecutions / nicoleExecutions.length) * 100 
        : 0
    };
  }, [executions, getNicoleExecutions]);

  useEffect(() => {
    if (user?.id) {
      fetchExecutions();
    }
  }, [user?.id, fetchExecutions]);

  return {
    loading,
    executions,
    fetchExecutions,
    getNicoleExecutions,
    getHighConfidenceExecutions,
    updateExecutionAttribution,
    getNicoleStats
  };
};