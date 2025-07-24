import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { 
  unifiedGiftAutomationService, 
  UnifiedGiftRule, 
  UnifiedGiftSettings, 
  UnifiedGiftExecution,
  GiftTimingPreferences,
  ScheduledGiftEvent,
  HierarchicalGiftSelection
} from "@/services/UnifiedGiftAutomationService";
import { toast } from "sonner";

export interface UseUnifiedGiftAutomationReturn {
  // Rules Management
  rules: UnifiedGiftRule[];
  createRule: (rule: Omit<UnifiedGiftRule, 'id' | 'created_at' | 'updated_at'>) => Promise<UnifiedGiftRule | undefined>;
  updateRule: (id: string, updates: Partial<UnifiedGiftRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  
  // Settings Management
  settings: UnifiedGiftSettings | null;
  updateSettings: (updates: Partial<UnifiedGiftSettings>) => Promise<void>;
  
  // Executions Management
  executions: UnifiedGiftExecution[];
  processPendingExecutions: () => Promise<void>;
  approveExecution: (executionId: string, selectedProductIds: string[]) => Promise<void>;
  
  // Timing & Scheduling
  preferences: GiftTimingPreferences | null;
  scheduledGifts: ScheduledGiftEvent[];
  upcomingReminders: ScheduledGiftEvent[];
  updateNotificationPreferences: (newPreferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    defaultNotificationDays: number[];
  }) => Promise<void>;
  
  // Gift Selection
  selectGiftForRecipient: (recipientId: string, budget: number, occasion: string, categories?: string[]) => Promise<HierarchicalGiftSelection | undefined>;
  
  // System Stats
  stats: {
    totalScheduled: number;
    automatedGifts: number;
    manualScheduled: number;
    upcomingInWeek: number;
    totalExecutions: number;
    pendingExecutions: number;
    completedExecutions: number;
    budgetUsed: number;
    budgetLimit: number | null;
  };
  
  // State
  loading: boolean;
  processing: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useUnifiedGiftAutomation = (): UseUnifiedGiftAutomationReturn => {
  const { user } = useAuth();
  
  // State
  const [rules, setRules] = useState<UnifiedGiftRule[]>([]);
  const [settings, setSettings] = useState<UnifiedGiftSettings | null>(null);
  const [executions, setExecutions] = useState<UnifiedGiftExecution[]>([]);
  const [preferences, setPreferences] = useState<GiftTimingPreferences | null>(null);
  const [scheduledGifts, setScheduledGifts] = useState<ScheduledGiftEvent[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<ScheduledGiftEvent[]>([]);
  const [stats, setStats] = useState({
    totalScheduled: 0,
    automatedGifts: 0,
    manualScheduled: 0,
    upcomingInWeek: 0,
    totalExecutions: 0,
    pendingExecutions: 0,
    completedExecutions: 0,
    budgetUsed: 0,
    budgetLimit: null as number | null
  });
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading unified gift automation data...');

      const [
        rulesData,
        settingsData,
        executionsData,
        preferencesData,
        scheduledData,
        remindersData,
        statsData
      ] = await Promise.all([
        unifiedGiftAutomationService.getUserRules(user.id),
        unifiedGiftAutomationService.getSettings(user.id),
        unifiedGiftAutomationService.getUserExecutions(user.id),
        unifiedGiftAutomationService.getUserGiftTimingPreferences(user.id),
        unifiedGiftAutomationService.getUserScheduledGifts(user.id),
        unifiedGiftAutomationService.getUpcomingGiftReminders(user.id, 7),
        unifiedGiftAutomationService.getSystemStats(user.id)
      ]);

      setRules(rulesData);
      setSettings(settingsData);
      setExecutions(executionsData);
      setPreferences(preferencesData);
      setScheduledGifts(scheduledData);
      setUpcomingReminders(remindersData);
      setStats(statsData);

      console.log('✅ Unified gift automation data loaded successfully');
    } catch (err) {
      console.error("❌ Error loading unified gift automation data:", err);
      setError("Failed to load gift automation data");
      toast.error("Failed to load gift automation data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Rules Management
  const createRule = async (rule: Omit<UnifiedGiftRule, 'id' | 'created_at' | 'updated_at'>): Promise<UnifiedGiftRule | undefined> => {
    if (!user?.id) return;

    try {
      const newRule = await unifiedGiftAutomationService.createRule({
        ...rule,
        user_id: user.id
      });
      setRules(prev => [...prev, newRule]);
      toast.success("Auto-gifting rule created successfully");
      return newRule;
    } catch (err) {
      console.error("Error creating rule:", err);
      toast.error("Failed to create auto-gifting rule");
    }
  };

  const updateRule = async (id: string, updates: Partial<UnifiedGiftRule>): Promise<void> => {
    try {
      const updatedRule = await unifiedGiftAutomationService.updateRule(id, updates);
      setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
      toast.success("Auto-gifting rule updated");
    } catch (err) {
      console.error("Error updating rule:", err);
      toast.error("Failed to update auto-gifting rule");
    }
  };

  const deleteRule = async (id: string): Promise<void> => {
    try {
      await unifiedGiftAutomationService.deleteRule(id);
      setRules(prev => prev.filter(rule => rule.id !== id));
      toast.success("Auto-gifting rule deleted");
    } catch (err) {
      console.error("Error deleting rule:", err);
      toast.error("Failed to delete auto-gifting rule");
    }
  };

  // Settings Management
  const updateSettings = async (updates: Partial<UnifiedGiftSettings>): Promise<void> => {
    if (!user?.id) return;

    try {
      const updatedSettings = await unifiedGiftAutomationService.upsertSettings({
        user_id: user.id,
        ...settings,
        ...updates
      });
      setSettings(updatedSettings);
      toast.success("Auto-gifting settings updated");
    } catch (err) {
      console.error("Error updating settings:", err);
      toast.error("Failed to update settings");
    }
  };

  // Executions Management
  const processPendingExecutions = async (): Promise<void> => {
    if (!user?.id || processing) return;

    try {
      setProcessing(true);
      await unifiedGiftAutomationService.processPendingExecutions(user.id);
      await loadData(); // Refresh all data
      toast.success("Auto-gift executions processed");
    } catch (err) {
      console.error("Error processing executions:", err);
      toast.error("Failed to process auto-gift executions");
    } finally {
      setProcessing(false);
    }
  };

  const approveExecution = async (executionId: string, selectedProductIds: string[]): Promise<void> => {
    try {
      await unifiedGiftAutomationService.approveExecution(executionId, selectedProductIds);
      toast.success("Auto-gift approved for processing");
      await loadData(); // Refresh executions
    } catch (err) {
      console.error("Error approving execution:", err);
      toast.error("Failed to approve auto-gift");
    }
  };

  // Notification Preferences
  const updateNotificationPreferences = async (newPreferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    defaultNotificationDays: number[];
  }): Promise<void> => {
    if (!user?.id) return;

    try {
      // Get existing settings to preserve other values
      const existingSettings = settings;
      
      await unifiedGiftAutomationService.upsertSettings({
        user_id: user.id,
        email_notifications: newPreferences.emailNotifications,
        push_notifications: newPreferences.pushNotifications,
        default_notification_days: newPreferences.defaultNotificationDays,
        default_budget_limit: existingSettings?.default_budget_limit || 50,
        auto_approve_gifts: existingSettings?.auto_approve_gifts || false,
        default_gift_source: existingSettings?.default_gift_source || 'wishlist',
        budget_tracking: existingSettings?.budget_tracking || {
          spent_this_month: 0,
          spent_this_year: 0
        }
      });
      
      await loadData(); // Refresh preferences
      toast.success("Notification preferences updated");
    } catch (err) {
      console.error("Error updating preferences:", err);
      toast.error("Failed to update notification preferences");
    }
  };

  // Gift Selection
  const selectGiftForRecipient = async (
    recipientId: string, 
    budget: number, 
    occasion: string, 
    categories: string[] = []
  ): Promise<HierarchicalGiftSelection | undefined> => {
    try {
      return await unifiedGiftAutomationService.selectGiftForRecipient(
        recipientId, 
        budget, 
        occasion, 
        categories
      );
    } catch (err) {
      console.error("Error selecting gift:", err);
      toast.error("Failed to select gift");
    }
  };

  return {
    // Rules Management
    rules,
    createRule,
    updateRule,
    deleteRule,
    
    // Settings Management
    settings,
    updateSettings,
    
    // Executions Management
    executions,
    processPendingExecutions,
    approveExecution,
    
    // Timing & Scheduling
    preferences,
    scheduledGifts,
    upcomingReminders,
    updateNotificationPreferences,
    
    // Gift Selection
    selectGiftForRecipient,
    
    // System Stats
    stats,
    
    // State
    loading,
    processing,
    error,
    refreshData: loadData
  };
};