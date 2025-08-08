
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { supabase } from "@/integrations/supabase/client";

export interface AutoGiftSetupParams {
  userId: string;
  recipientId?: string | null;
  recipientName?: string;
  occasion: string; // e.g., 'birthday', 'anniversary'
  budget: { min?: number; max?: number } | number;
  relationship?: string; // e.g., 'friend'
  selected_product?: {
    id: string;
    title?: string;
    price?: number;
    image_url?: string;
    url?: string;
    source?: string;
  };
  scheduleDate?: string; // ISO timestamp when we plan to order
}

function normalizeOccasion(rawOccasion?: string): string {
  const o = (rawOccasion || '').toLowerCase();
  if (o.includes('anniver')) return 'anniversary';
  if (o.includes('holiday')) return 'holiday';
  if (o) return o;
  return 'birthday';
}

function toNumberBudget(budget: AutoGiftSetupParams['budget'], fallback: number): number {
  if (typeof budget === 'number') return budget;
  const max = Number(budget?.max);
  const min = Number(budget?.min);
  if (!isNaN(max) && max > 0) return max;
  if (!isNaN(min) && min > 0) return min;
  return fallback;
}

async function resolveRecipientIdFromName(userId: string, recipientName?: string): Promise<string | null> {
  if (!recipientName) return null;

  const { data: connections, error } = await supabase
    .from('user_connections')
    .select(`
      *,
      connected_profile:profiles!user_connections_connected_user_id_fkey(id,name,username),
      requester_profile:profiles!user_connections_user_id_fkey(id,name,username)
    `)
    .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('autoGiftSetupHelper: failed to load connections', error);
    return null;
  }

  const normalize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = normalize(recipientName);

  for (const conn of connections || []) {
    const otherIsRequester = conn.connected_user_id === userId;
    const otherProfile = otherIsRequester ? (conn as any).requester_profile : (conn as any).connected_profile;
    const otherId = otherIsRequester ? conn.user_id : conn.connected_user_id;
    const name = normalize(otherProfile?.name);
    const uname = normalize(otherProfile?.username);
    if (name === target || uname === target || name.includes(target) || target.includes(name)) {
      return otherId as string;
    }
  }
  return null;
}

export async function setupAutoGiftWithUnifiedSystems(params: AutoGiftSetupParams) {
  const { userId, recipientId: rawRecipientId, recipientName, occasion, budget, relationship = 'friend', selected_product, scheduleDate } = params;

  // Load user settings for defaults and protections
  const settings = await unifiedGiftManagementService.getSettings(userId);
  const dateType = normalizeOccasion(occasion);
  const budgetLimit = toNumberBudget(budget, settings?.default_budget_limit ?? 50);

  // Resolve recipient id if missing
  let recipientId = rawRecipientId || null;
  if (!recipientId) {
    recipientId = await resolveRecipientIdFromName(userId, recipientName);
  }
  if (!recipientId) {
    throw new Error("Recipient could not be resolved from connections");
  }

  const ruleData: any = {
    user_id: userId,
    recipient_id: recipientId,
    pending_recipient_email: null as string | null,
    date_type: dateType,
    is_active: true,
    budget_limit: budgetLimit,
    notification_preferences: {
      enabled: true,
      days_before: settings?.default_notification_days ?? [7, 3, 1],
      email: settings?.email_notifications ?? true,
      push: settings?.push_notifications ?? false,
    },
    gift_selection_criteria: {
      source: (settings?.default_gift_source || 'wishlist') as 'wishlist' | 'ai' | 'both' | 'specific',
      categories: [],
      exclude_items: [],
    },
    relationship_context: {
      closeness_level: 5,
      relationship_type: relationship,
      recipient_name: recipientName || undefined
    }
  };

  if (selected_product) {
    ruleData.gift_selection_criteria.selected_product = selected_product;
    ruleData.gift_selection_criteria.selection_strategies = ['explicit_selection','wishlist_preference','interest_match'];
    ruleData.gift_selection_criteria.source = 'specific';
  }

  if (scheduleDate) {
    ruleData.scheduled_date = scheduleDate;
  }

  const newRule = await unifiedGiftManagementService.createRule(ruleData);
  return newRule;
}
