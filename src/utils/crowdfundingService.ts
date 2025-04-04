
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FundingCampaign {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  product_id?: number;
  campaign_type: 'wedding' | 'graduation' | 'birthday' | 'product' | 'general';
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  campaign_id: string;
  contributor_id: string;
  amount: number;
  message?: string;
  is_anonymous: boolean;
  payment_intent_id?: string;
  payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: string;
}

export interface CreateCampaignParams {
  title: string;
  description: string;
  goalAmount: number;
  campaignType: FundingCampaign['campaign_type'];
  endDate?: string;
  productId?: number;
}

// Fetch all active campaigns
export const fetchActiveCampaigns = async (): Promise<FundingCampaign[]> => {
  const { data, error } = await supabase
    .from('funding_campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active campaigns:', error);
    toast.error("Failed to load campaigns");
    return [];
  }

  return data as FundingCampaign[];
};

// Fetch a specific campaign by ID
export const fetchCampaignById = async (campaignId: string): Promise<FundingCampaign | null> => {
  const { data, error } = await supabase
    .from('funding_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error) {
    console.error('Error fetching campaign:', error);
    toast.error("Failed to load campaign details");
    return null;
  }

  return data as FundingCampaign;
};

// Create a new funding campaign
export const createCampaign = async (params: CreateCampaignParams): Promise<FundingCampaign | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to create a campaign");
    return null;
  }

  const newCampaign = {
    creator_id: user.user.id,
    title: params.title,
    description: params.description,
    goal_amount: params.goalAmount,
    product_id: params.productId || null,
    campaign_type: params.campaignType,
    end_date: params.endDate || null,
    is_active: true
  };

  const { data, error } = await supabase
    .from('funding_campaigns')
    .insert([newCampaign])
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    toast.error("Failed to create campaign");
    return null;
  }

  toast.success("Campaign created successfully");
  return data as FundingCampaign;
};

// Fetch contributions for a campaign
export const fetchCampaignContributions = async (campaignId: string): Promise<Contribution[]> => {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contributions:', error);
    toast.error("Failed to load contributions");
    return [];
  }

  return data as Contribution[];
};

// Make a contribution to a campaign
export const makeContribution = async (
  campaignId: string, 
  amount: number, 
  message?: string,
  isAnonymous: boolean = false
): Promise<{ success: boolean; paymentUrl?: string }> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to contribute");
    return { success: false };
  }

  try {
    // Create a payment session with Stripe (this would be implemented in a Supabase edge function)
    const { data, error } = await supabase.functions.invoke("create-payment-session", {
      body: { 
        campaignId, 
        amount,
        message,
        isAnonymous
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      paymentUrl: data.url
    };
  } catch (error) {
    console.error('Error creating payment session:', error);
    toast.error("Failed to process contribution");
    return { success: false };
  }
};

// Subscribe to campaign updates for realtime UI updates
export const subscribeToCampaignUpdates = (
  campaignId: string,
  onUpdate: (campaign: FundingCampaign) => void,
  onNewContribution: (contribution: Contribution) => void
) => {
  const channel = supabase.channel('campaign_updates')
    // Listen for campaign updates
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'funding_campaigns',
        filter: `id=eq.${campaignId}`
      },
      (payload) => {
        onUpdate(payload.new as FundingCampaign);
      }
    )
    // Listen for new contributions
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'contributions',
        filter: `campaign_id=eq.${campaignId}`
      },
      (payload) => {
        onNewContribution(payload.new as Contribution);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
