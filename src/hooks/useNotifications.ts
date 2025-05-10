
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";

export type NotificationType = 'connection' | 'gift' | 'wishlist' | 'event' | 'system';

export interface NotificationUser {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface NotificationAction {
  label: string;
  link: string;
}

export interface Notification {
  id: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: NotificationType;
  user?: NotificationUser;
  action?: NotificationAction;
}

// Mock notifications for now
const getMockNotifications = (): Notification[] => [
  {
    id: '1',
    content: '<b>Alex Johnson</b> sent you a friend request',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    isRead: false,
    type: 'connection',
    user: {
      id: '123',
      name: 'Alex Johnson'
    },
    action: {
      label: 'Accept',
      link: '/connections'
    }
  },
  {
    id: '2',
    content: '<b>Jamie Smith</b> liked your wishlist',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isRead: true,
    type: 'wishlist',
    user: {
      id: '456',
      name: 'Jamie Smith'
    },
    action: {
      label: 'View',
      link: '/wishlists'
    }
  },
  {
    id: '3',
    content: 'Your order has been shipped!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    type: 'system',
    action: {
      label: 'Track',
      link: '/orders'
    }
  },
  {
    id: '4',
    content: '<b>Birthday reminder:</b> Taylor Wilson\'s birthday is next week',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    isRead: false,
    type: 'event'
  },
  {
    id: '5',
    content: '<b>Taylor Wilson</b> purchased a gift from your wishlist',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    isRead: false,
    type: 'gift',
    user: {
      id: '789',
      name: 'Taylor Wilson'
    }
  }
];

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // In a real app, this would be an API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For now, use mock data
        const mockNotifications = getMockNotifications();
        
        // Load read status from localStorage
        const readNotifications = JSON.parse(localStorage.getItem("readNotifications") || "{}");
        
        const updatedNotifications = mockNotifications.map(notification => ({
          ...notification,
          isRead: readNotifications[notification.id] === true || notification.isRead
        }));
        
        setNotifications(updatedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchNotifications();
    }
  }, [user]);
  
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
    
    // Update localStorage
    const readNotifications = JSON.parse(localStorage.getItem("readNotifications") || "{}");
    readNotifications[id] = true;
    localStorage.setItem("readNotifications", JSON.stringify(readNotifications));
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    // Update localStorage
    const readNotifications = {};
    notifications.forEach(n => {
      readNotifications[n.id] = true;
    });
    localStorage.setItem("readNotifications", JSON.stringify(readNotifications));
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead
  };
};
