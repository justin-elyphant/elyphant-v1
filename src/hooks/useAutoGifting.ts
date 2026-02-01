
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { unifiedGiftManagementService, UnifiedGiftSettings as AutoGiftingSettings, UnifiedGiftRule as AutoGiftingRule } from "@/services/UnifiedGiftManagementService";
import { toast } from "sonner";

// This hook manages auto-gifting rules and settings using the unified gift management service

export const useAutoGifting = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AutoGiftingSettings | null>(null);
  const [rules, setRules] = useState<AutoGiftingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [settingsData, rulesData] = await Promise.all([
        unifiedGiftManagementService.getSettings(user.id),
        unifiedGiftManagementService.getUserRules(user.id)
      ]);

      // Settings will now auto-create if they don't exist
      setSettings(settingsData);
      setRules(rulesData);
    } catch (err) {
      console.error("Error loading auto-gifting data:", err);
      setError("Failed to load auto-gifting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const updateSettings = async (updates: Partial<AutoGiftingSettings>) => {
    if (!user?.id) return;

    try {
      const updatedSettings = await unifiedGiftManagementService.upsertSettings({
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

  const createRule = async (rule: Omit<AutoGiftingRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    try {
      const newRule = await unifiedGiftManagementService.createRule({
        ...rule,
        user_id: user.id
      });
      setRules(prev => [...prev, newRule]);
      toast.success("Auto-gifting rule created");
      return newRule;
    } catch (err) {
      console.error("Error creating rule:", err);
      toast.error("Failed to create auto-gifting rule");
    }
  };

  const updateRule = async (id: string, updates: Partial<AutoGiftingRule>) => {
    try {
      const updatedRule = await unifiedGiftManagementService.updateRule(id, updates);
      setRules(prev => prev.map(rule => rule.id === id ? updatedRule : rule));
      toast.success("Auto-gifting rule updated");
    } catch (err) {
      console.error("Error updating rule:", err);
      toast.error("Failed to update auto-gifting rule");
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await unifiedGiftManagementService.deleteRule(id);
      setRules(prev => prev.filter(rule => rule.id !== id));
      toast.success("Auto-gifting rule deleted");
    } catch (err) {
      console.error("Error deleting rule:", err);
      toast.error("Failed to delete auto-gifting rule");
    }
  };

  return {
    settings,
    rules,
    loading,
    error,
    updateSettings,
    createRule,
    updateRule,
    deleteRule,
    refreshData: loadData
  };
};
