/**
 * Auto-Gift Nudge Service with Nicole AI Integration
 * Handles intelligent nudging for auto-gift setup and data sharing
 */

import { supabase } from '@/integrations/supabase/client';
import { nicoleAIService } from '@/services/ai/unified/nicoleAIService';
import { unifiedNicoleAI } from '@/services/ai/unified/UnifiedNicoleAIService';
import { RelationshipType } from '@/types/connections';

export interface AutoGiftNudgeContext {
  connectionId: string;
  connectionName: string;
  missingDataTypes: Array<'shipping' | 'birthday' | 'email'>;
  relationshipType: RelationshipType;
  customRelationship?: string;
}

export interface AutoGiftNudgeResult {
  success: boolean;
  message?: string;
  error?: string;
  nudgeId?: string;
}

class AutoGiftNudgeService {
  /**
   * Send an intelligent nudge using Nicole AI for personalization
   */
  async sendIntelligentNudge(context: AutoGiftNudgeContext): Promise<AutoGiftNudgeResult> {
    try {
      console.log('🔔 Sending intelligent auto-gift nudge:', context);

      // Step 1: Check if user can send nudge (rate limiting)
      const canSend = await this.checkNudgeEligibility(context.connectionId);
      if (!canSend.eligible) {
        return {
          success: false,
          error: canSend.reason
        };
      }

      // Step 2: Generate personalized nudge message with Nicole AI
      const personalizedMessage = await this.generatePersonalizedNudgeMessage(context);

      // Step 3: Send the nudge
      const nudgeResult = await this.sendNudge({
        connectionId: context.connectionId,
        message: personalizedMessage,
        context: 'auto_gift_setup',
        dataTypes: context.missingDataTypes
      });

      if (nudgeResult.success) {
        return {
          success: true,
          message: `Smart nudge sent to ${context.connectionName}!`,
          nudgeId: nudgeResult.nudgeId
        };
      } else {
        return {
          success: false,
          error: nudgeResult.error
        };
      }
    } catch (error) {
      console.error('Error sending intelligent nudge:', error);
      return {
        success: false,
        error: 'Failed to send nudge'
      };
    }
  }

  /**
   * Check if user is eligible to send a nudge (rate limiting, spam prevention)
   */
  private async checkNudgeEligibility(connectionId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    try {
      // Get user's current auth session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { eligible: false, reason: 'Authentication required' };
      }

      // Check recent nudges to this connection
      const { data: recentNudges, error } = await supabase
        .from('connection_nudges')
        .select('created_at, nudge_count')
        .eq('user_id', user.id)
        .eq('connection_id', connectionId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking nudge eligibility:', error);
        return { eligible: false, reason: 'Unable to verify nudge history' };
      }

      // Apply rate limiting rules
      if (recentNudges && recentNudges.length >= 3) {
        return { 
          eligible: false, 
          reason: 'Maximum 3 nudges per week to avoid spam' 
        };
      }

      // Check if nudge was sent in last 24 hours
      const lastNudge = recentNudges?.[0];
      if (lastNudge) {
        const lastNudgeTime = new Date(lastNudge.created_at);
        const hoursSinceLastNudge = (Date.now() - lastNudgeTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastNudge < 24) {
          return {
            eligible: false,
            reason: 'Wait 24 hours between nudges'
          };
        }
      }

      return { eligible: true };
    } catch (error) {
      console.error('Error checking nudge eligibility:', error);
      return { eligible: false, reason: 'System error' };
    }
  }

  /**
   * Generate personalized nudge message using Nicole AI
   */
  private async generatePersonalizedNudgeMessage(context: AutoGiftNudgeContext): Promise<string> {
    try {
      // Create Nicole context for nudge message generation
      const nicoleContext = {
        conversationPhase: 'nudge_generation',
        capability: 'conversation' as const,
        recipient: context.connectionName,
        relationship: context.relationshipType,
        currentUserId: (await supabase.auth.getUser()).data.user?.id
      };

      const prompt = this.buildNudgePrompt(context);
      
      // Use UnifiedNicoleAI for message generation
      const response = await unifiedNicoleAI.chat(
        prompt,
        nicoleContext,
        `nudge-${context.connectionId}-${Date.now()}`
      );

      // Extract personalized message from Nicole's response
      return response.message || this.getFallbackMessage(context);
    } catch (error) {
      console.error('Error generating personalized nudge message:', error);
      return this.getFallbackMessage(context);
    }
  }

  /**
   * Build prompt for Nicole AI to generate nudge message
   */
  private buildNudgePrompt(context: AutoGiftNudgeContext): string {
    const relationshipLabel = context.customRelationship || context.relationshipType;
    const missingDataText = context.missingDataTypes.join(' and ');

    return `Generate a friendly, personalized message to request ${missingDataText} for auto-gifting setup.

Context:
- Recipient: ${context.connectionName}
- Relationship: ${relationshipLabel}
- Missing data: ${missingDataText}
- Purpose: Setting up automatic gift delivery

Guidelines:
- Be warm and friendly, not pushy
- Explain the benefit (never miss important occasions)
- Make it feel personal, not automated
- Keep it conversational and casual
- Emphasize convenience and thoughtfulness

Generate a message that feels like it's coming from a friend who cares about making sure they never miss important moments in ${context.connectionName}'s life.`;
  }

  /**
   * Send the actual nudge
   */
  private async sendNudge({
    connectionId,
    message,
    context,
    dataTypes
  }: {
    connectionId: string;
    message: string;
    context: string;
    dataTypes: string[];
  }): Promise<{ success: boolean; error?: string; nudgeId?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      // Get connection details for email
      const { data: connection, error: connectionError } = await supabase
        .from('user_connections')
        .select(`
          connected_user_id,
          profiles!connected_user_id (
            email,
            name
          )
        `)
        .eq('id', connectionId)
        .single();

      if (connectionError || !connection) {
        return { success: false, error: 'Connection not found' };
      }

      const profile = Array.isArray(connection.profiles) ? connection.profiles[0] : connection.profiles;
      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      // Insert nudge record
      const { data: nudge, error: nudgeError } = await supabase
        .from('connection_nudges')
        .insert({
          user_id: user.id,
          connection_id: connectionId,
          recipient_email: profile.email,
          custom_message: message,
          nudge_type: 'auto_gift_setup',
          nudge_method: 'email',
          delivery_status: 'sent'
        })
        .select()
        .single();

      if (nudgeError) {
        return { success: false, error: 'Failed to create nudge record' };
      }

      // Here we would integrate with email service to send the actual nudge
      // For now, we'll log it and mark as sent
      console.log('📧 Auto-gift nudge sent:', {
        to: profile.email,
        message,
        context,
        dataTypes
      });

      return { 
        success: true, 
        nudgeId: nudge.id 
      };
    } catch (error) {
      console.error('Error sending nudge:', error);
      return { success: false, error: 'Failed to send nudge' };
    }
  }

  /**
   * Get fallback message when Nicole AI is unavailable
   */
  private getFallbackMessage(context: AutoGiftNudgeContext): string {
    const relationshipLabel = context.customRelationship || context.relationshipType;
    const missingDataText = context.missingDataTypes.join(' and ');

    return `Hi ${context.connectionName}! I'm setting up automatic gift delivery so I never miss your special occasions. Could you share your ${missingDataText} with me? This way I can make sure perfect gifts reach you right on time for birthdays and other celebrations! 🎁`;
  }
}

export const autoGiftNudgeService = new AutoGiftNudgeService();