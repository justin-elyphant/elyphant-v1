import { useNotifications } from '@/contexts/notifications/NotificationsContext';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedGiftExecution } from '@/services/UnifiedGiftManagementService';
import { EmailTemplateService } from './EmailTemplateService';

export class EnhancedNotificationService {
  /**
   * Create unified notification for auto-gift approval with email integration
   */
  static async createAutoGiftApprovalNotification(
    execution: UnifiedGiftExecution,
    recipientData: { email: string; name: string },
    emailTokenData?: { token: string; expires_at: string }
  ) {
    const { addNotification } = useNotifications();

    // Create in-app notification with enhanced data
    addNotification({
      title: "Auto-Gift Needs Approval",
      message: `We've selected perfect gifts for ${recipientData.name}'s special day - approve to send!`,
      type: "auto_gift_approval",
      link: `/dashboard?tab=auto-gifts&review=${execution.id}`,
      actionText: "Review & Approve",
      executionId: execution.id,
      recipientName: recipientData.name,
      eventType: "Auto Gift",
      selectedProducts: execution.selected_products,
      totalAmount: execution.total_amount,
      quickActions: {
        approve: () => this.quickApprove(execution.id),
        reject: () => this.quickReject(execution.id),
        review: () => window.location.href = `/dashboard?tab=auto-gifts&review=${execution.id}`
      }
    });

    // Log notification creation in database for tracking
    if (emailTokenData) {
      await supabase
        .from('email_delivery_logs')
        .insert({
          token_id: await this.getTokenId(emailTokenData.token),
          delivery_status: 'notification_created',
          event_data: {
            notification_type: 'auto_gift_approval',
            execution_id: execution.id,
            recipient_name: recipientData.name,
            created_at: new Date().toISOString()
          }
        });
    }
  }

  /**
   * Update notification when email status changes
   */
  static async updateEmailApprovalStatus(
    executionId: string,
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'approved' | 'rejected',
    additionalData?: any
  ) {
    // Log status update
    await supabase
      .from('email_delivery_logs')
      .insert({
        token_id: await this.getTokenIdByExecution(executionId),
        delivery_status: status,
        event_data: {
          status_update: true,
          execution_id: executionId,
          timestamp: new Date().toISOString(),
          ...additionalData
        }
      });

    // Update in-app notification if needed
    if (status === 'approved') {
      const { addNotification } = useNotifications();
      addNotification({
        title: "Auto-Gift Approved",
        message: "Your auto-gift has been approved and is being processed!",
        type: "auto_gift_approved",
        link: `/orders?execution=${executionId}`,
        actionText: "Track Order"
      });
    } else if (status === 'rejected') {
      const { addNotification } = useNotifications();
      addNotification({
        title: "Auto-Gift Rejected", 
        message: "Your auto-gift was rejected. You can review and create a new one anytime.",
        type: "system",
        link: `/dashboard?tab=auto-gifts`,
        actionText: "View Dashboard"
      });
    }
  }

  /**
   * Send approval reminder notifications
   */
  static async sendApprovalReminder(
    executionId: string,
    hoursRemaining: number
  ) {
    try {
      // Get execution details
      const { data: execution } = await supabase
        .from('automated_gift_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (!execution) {
        throw new Error('Execution not found');
      }

      // Get latest approval token
      const { data: tokenData } = await supabase
        .from('email_approval_tokens')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!tokenData || tokenData.approved_at || tokenData.rejected_at) {
        return; // Already processed or no token
      }

      // Send reminder email via orchestrator
      await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'auto_gift_approval',
          customData: {
            executionId,
            hoursRemaining,
            tokenId: tokenData.id
          }
        }
      });

      // Create in-app notification
      const { addNotification } = useNotifications();
      addNotification({
        title: `⏰ Auto-Gift Approval Reminder`,
        message: `Your auto-gift approval expires in ${hoursRemaining} hours. Don't miss out!`,
        type: "auto_gift_approval",
        link: `/dashboard?tab=auto-gifts&review=${executionId}`,
        actionText: "Approve Now",
        executionId: execution.id
      });

      // Log reminder sent
      await supabase
        .from('email_delivery_logs')
        .insert({
          token_id: tokenData.id,
          delivery_status: 'reminder_sent',
          event_data: {
            reminder_type: 'approval_expiring',
            hours_remaining: hoursRemaining,
            timestamp: new Date().toISOString()
          }
        });

    } catch (error) {
      console.error('Error sending approval reminder:', error);
    }
  }

  /**
   * Get email delivery analytics for dashboard
   */
  static async getEmailApprovalAnalytics(userId: string, dateRange?: { start: Date; end: Date }) {
    const query = supabase
      .from('email_approval_tokens')
      .select(`
        *,
        email_delivery_logs(*),
        automated_gift_executions(*)
      `)
      .eq('user_id', userId);

    if (dateRange) {
      query
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email analytics:', error);
      return null;
    }

    // Process analytics
    const analytics = {
      totalEmails: data?.length || 0,
      emailsSent: data?.filter(token => token.email_sent_at).length || 0,
      emailsOpened: data?.filter(token => 
        token.email_delivery_logs?.some((log: any) => log.delivery_status === 'opened')
      ).length || 0,
      emailsClicked: data?.filter(token =>
        token.email_delivery_logs?.some((log: any) => log.delivery_status === 'clicked')
      ).length || 0,
      approvalsViaEmail: data?.filter(token => 
        token.approved_at && token.approved_via === 'email'
      ).length || 0,
      rejections: data?.filter(token => token.rejected_at).length || 0,
      expired: data?.filter(token => 
        !token.approved_at && !token.rejected_at && new Date(token.expires_at) < new Date()
      ).length || 0,
      averageApprovalTime: this.calculateAverageApprovalTime(data || []),
      openRate: data?.length ? (data.filter(token => 
        token.email_delivery_logs?.some((log: any) => log.delivery_status === 'opened')
      ).length / data.length) * 100 : 0,
      approvalRate: data?.length ? (data.filter(token => token.approved_at).length / data.length) * 100 : 0
    };

    return analytics;
  }

  /**
   * Schedule automatic reminder system
   */
  static async scheduleApprovalReminders(executionId: string, tokenId: string) {
    // This would typically integrate with a job queue system
    // For now, we'll create reminder records that can be processed by a cron job
    
    const reminderSchedules = [
      { hours_before_expiry: 24, reminder_type: 'first_reminder' },
      { hours_before_expiry: 12, reminder_type: 'urgent_reminder' },
      { hours_before_expiry: 2, reminder_type: 'final_reminder' }
    ];

    for (const schedule of reminderSchedules) {
      await supabase
        .from('email_delivery_logs')
        .insert({
          token_id: tokenId,
          delivery_status: 'reminder_scheduled',
          event_data: {
            execution_id: executionId,
            reminder_type: schedule.reminder_type,
            hours_before_expiry: schedule.hours_before_expiry,
            scheduled_at: new Date().toISOString()
          }
        });
    }
  }

  // Helper methods
  private static async quickApprove(executionId: string) {
    // Quick approve functionality - would integrate with existing approval system
    window.location.href = `/dashboard?tab=auto-gifts&approve=${executionId}`;
  }

  private static async quickReject(executionId: string) {
    // Quick reject functionality
    window.location.href = `/dashboard?tab=auto-gifts&reject=${executionId}`;
  }

  private static async getTokenId(token: string): Promise<string | null> {
    const { data } = await supabase
      .from('email_approval_tokens')
      .select('id')
      .eq('token', token)
      .single();
    
    return data?.id || null;
  }

  private static async getTokenIdByExecution(executionId: string): Promise<string | null> {
    const { data } = await supabase
      .from('email_approval_tokens')
      .select('id')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data?.id || null;
  }

  private static calculateAverageApprovalTime(tokens: any[]): number {
    const approvedTokens = tokens.filter(token => token.approved_at);
    
    if (approvedTokens.length === 0) return 0;

    const totalTime = approvedTokens.reduce((sum, token) => {
      const sentTime = new Date(token.email_sent_at || token.created_at);
      const approvedTime = new Date(token.approved_at);
      return sum + (approvedTime.getTime() - sentTime.getTime());
    }, 0);

    return totalTime / approvedTokens.length / (1000 * 60); // Return in minutes
  }
}