
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { unifiedGiftTimingService, GiftTimingPreferences, ScheduledGiftEvent } from "@/services/unifiedGiftTimingService";
import { toast } from "sonner";

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
        unifiedGiftTimingService.getUserGiftTimingPreferences(user.id),
        unifiedGiftTimingService.getUserScheduledGifts(user.id),
        unifiedGiftTimingService.getUpcomingGiftReminders(user.id, 7)
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
      await unifiedGiftTimingService.updateUnifiedNotificationPreferences(user.id, newPreferences);
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
