import { supabase } from "@/integrations/supabase/client";
import { autoGiftingService, AutoGiftingRule, AutoGiftingSettings } from "./autoGiftingService";

export interface GiftTimingPreferences {
  // From auto-gifting system
  autoGiftingEnabled: boolean;
  defaultBudgetLimit: number;
  defaultNotificationDays: number[];
  
  // From manual scheduling system
  preferredDeliveryTimeframe: string;
  defaultGiftMessage?: string;
  
  // Shared preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface ScheduledGiftEvent {
  id: string;
  type: 'automated' | 'manual';
  userId: string;
  recipientId?: string;
  scheduledDate: Date;
  eventType?: string;
  giftOptions: {
    budget?: number;
    giftMessage?: string;
    isHidden?: boolean;
  };
  status: 'scheduled' | 'processed' | 'cancelled';
}

export interface AutomatedGiftExecution {
  id: string;
  rule_id: string;
  event_id: string;
  user_id: string;
  execution_date: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  selected_products?: any[];
  total_amount?: number;
  order_id?: string;
  error_message?: string;
  retry_count: number;
  next_retry_at?: Date;
  created_at: Date;
  updated_at: Date;
}

class UnifiedGiftTimingService {
  
  /**
   * Get comprehensive gift timing preferences for a user
   */
  async getUserGiftTimingPreferences(userId: string): Promise<GiftTimingPreferences> {
    const autoGiftingSettings = await autoGiftingService.getSettings(userId);
    
    return {
      autoGiftingEnabled: !!autoGiftingSettings?.auto_approve_gifts,
      defaultBudgetLimit: autoGiftingSettings?.default_budget_limit || 50,
      defaultNotificationDays: autoGiftingSettings?.default_notification_days || [7, 3, 1],
      preferredDeliveryTimeframe: 'standard', // Could be enhanced
      emailNotifications: autoGiftingSettings?.email_notifications ?? true,
      pushNotifications: autoGiftingSettings?.push_notifications ?? false,
    };
  }

  /**
   * Get all scheduled gifts (both automated and manual) for a user
   */
  async getUserScheduledGifts(userId: string): Promise<ScheduledGiftEvent[]> {
    const scheduledGifts: ScheduledGiftEvent[] = [];

    // Get automated gifts from auto-gifting rules
    const autoRules = await autoGiftingService.getUserRules(userId);
    for (const rule of autoRules) {
      if (rule.is_active) {
        // Get associated events for this rule
        const { data: events } = await supabase
          .from('user_special_dates')
          .select('*')
          .eq('user_id', userId)
          .eq('id', rule.event_id);

        if (events) {
          events.forEach(event => {
            scheduledGifts.push({
              id: `auto-${rule.id}`,
              type: 'automated',
              userId,
              recipientId: rule.recipient_id,
              scheduledDate: new Date(event.date),
              eventType: event.date_type,
              giftOptions: {
                budget: rule.budget_limit || undefined,
              },
              status: 'scheduled'
            });
          });
        }
      }
    }

    // Get manual scheduled gifts from orders
    const { data: scheduledOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .not('scheduled_delivery_date', 'is', null)
      .eq('status', 'pending');

    if (scheduledOrders) {
      scheduledOrders.forEach(order => {
        scheduledGifts.push({
          id: `manual-${order.id}`,
          type: 'manual',
          userId,
          scheduledDate: new Date(order.scheduled_delivery_date!),
          giftOptions: {
            giftMessage: order.gift_message || undefined,
            isHidden: order.is_surprise_gift || false,
          },
          status: 'scheduled'
        });
      });
    }

    return scheduledGifts.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  /**
   * Check for upcoming gifts that need attention
   */
  async getUpcomingGiftReminders(userId: string, daysAhead: number = 7): Promise<ScheduledGiftEvent[]> {
    const allScheduled = await this.getUserScheduledGifts(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return allScheduled.filter(gift => 
      gift.scheduledDate <= cutoffDate && 
      gift.scheduledDate >= new Date() &&
      gift.status === 'scheduled'
    );
  }

  /**
   * Update notification preferences across both systems
   */
  async updateUnifiedNotificationPreferences(
    userId: string, 
    preferences: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      defaultNotificationDays: number[];
    }
  ) {
    // Update auto-gifting settings
    await autoGiftingService.upsertSettings({
      user_id: userId,
      email_notifications: preferences.emailNotifications,
      push_notifications: preferences.pushNotifications,
      default_notification_days: preferences.defaultNotificationDays,
      default_budget_limit: 50, // Keep existing or set default
      auto_approve_gifts: false,
      default_gift_source: 'wishlist',
      budget_tracking: {
        spent_this_month: 0,
        spent_this_year: 0
      }
    });
  }

  /**
   * Get automated gift executions for monitoring
   */
  async getAutomatedGiftExecutions(userId: string): Promise<AutomatedGiftExecution[]> {
    const { data, error } = await supabase
      .from('automated_gift_executions')
      .select('*')
      .eq('user_id', userId)
      .order('execution_date', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(execution => ({
      ...execution,
      execution_date: new Date(execution.execution_date),
      next_retry_at: execution.next_retry_at ? new Date(execution.next_retry_at) : undefined,
      created_at: new Date(execution.created_at),
      updated_at: new Date(execution.updated_at)
    }));
  }

  /**
   * Approve a pending automated gift execution
   */
  async approveAutomatedGift(executionId: string): Promise<void> {
    const { error } = await supabase
      .from('automated_gift_executions')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) throw error;

    // TODO: Trigger actual order processing
    console.log('Automated gift approved and processing started');
  }

  /**
   * Cancel a pending automated gift execution
   */
  async cancelAutomatedGift(executionId: string): Promise<void> {
    const { error } = await supabase
      .from('automated_gift_executions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId);

    if (error) throw error;
  }

  /**
   * Trigger manual execution of automated gift processor
   */
  async triggerAutomatedGiftProcessor(): Promise<void> {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/automated-gift-processor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to trigger automated gift processor');
      }

      const result = await response.json();
      console.log('Automated gift processor result:', result);
    } catch (error) {
      console.error('Error triggering automated gift processor:', error);
      throw error;
    }
  }
}

export const unifiedGiftTimingService = new UnifiedGiftTimingService();
