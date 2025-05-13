
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type NotificationType = 'connection' | 'wishlist' | 'gift' | 'event' | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  userId?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addTestNotification: (type: NotificationType) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  addTestNotification: () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Load notifications from localStorage initially
  useEffect(() => {
    if (user) {
      try {
        const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
        if (savedNotifications) {
          const parsedNotifications = JSON.parse(savedNotifications);
          setNotifications(parsedNotifications);
          setUnreadCount(parsedNotifications.filter((n: Notification) => !n.read).length);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);
  
  // Save notifications to localStorage when they change
  useEffect(() => {
    if (user && notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);
  
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      read: false,
      userId: user?.id
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show a toast for real-time feedback
    toast.info(notification.title, {
      description: notification.message,
    });
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };
  
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  };
  
  // For testing purposes
  const addTestNotification = (type: NotificationType) => {
    const typeMessages = {
      connection: { title: 'New Connection', message: 'Someone sent you a connection request' },
      wishlist: { title: 'Wishlist Updated', message: 'An item on your wishlist is now on sale!' },
      gift: { title: 'Gift Received', message: 'Someone sent you a gift' },
      event: { title: 'Upcoming Event', message: 'Don\'t forget about an upcoming birthday next week' },
      system: { title: 'System Update', message: 'We\'ve added new features to the app' }
    };
    
    addNotification({
      ...typeMessages[type],
      type
    });
  };
  
  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        addTestNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
