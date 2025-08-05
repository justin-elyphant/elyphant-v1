/**
 * NICOLE AUTO-GIFTING HOOK
 * 
 * This hook provides the interface for Nicole-enhanced auto-gifting functionality,
 * including conversational approvals, rule creation, and predictive analytics.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { enhancedAutoGiftingService, EnhancedAutoGiftExecution } from '@/services/enhanced-auto-gifting-service';
import { nicoleAIService } from '@/services/ai/unified/nicoleAIService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NicoleApprovalState {
  conversationId?: string;
  emailTokenId?: string;
  approvalMethods: string[];
  status: 'pending' | 'active' | 'completed';
}

export interface NicolePredictiveInsight {
  type: 'budget_optimization' | 'timing_recommendation' | 'rule_suggestion';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  data: any;
}

export const useNicoleAutoGifting = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [approvalStates, setApprovalStates] = useState<Map<string, NicoleApprovalState>>(new Map());
  const [predictiveInsights, setPredictiveInsights] = useState<NicolePredictiveInsight[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Map<string, any[]>>(new Map());

  // ============= NICOLE-ENHANCED GIFT SELECTION =============

  const enhanceGiftSelectionWithNicole = async (
    ruleId: string,
    eventId: string
  ): Promise<{
    products: any[];
    confidence: number;
    reasoning: string;
    aiAttribution: any;
  }> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);

      // Get rule and event details
      const { data: rule, error: ruleError } = await supabase
        .from('auto_gifting_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (ruleError) throw ruleError;

      const { data: event, error: eventError } = await supabase
        .from('user_special_dates')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Get recipient profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', rule.recipient_id)
        .single();

      // Use Nicole for enhanced gift selection
      const selection = await enhancedAutoGiftingService.selectGiftsWithNicole(
        rule,
        event,
        profile
      );

      toast.success(`Nicole selected ${selection.products.length} thoughtful gifts`);

      return selection;

    } catch (error) {
      console.error('Error enhancing gift selection with Nicole:', error);
      toast.error('Failed to enhance gift selection');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============= HYBRID APPROVAL SYSTEM =============

  const createHybridApproval = async (execution: EnhancedAutoGiftExecution): Promise<NicoleApprovalState> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);

      const approval = await enhancedAutoGiftingService.createHybridApproval(execution);
      
      const approvalState: NicoleApprovalState = {
        conversationId: approval.conversationId,
        emailTokenId: approval.emailTokenId,
        approvalMethods: approval.approvalMethods,
        status: approval.conversationId ? 'active' : 'pending'
      };

      setApprovalStates(prev => new Map(prev.set(execution.id, approvalState)));

      toast.success(
        `Approval created - ${approval.approvalMethods.length} method${approval.approvalMethods.length > 1 ? 's' : ''} available`
      );

      return approvalState;

    } catch (error) {
      console.error('Error creating hybrid approval:', error);
      toast.error('Failed to create approval');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const processNicoleApproval = async (
    conversationId: string,
    decision: 'approve' | 'reject',
    customizations?: any
  ): Promise<void> => {
    try {
      setLoading(true);

      const result = await enhancedAutoGiftingService.processNicoleApproval(
        conversationId,
        decision,
        customizations
      );

      if (result.success) {
        // Update approval state
        setApprovalStates(prev => {
          const newMap = new Map(prev);
          for (const [executionId, state] of newMap.entries()) {
            if (state.conversationId === conversationId) {
              newMap.set(executionId, { ...state, status: 'completed' });
              break;
            }
          }
          return newMap;
        });

        toast.success(
          decision === 'approve' 
            ? 'Gifts approved via Nicole chat!'
            : 'Auto-gift cancelled via Nicole chat'
        );
      }

    } catch (error) {
      console.error('Error processing Nicole approval:', error);
      toast.error('Failed to process approval');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============= CONVERSATIONAL RULE CREATION =============

  const createRuleWithNicole = async (naturalLanguageInput: string): Promise<{
    ruleId: string;
    ruleData: any;
    confidence: number;
  }> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);

      const result = await enhancedAutoGiftingService.createRuleWithNicole(
        user.id,
        naturalLanguageInput
      );

      toast.success('Auto-gifting rule created with Nicole!');

      return result;

    } catch (error) {
      console.error('Error creating rule with Nicole:', error);
      toast.error('Failed to create rule');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============= PREDICTIVE ANALYTICS =============

  const generatePredictiveInsights = async (): Promise<NicolePredictiveInsight[]> => {
    if (!user) return [];

    try {
      setLoading(true);

      const insights = await nicoleAIService.generatePredictiveInsights(user.id);
      
      const formattedInsights: NicolePredictiveInsight[] = [
        ...insights.suggestions.map(s => ({
          type: 'rule_suggestion' as const,
          title: 'Rule Suggestion',
          description: s.description || 'Nicole suggests optimizing your auto-gifting rules',
          confidence: insights.confidence,
          actionable: true,
          data: s
        })),
        ...insights.budgetOptimizations.map(b => ({
          type: 'budget_optimization' as const,
          title: 'Budget Optimization',
          description: b.description || 'Nicole found budget optimization opportunities',
          confidence: insights.confidence,
          actionable: true,
          data: b
        })),
        ...insights.timingRecommendations.map(t => ({
          type: 'timing_recommendation' as const,
          title: 'Timing Recommendation',
          description: t.description || 'Nicole suggests timing adjustments',
          confidence: insights.confidence,
          actionable: true,
          data: t
        }))
      ];

      setPredictiveInsights(formattedInsights);
      
      if (formattedInsights.length > 0) {
        toast.success(`Nicole generated ${formattedInsights.length} insights for you`);
      }

      return formattedInsights;

    } catch (error) {
      console.error('Error generating predictive insights:', error);
      toast.error('Failed to generate insights');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ============= CONVERSATION MANAGEMENT =============

  const getConversationHistory = (conversationId: string): any[] => {
    return conversationHistory.get(conversationId) || [];
  };

  const addToConversationHistory = (conversationId: string, message: any): void => {
    setConversationHistory(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(conversationId) || [];
      newMap.set(conversationId, [...existing, message]);
      return newMap;
    });
  };

  // ============= APPROVAL STATE MANAGEMENT =============

  const getApprovalState = (executionId: string): NicoleApprovalState | undefined => {
    return approvalStates.get(executionId);
  };

  const clearApprovalState = (executionId: string): void => {
    setApprovalStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(executionId);
      return newMap;
    });
  };

  // ============= NICOLE STATISTICS =============

  const getNicoleStats = async (): Promise<{
    totalConversations: number;
    approvalsByMethod: { email: number; nicole_chat: number };
    averageConfidence: number;
    successRate: number;
  }> => {
    if (!user) return { totalConversations: 0, approvalsByMethod: { email: 0, nicole_chat: 0 }, averageConfidence: 0, successRate: 0 };

    try {
      // Get Nicole-attributed executions
      const { data: executions } = await supabase
        .from('automated_gift_executions')
        .select('*')
        .eq('user_id', user.id)
        .not('ai_agent_source', 'is', null);

      const nicoleExecutions = executions?.filter(e => 
        e.ai_agent_source?.agent === 'nicole'
      ) || [];

      // Get approval conversations
      const { data: conversations } = await supabase
        .from('approval_conversations')
        .select('*')
        .eq('user_id', user.id);

      const approvalsByMethod = executions?.reduce((acc, exec) => {
        if (exec.approval_method === 'email') acc.email++;
        else if (exec.approval_method === 'nicole_chat') acc.nicole_chat++;
        return acc;
      }, { email: 0, nicole_chat: 0 }) || { email: 0, nicole_chat: 0 };

      const averageConfidence = nicoleExecutions.length > 0 
        ? nicoleExecutions.reduce((sum, exec) => sum + (exec.ai_agent_source?.confidence_score || 0), 0) / nicoleExecutions.length
        : 0;

      const successRate = nicoleExecutions.length > 0
        ? nicoleExecutions.filter(exec => exec.status === 'completed').length / nicoleExecutions.length
        : 0;

      return {
        totalConversations: conversations?.length || 0,
        approvalsByMethod,
        averageConfidence,
        successRate
      };

    } catch (error) {
      console.error('Error getting Nicole stats:', error);
      return { totalConversations: 0, approvalsByMethod: { email: 0, nicole_chat: 0 }, averageConfidence: 0, successRate: 0 };
    }
  };

  // ============= LOAD INSIGHTS ON MOUNT =============

  useEffect(() => {
    if (user) {
      generatePredictiveInsights();
    }
  }, [user]);

  return {
    loading,
    
    // Enhanced gift selection
    enhanceGiftSelectionWithNicole,
    
    // Hybrid approval system
    createHybridApproval,
    processNicoleApproval,
    getApprovalState,
    clearApprovalState,
    
    // Conversational rule creation
    createRuleWithNicole,
    
    // Predictive analytics
    predictiveInsights,
    generatePredictiveInsights,
    
    // Conversation management
    getConversationHistory,
    addToConversationHistory,
    
    // Statistics
    getNicoleStats,
    
    // State
    approvalStates: Object.fromEntries(approvalStates),
  };
};