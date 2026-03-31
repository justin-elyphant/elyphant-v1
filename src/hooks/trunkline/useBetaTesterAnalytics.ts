import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FunnelData {
  signed_up: number;
  built_wishlist: number;
  invited_friend: number;
  scheduled_gift: number;
  made_purchase: number;
}

export interface EngagementData {
  avg_orders_per_tester: number;
  credit_utilization_pct: number;
  active_last_7_days: number;
  total_testers: number;
}

export interface FeatureUsage {
  feature: string;
  usage_count: number;
  unique_users: number;
}

export interface TesterDetail {
  user_id: string;
  name: string | null;
  email: string | null;
  last_active: string | null;
  wishlist_count: number;
  order_count: number;
  features_used: number;
  has_wishlist: boolean;
  has_invited: boolean;
  has_scheduled_gift: boolean;
  has_purchased: boolean;
}

export interface BetaTesterAnalytics {
  funnel: FunnelData;
  engagement: EngagementData;
  feature_usage: FeatureUsage[] | null;
  per_tester: TesterDetail[] | null;
}

export const useBetaTesterAnalytics = () => {
  return useQuery({
    queryKey: ["beta-tester-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_beta_tester_analytics");
      if (error) throw error;
      return data as unknown as BetaTesterAnalytics;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
