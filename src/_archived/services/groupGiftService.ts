import { supabase } from "@/integrations/supabase/client";

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
  stripe_group_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  contributions?: GroupGiftContribution[];
  coordinator?: {
    name: string;
    profile_image?: string;
  };
}

export interface GroupGiftContribution {
  id: string;
  group_gift_project_id: string;
  contributor_id: string;
  committed_amount: number;
  paid_amount: number;
  stripe_payment_intent_id?: string;
  contribution_status: 'committed' | 'paid' | 'refunded';
  payment_date?: string;
  created_at: string;
  updated_at: string;
  contributor?: {
    name: string;
    profile_image?: string;
  };
}

export interface CreateGroupGiftProjectParams {
  group_chat_id: string;
  project_name: string;
  target_amount: number;
  target_product_id?: string;
  target_product_name?: string;
  target_product_image?: string;
  target_product_price?: number;
  recipient_name?: string;
  recipient_id?: string;
  purchase_deadline?: string;
}

// Create a new group gift project
export const createGroupGiftProject = async (params: CreateGroupGiftProjectParams): Promise<GroupGiftProject | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_gift_projects')
      .insert({
        ...params,
        coordinator_id: user.id
      })
      .select(`
        *,
        coordinator:profiles!group_gift_projects_coordinator_id_fkey(name, profile_image)
      `)
      .single();


    if (error) throw error;
    // Normalize status to strict union
    const allowedStatuses = ['collecting','ready_to_purchase','purchased','shipped','delivered'];
    const normalized = data ? { 
      ...data,
      status: allowedStatuses.includes((data as any).status) ? (data as any).status : 'collecting'
    } : null;
    return normalized;
  } catch (error) {
    console.error('Error creating group gift project:', error);
    return null;
  }
};

// Get group gift projects for a group chat
export const getGroupGiftProjects = async (groupChatId: string): Promise<GroupGiftProject[]> => {
  try {
    const { data, error } = await supabase
      .from('group_gift_projects')
      .select(`
        *,
        coordinator:profiles!group_gift_projects_coordinator_id_fkey(name, profile_image),
        contributions:group_gift_contributions(
          *,
          contributor:profiles!group_gift_contributions_contributor_id_fkey(name, profile_image)
        )
      `)
      .eq('group_chat_id', groupChatId)
      .order('created_at', { ascending: false });


    if (error) throw error;
    const allowedStatuses = ['collecting','ready_to_purchase','purchased','shipped','delivered'];
    const normalized = (data || []).map((p: any) => ({
      ...p,
      status: allowedStatuses.includes(p?.status) ? p.status : 'collecting',
      contributions: Array.isArray(p?.contributions)
        ? p.contributions.map((c: any) => ({
            ...c,
            contribution_status: ['committed','paid','refunded'].includes(c?.contribution_status) ? c.contribution_status : 'committed'
          }))
        : []
    }));
    return normalized;
  } catch (error) {
    console.error('Error fetching group gift projects:', error);
    return [];
  }
};

// Add contribution to group gift project
export const addContribution = async (projectId: string, amount: number): Promise<GroupGiftContribution | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('group_gift_contributions')
      .insert({
        group_gift_project_id: projectId,
        contributor_id: user.id,
        committed_amount: amount
      })
      .select(`
        *,
        contributor:profiles!group_gift_contributions_contributor_id_fkey(name, profile_image)
      `)
      .single();


    if (error) throw error;

    // Update project's current amount
    await updateProjectAmount(projectId);

    // Normalize contribution status
    const normalized = data ? {
      ...data,
      contribution_status: ['committed','paid','refunded'].includes((data as any).contribution_status) ? (data as any).contribution_status : 'committed'
    } : null;

    return normalized;
  } catch (error) {
    console.error('Error adding contribution:', error);
    return null;
  }
};

// Update contribution amount
export const updateContribution = async (contributionId: string, newAmount: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('group_gift_contributions')
      .update({ committed_amount: newAmount })
      .eq('id', contributionId);

    if (error) throw error;

    // Get the project ID to update total
    const { data: contribution } = await supabase
      .from('group_gift_contributions')
      .select('group_gift_project_id')
      .eq('id', contributionId)
      .single();

    if (contribution) {
      await updateProjectAmount(contribution.group_gift_project_id);
    }

    return true;
  } catch (error) {
    console.error('Error updating contribution:', error);
    return false;
  }
};

// Mark contribution as paid
export const markContributionPaid = async (contributionId: string, stripePaymentIntentId: string): Promise<boolean> => {
  try {
    const { data: contribution, error: fetchError } = await supabase
      .from('group_gift_contributions')
      .select('committed_amount, group_gift_project_id')
      .eq('id', contributionId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('group_gift_contributions')
      .update({
        paid_amount: contribution.committed_amount,
        contribution_status: 'paid',
        stripe_payment_intent_id: stripePaymentIntentId,
        payment_date: new Date().toISOString()
      })
      .eq('id', contributionId);

    if (error) throw error;

    // Update project status if fully funded
    await checkAndUpdateProjectStatus(contribution.group_gift_project_id);

    return true;
  } catch (error) {
    console.error('Error marking contribution as paid:', error);
    return false;
  }
};

// Update project's current amount based on contributions
const updateProjectAmount = async (projectId: string): Promise<void> => {
  const { data: contributions } = await supabase
    .from('group_gift_contributions')
    .select('committed_amount')
    .eq('group_gift_project_id', projectId);

  const currentAmount = contributions?.reduce((sum, c) => sum + c.committed_amount, 0) || 0;

  await supabase
    .from('group_gift_projects')
    .update({ current_amount: currentAmount })
    .eq('id', projectId);
};

// Check if project is fully funded and update status
const checkAndUpdateProjectStatus = async (projectId: string): Promise<void> => {
  const { data: project } = await supabase
    .from('group_gift_projects')
    .select('target_amount, current_amount')
    .eq('id', projectId)
    .single();

  if (!project) return;

  // Check if all contributions are paid
  const { data: paidContributions } = await supabase
    .from('group_gift_contributions')
    .select('paid_amount')
    .eq('group_gift_project_id', projectId)
    .eq('contribution_status', 'paid');

  const totalPaid = paidContributions?.reduce((sum, c) => sum + c.paid_amount, 0) || 0;

  if (totalPaid >= project.target_amount) {
    await supabase
      .from('group_gift_projects')
      .update({ status: 'ready_to_purchase' })
      .eq('id', projectId);
  }
};

// Update project status
export const updateProjectStatus = async (projectId: string, status: GroupGiftProject['status'], orderId?: string): Promise<boolean> => {
  try {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (orderId) updates.order_id = orderId;

    const { error } = await supabase
      .from('group_gift_projects')
      .update(updates)
      .eq('id', projectId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating project status:', error);
    return false;
  }
};

// Get user's group gift contributions
export const getUserContributions = async (): Promise<GroupGiftContribution[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('group_gift_contributions')
      .select(`
        *,
        group_gift_project:group_gift_projects(
          project_name,
          target_amount,
          status,
          group_chat:group_chats(name)
        )
      `)
      .eq('contributor_id', user.id)
      .order('created_at', { ascending: false });


    if (error) throw error;
    const normalized = (data || []).map((c: any) => ({
      ...c,
      contribution_status: ['committed','paid','refunded'].includes(c?.contribution_status) ? c.contribution_status : 'committed'
    }));
    return normalized;
  } catch (error) {
    console.error('Error fetching user contributions:', error);
    return [];
  }
};

// Create tracking access for group gift contributors
export const setupGroupTrackingAccess = async (projectId: string, orderId: string): Promise<boolean> => {
  try {
    // Get all contributors for this project
    const { data: contributions, error: contributionsError } = await supabase
      .from('group_gift_contributions')
      .select('contributor_id')
      .eq('group_gift_project_id', projectId);

    if (contributionsError) throw contributionsError;

    // Get project coordinator
    const { data: project, error: projectError } = await supabase
      .from('group_gift_projects')
      .select('coordinator_id')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Create tracking access for all contributors and coordinator
    const trackingAccess = [];
    
    // Coordinator gets full access including delivery address
    trackingAccess.push({
      group_gift_project_id: projectId,
      user_id: project.coordinator_id,
      access_level: 'full',
      can_view_tracking: 'yes',
      can_view_delivery_address: true
    });

    // Contributors get full tracking but no delivery address
    contributions?.forEach(contribution => {
      if (contribution.contributor_id !== project.coordinator_id) {
        trackingAccess.push({
          group_gift_project_id: projectId,
          user_id: contribution.contributor_id,
          access_level: 'full',
          can_view_tracking: 'yes',
          can_view_delivery_address: false
        });
      }
    });

    const { error } = await supabase
      .from('group_gift_tracking_access')
      .insert(trackingAccess);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error setting up group tracking access:', error);
    return false;
  }
};

// Get user's tracking access for a project
export const getTrackingAccess = async (projectId: string): Promise<any> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('group_gift_tracking_access')
      .select('*')
      .eq('group_gift_project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching tracking access:', error);
    return null;
  }
};