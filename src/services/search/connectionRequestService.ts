
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConnectionRequest {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  relationship_type: string;
  created_at: string;
  requester_profile?: {
    name: string;
    username: string;
    profile_image?: string;
    bio?: string;
  };
  recipient_profile?: {
    name: string;
    username: string;
    profile_image?: string;
    bio?: string;
  };
}

export const getIncomingConnectionRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        *,
        requester_profile:profiles!user_connections_user_id_fkey(name, username, profile_image, bio)
      `)
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching incoming connection requests:', error);
    return [];
  }
};

export const getOutgoingConnectionRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        *,
        recipient_profile:profiles!user_connections_connected_user_id_fkey(name, username, profile_image, bio)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching outgoing connection requests:', error);
    return [];
  }
};

export const acceptConnectionRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_connections')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) throw error;
    
    toast.success("Connection request accepted!");
    return { success: true };
  } catch (error) {
    console.error('Error accepting connection request:', error);
    toast.error("Failed to accept connection request");
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const rejectConnectionRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_connections')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw error;
    
    toast.success("Connection request declined");
    return { success: true };
  } catch (error) {
    console.error('Error rejecting connection request:', error);
    toast.error("Failed to reject connection request");
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
