
import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { UserPlus, Gift, Bell, Heart, Calendar } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onRead 
}) => {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead();
    }
    
    // Additional logic if needed for navigation or actions
  };
  
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'connection':
        return <UserPlus className="h-5 w-5 text-blue-600" />;
      case 'gift':
        return <Gift className="h-5 w-5 text-purple-600" />;
      case 'wishlist':
        return <Heart className="h-5 w-5 text-rose-600" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-amber-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div 
      className={cn(
        "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
        !notification.isRead && "bg-blue-50"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {notification.user ? (
          <Avatar>
            <AvatarImage src={notification.user.imageUrl} />
            <AvatarFallback>{notification.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getNotificationIcon()}
          </div>
        )}
        
        <div className="flex-1">
          <div 
            className={cn(
              "text-sm",
              !notification.isRead && "font-medium"
            )}
            dangerouslySetInnerHTML={{ __html: notification.content }}
          />
          
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </span>
            
            {notification.action && (
              <Link 
                to={notification.action.link} 
                className="text-xs font-medium text-primary hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                {notification.action.label}
              </Link>
            )}
          </div>
        </div>
        
        {!notification.isRead && (
          <div className="h-2 w-2 rounded-full bg-blue-500 self-start mt-2" />
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
