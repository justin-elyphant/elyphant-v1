
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { unifiedGiftManagementService, UnifiedGiftTimingPreferences as GiftTimingPreferences, UnifiedScheduledGiftEvent as ScheduledGiftEvent } from "@/services/UnifiedGiftManagementService";
import { toast } from "sonner";

// 🚨 MIGRATION WARNING: This hook now uses UnifiedGiftManagementService
// Legacy unifiedGiftAutomationService calls have been migrated to the unified service
console.warn("useUnifiedGiftTiming: Now using UnifiedGiftManagementService (Phase 5 migration)");

export const useUnifiedGiftTiming = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<GiftTimingPreferences | null>(null);
  const [scheduledGifts, setScheduledGifts] = useState<ScheduledGiftEvent[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<ScheduledGiftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [preferencesData, scheduledData, remindersData] = await Promise.all([
        unifiedGiftManagementService.getUserGiftTimingPreferences(user.id),
        unifiedGiftManagementService.getUserScheduledGifts(user.id),
        unifiedGiftManagementService.getUpcomingGiftReminders(user.id, 7)
      ]);

      setPreferences(preferencesData);
      setScheduledGifts(scheduledData);
      setUpcomingReminders(remindersData);
    } catch (err) {
      console.error("Error loading unified gift timing data:", err);
      setError("Failed to load gift timing data");
      toast.error("Failed to load gift timing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const updateNotificationPreferences = async (newPreferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    defaultNotificationDays: number[];
  }) => {
    if (!user?.id) return;

    try {
      await unifiedGiftManagementService.upsertSettings({
        user_id: user.id,
        email_notifications: newPreferences.emailNotifications,
        push_notifications: newPreferences.pushNotifications,
        default_notification_days: newPreferences.defaultNotificationDays,
        default_budget_limit: preferences?.defaultBudgetLimit || 50,
        auto_approve_gifts: false,
        default_gift_source: 'wishlist',
        has_payment_method: false,
        budget_tracking: { spent_this_month: 0, spent_this_year: 0 }
      });
      await loadData(); // Reload to get updated data
      toast.success("Notification preferences updated");
    } catch (err) {
      console.error("Error updating preferences:", err);
      toast.error("Failed to update notification preferences");
    }
  };

  const getSystemStats = () => {
    const automatedCount = scheduledGifts.filter(g => g.type === 'automated').length;
    const manualCount = scheduledGifts.filter(g => g.type === 'manual').length;
    
    return {
      totalScheduled: scheduledGifts.length,
      automatedGifts: automatedCount,
      manualScheduled: manualCount,
      upcomingInWeek: upcomingReminders.length
    };
  };

  return {
    preferences,
    scheduledGifts,
    upcomingReminders,
    loading,
    error,
    updateNotificationPreferences,
    refreshData: loadData,
    stats: getSystemStats()
  };
};
