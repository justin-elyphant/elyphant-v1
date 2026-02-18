import { supabase } from "@/integrations/supabase/client";
import { stripeClientManager } from "@/services/payment/StripeClientManager";

// Use centralized Stripe client manager
const stripePromise = stripeClientManager.getStripePromise();

export interface GroupGiftContribution {
  id: string;
  group_gift_project_id: string;
  contributor_id: string;
  committed_amount: number;
  paid_amount?: number;
  stripe_payment_intent_id?: string;
  contribution_status: 'pending' | 'committed' | 'paid' | 'refunded';
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupGiftProject {
  id: string;
  group_chat_id: string;
  project_name: string;
  target_product_id?: string;
  target_product_name?: string;
  target_product_image?: string;
  target_product_price?: number;
  target_amount: number;
  current_amount: number;
  coordinator_id: string;
  recipient_name?: string;
  recipient_id?: string;
  delivery_address?: any;
  purchase_deadline?: string;
  status: 'collecting' | 'ready_to_purchase' | 'purchased' | 'shipped' | 'delivered';
  order_id?: string;
  created_at: string;
  updated_at: string;
  group_gift_contributions?: GroupGiftContribution[];
}

// Create a group gift contribution payment
export const createGroupGiftContribution = async (
  groupGiftProjectId: string, 
  contributionAmount: number
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-group-gift-contribution', {
      body: {
        groupGiftProjectId,
        contributionAmount
      }
    });

    if (error) throw error;
    if (!data.clientSecret) throw new Error('No client secret received');

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId
    };
  } catch (error) {
    console.error('Error creating group gift contribution:', error);
    throw error;
  }
};

// Confirm a group gift contribution payment
export const confirmGroupGiftContribution = async (paymentIntentId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-group-gift-contribution', {
      body: { paymentIntentId }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error confirming group gift contribution:', error);
    throw error;
  }
};

// Process payment with Stripe Elements
export const processGroupGiftPayment = async (
  clientSecret: string,
  paymentMethod: any
) => {
  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe failed to initialize');

  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod
  });

  if (error) {
    throw new Error(error.message);
  }

  return paymentIntent;
};

// Get group gift project with contributions
export const getGroupGiftProject = async (projectId: string): Promise<GroupGiftProject | null> => {
  try {
    const { data, error } = await supabase
      .from('group_gift_projects')
      .select(`
        *,
        group_gift_contributions(
          *,
          profiles(name, profile_image)
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching group gift project:', error);
      return null;
    }

    return data as unknown as GroupGiftProject;
  } catch (error) {
    console.error('Error fetching group gift project:', error);
    return null;
  }
};

// Get user's group gift contributions
export const getUserGroupGiftContributions = async (userId: string): Promise<GroupGiftContribution[]> => {
  try {
    const { data, error } = await supabase
      .from('group_gift_contributions')
      .select(`
        *,
        group_gift_projects(project_name, target_amount, current_amount, status)
      `)
      .eq('contributor_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user contributions:', error);
      return [];
    }

    return (data as unknown as GroupGiftContribution[]) || [];
  } catch (error) {
    console.error('Error fetching user contributions:', error);
    return [];
  }
};

// Check if user can contribute to project
export const canUserContribute = async (
  userId: string, 
  groupGiftProjectId: string
): Promise<{ canContribute: boolean; reason?: string }> => {
  try {
    const project = await getGroupGiftProject(groupGiftProjectId);
    if (!project) {
      return { canContribute: false, reason: 'Project not found' };
    }

    if (project.status !== 'collecting') {
      return { canContribute: false, reason: 'Project is not accepting contributions' };
    }

    // Check if user is group member
    const { data: membership } = await supabase
      .from('group_chat_members')
      .select('*')
      .eq('group_chat_id', project.group_chat_id)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return { canContribute: false, reason: 'You are not a member of this group' };
    }

    // Check if user already contributed
    const existingContribution = project.group_gift_contributions?.find(
      c => c.contributor_id === userId && c.contribution_status === 'paid'
    );

    if (existingContribution) {
      return { canContribute: false, reason: 'You have already contributed to this project' };
    }

    // Check if funding deadline passed
    if (project.purchase_deadline && new Date(project.purchase_deadline) < new Date()) {
      return { canContribute: false, reason: 'Contribution deadline has passed' };
    }

    return { canContribute: true };
  } catch (error) {
    console.error('Error checking contribution eligibility:', error);
    return { canContribute: false, reason: 'Error checking eligibility' };
  }
};

// Calculate suggested contribution amounts
export const getSuggestedContributions = (
  targetAmount: number,
  currentAmount: number,
  memberCount: number
): number[] => {
  const remaining = Math.max(0, targetAmount - currentAmount);
  const evenSplit = Math.ceil(remaining / Math.max(1, memberCount - 1)); // Minus coordinator

  return [
    Math.max(5, Math.floor(evenSplit * 0.5)), // 50% of even split, min $5
    evenSplit, // Even split
    Math.min(remaining, Math.ceil(evenSplit * 1.5)), // 150% of even split
    Math.min(remaining, targetAmount * 0.25), // 25% of total target
  ].filter((amount, index, arr) => arr.indexOf(amount) === index) // Remove duplicates
   .sort((a, b) => a - b)
   .slice(0, 4); // Max 4 suggestions
};