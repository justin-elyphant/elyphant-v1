
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Bell, Gift, Calendar, Heart, MessageSquare } from "lucide-react";
import { Notification } from "@/contexts/notifications/NotificationsContext";

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification,
  onRead 
}) => {
  // Convert the notification type to an appropriate icon
  const getIcon = () => {
    switch (notification.type) {
      case 'connection':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'gift':
        return <Gift className="h-4 w-4 text-purple-500" />;
      case 'wishlist':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'system':
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format the timestamp to relative time (e.g., "5 minutes ago")
  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true 
  });

  return (
    <div 
      className={`p-4 border-b last:border-b-0 transition-colors ${
        notification.read ? 'bg-white' : 'bg-blue-50'
      }`}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
          
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{formattedTime}</span>
            
            {notification.link && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = notification.link!;
                }}
              >
                {notification.actionText || "View"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
