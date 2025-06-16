
import { supabase } from "@/integrations/supabase/client";

export interface AutoGiftingRule {
  id: string;
  user_id: string;
  recipient_id: string;
  date_type: string;
  event_id?: string;
  is_active: boolean;
  budget_limit?: number;
  gift_message?: string;
  created_from_event_id?: string;
  notification_preferences: {
    enabled: boolean;
    days_before: number[];
    email: boolean;
    push: boolean;
  };
  gift_selection_criteria: {
    source: "wishlist" | "ai" | "both" | "specific";
    max_price?: number;
    min_price?: number;
    categories: string[];
    exclude_items: string[];
  };
  gift_preferences?: any;
  created_at?: string;
  updated_at?: string;
}

export interface AutoGiftingSettings {
  id: string;
  user_id: string;
  default_budget_limit: number;
  default_notification_days: number[];
  email_notifications: boolean;
  push_notifications: boolean;
  auto_approve_gifts: boolean;
  default_gift_source: "wishlist" | "ai" | "both" | "specific";
  budget_tracking: {
    monthly_limit?: number;
    annual_limit?: number;
    spent_this_month: number;
    spent_this_year: number;
  };
  created_at?: string;
  updated_at?: string;
}

export const autoGiftingService = {
  // Auto-gifting rules
  async createRule(rule: Omit<AutoGiftingRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutoGiftingRule> {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRule(id: string, updates: Partial<AutoGiftingRule>): Promise<AutoGiftingRule> {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('auto_gifting_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getUserRules(userId: string): Promise<AutoGiftingRule[]> {
    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  // Auto-gifting settings
  async getSettings(userId: string): Promise<AutoGiftingSettings | null> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createSettings(settings: Omit<AutoGiftingSettings, 'id' | 'created_at' | 'updated_at'>): Promise<AutoGiftingSettings> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .insert(settings)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSettings(userId: string, updates: Partial<AutoGiftingSettings>): Promise<AutoGiftingSettings> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertSettings(settings: Omit<AutoGiftingSettings, 'id' | 'created_at' | 'updated_at'>): Promise<AutoGiftingSettings> {
    const { data, error } = await supabase
      .from('auto_gifting_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
