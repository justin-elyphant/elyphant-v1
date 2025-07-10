
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export type NotificationType = "connection" | "wishlist" | "gift" | "event" | "system" | "group_gift" | "group_invite" | "group_mention" | "group_vote";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
  actionText?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  addTestNotification: (type: NotificationType) => void;
  deleteNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  addNotification: () => {},
  addTestNotification: () => {},
  deleteNotification: () => {}
});

export const useNotifications = () => useContext(NotificationsContext);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

// Local storage key for persisting notifications
const NOTIFICATIONS_STORAGE_KEY = "elyphant_notifications";

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Load notifications from local storage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (error) {
        console.error("Failed to parse saved notifications:", error);
        localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      }
    }
  }, []);
  
  // Save notifications to local storage when they change
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    toast.success("All notifications marked as read");
  };
  
  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };
  
  // Delete a specific notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show a toast notification
    toast(notification.title, {
      description: notification.message,
      action: notification.link ? {
        label: notification.actionText || "View",
        onClick: () => window.open(notification.link, "_blank")
      } : undefined
    });
  };
  
  // Add a test notification (for development purposes)
  const addTestNotification = (type: NotificationType) => {
    const testNotifications: Record<NotificationType, Omit<Notification, "id" | "createdAt" | "read">> = {
      connection: {
        title: "New Connection Request",
        message: "Sarah Johnson wants to connect with you",
        type: "connection",
        link: "/connections",
        actionText: "View Request"
      },
      wishlist: {
        title: "Wishlist Updated",
        message: "Michael added 3 new items to his Birthday wishlist",
        type: "wishlist",
        link: "/wishlists/michael",
        actionText: "View Wishlist"
      },
      gift: {
        title: "Gift Purchased",
        message: "Your gift for Emily's birthday has been shipped",
        type: "gift",
        link: "/orders",
        actionText: "Track Order"
      },
      event: {
        title: "Upcoming Birthday",
        message: "Don't forget: David's birthday is in 5 days",
        type: "event",
        link: "/calendar",
        actionText: "View Calendar"
      },
      system: {
        title: "System Update",
        message: "We've added new features to your gifting experience",
        type: "system",
        link: "/whats-new",
        actionText: "Learn More"
      },
      group_gift: {
        title: "Group Gift Update",
        message: "The group gift for Sarah's birthday is ready to purchase!",
        type: "group_gift",
        link: "/group-chats",
        actionText: "View Project"
      },
      group_invite: {
        title: "Group Invitation",
        message: "You've been invited to join the Birthday Planning group",
        type: "group_invite",
        link: "/group-chats",
        actionText: "View Invitation"
      },
      group_mention: {
        title: "You were mentioned",
        message: "Alex mentioned you in the Holiday Party planning chat",
        type: "group_mention",
        link: "/group-chats",
        actionText: "View Message"
      },
      group_vote: {
        title: "Voting Required",
        message: "Please vote on the gift proposal for Tom's retirement",
        type: "group_vote",
        link: "/group-chats",
        actionText: "Vote Now"
      }
    };
    
    addNotification(testNotifications[type]);
  };
  
  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification,
        addTestNotification,
        deleteNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
