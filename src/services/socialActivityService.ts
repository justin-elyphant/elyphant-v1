
import { supabase } from "@/integrations/supabase/client";

export interface SocialActivity {
  id: string;
  type: 'connection' | 'wishlist' | 'message' | 'address' | 'gift_search';
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  metadata?: Record<string, any>;
}

export class SocialActivityService {
  static async getRecentActivities(userId: string, limit: number = 10): Promise<SocialActivity[]> {
    try {
      const activities: SocialActivity[] = [];

      // Get recent connections (both directions)
      const { data: connections } = await supabase
        .from('user_connections')
        .select(`
          id, status, created_at, relationship_type,
          user_id, connected_user_id,
          user_profile:profiles!user_connections_user_id_fkey(name, profile_image),
          connected_profile:profiles!user_connections_connected_user_id_fkey(name, profile_image)
        `)
        .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(5);

      connections?.forEach(conn => {
        const isInitiator = conn.user_id === userId;
        const otherUser = isInitiator ? conn.connected_profile : conn.user_profile;
        const otherUserId = isInitiator ? conn.connected_user_id : conn.user_id;
        
        if (otherUser) {
          activities.push({
            id: `connection-${conn.id}`,
            type: 'connection',
            title: isInitiator ? 'You connected with' : 'Connected with you',
            description: `${otherUser.name} ${isInitiator ? 'accepted your connection' : 'sent you a connection request'}`,
            timestamp: conn.created_at,
            user: {
              id: otherUserId,
              name: otherUser.name,
              image: otherUser.profile_image
            },
            metadata: { relationship_type: conn.relationship_type }
          });
        }
      });

      // Get recent wishlist updates from connected users
      const { data: connectedUserIds } = await supabase
        .from('user_connections')
        .select('user_id, connected_user_id')
        .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
        .eq('status', 'accepted');

      const friendIds = new Set<string>();
      connectedUserIds?.forEach(conn => {
        if (conn.user_id !== userId) friendIds.add(conn.user_id);
        if (conn.connected_user_id !== userId) friendIds.add(conn.connected_user_id);
      });

      if (friendIds.size > 0) {
        const { data: wishlists } = await supabase
          .from('wishlists')
          .select(`
            id, title, updated_at, user_id,
            profiles:user_id(name, profile_image)
          `)
          .in('user_id', Array.from(friendIds))
          .order('updated_at', { ascending: false })
          .limit(5);

        wishlists?.forEach(wishlist => {
          if (wishlist.profiles) {
            activities.push({
              id: `wishlist-${wishlist.id}`,
              type: 'wishlist',
              title: 'Updated wishlist',
              description: `${wishlist.profiles.name} updated "${wishlist.title}"`,
              timestamp: wishlist.updated_at,
              user: {
                id: wishlist.user_id,
                name: wishlist.profiles.name,
                image: wishlist.profiles.profile_image
              }
            });
          }
        });
      }

      // Get recent messages from connected users
      if (friendIds.size > 0) {
        const { data: messages } = await supabase
          .from('messages')
          .select(`
            id, content, created_at, sender_id,
            sender:profiles!messages_sender_id_fkey(name, profile_image)
          `)
          .or(`sender_id.in.(${Array.from(friendIds).join(',')}),recipient_id.eq.${userId}`)
          .neq('sender_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);

        messages?.forEach(message => {
          if (message.sender) {
            activities.push({
              id: `message-${message.id}`,
              type: 'message',
              title: 'Sent a message',
              description: `${message.sender.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
              timestamp: message.created_at,
              user: {
                id: message.sender_id,
                name: message.sender.name,
                image: message.sender.profile_image
              }
            });
          }
        });
      }

      // Get recent address requests
      const { data: addressRequests } = await supabase
        .from('address_requests')
        .select(`
          id, created_at, requester_id, recipient_id, status,
          requester:profiles!address_requests_requester_id_fkey(name, profile_image),
          recipient:profiles!address_requests_recipient_id_fkey(name, profile_image)
        `)
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'fulfilled')
        .order('created_at', { ascending: false })
        .limit(3);

      addressRequests?.forEach(request => {
        const isRequester = request.requester_id === userId;
        const otherUser = isRequester ? request.recipient : request.requester;
        const otherUserId = isRequester ? request.recipient_id : request.requester_id;
        
        if (otherUser) {
          activities.push({
            id: `address-${request.id}`,
            type: 'address',
            title: isRequester ? 'Shared address with you' : 'You shared address with',
            description: `Address sharing with ${otherUser.name}`,
            timestamp: request.created_at,
            user: {
              id: otherUserId,
              name: otherUser.name,
              image: otherUser.profile_image
            }
          });
        }
      });

      // Sort all activities by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return activities.slice(0, limit);

    } catch (error) {
      console.error('Error fetching social activities:', error);
      return [];
    }
  }

  static async getConnectionStats(userId: string) {
    try {
      const { data: connections } = await supabase
        .from('user_connections')
        .select('id, status')
        .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);

      const accepted = connections?.filter(c => c.status === 'accepted').length || 0;
      const pending = connections?.filter(c => c.status === 'pending').length || 0;

      return { accepted, pending, total: connections?.length || 0 };
    } catch (error) {
      console.error('Error fetching connection stats:', error);
      return { accepted: 0, pending: 0, total: 0 };
    }
  }
}
