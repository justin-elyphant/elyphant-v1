
import React from "react";
import { Link } from "react-router-dom";
import { Bell, X, Check, ExternalLink } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotifications, NotificationType } from "@/contexts/notifications/NotificationsContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  switch (type) {
    case "connection":
      return <div className="bg-blue-100 p-2 rounded-full"><Bell className="h-4 w-4 text-blue-500" /></div>;
    case "wishlist":
      return <div className="bg-purple-100 p-2 rounded-full"><Bell className="h-4 w-4 text-purple-500" /></div>;
    case "gift":
      return <div className="bg-green-100 p-2 rounded-full"><Bell className="h-4 w-4 text-green-500" /></div>;
    case "event":
      return <div className="bg-yellow-100 p-2 rounded-full"><Bell className="h-4 w-4 text-yellow-500" /></div>;
    case "system":
      return <div className="bg-gray-100 p-2 rounded-full"><Bell className="h-4 w-4 text-gray-500" /></div>;
    default:
      return <div className="bg-gray-100 p-2 rounded-full"><Bell className="h-4 w-4 text-gray-500" /></div>;
  }
};

export const NotificationsDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    deleteNotification 
  } = useNotifications();

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    
    if (link) {
      // This would be a navigation action in a real app
      console.log(`Navigate to: ${link}`);
    }
  };
  
  // Format relative time for notification
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHr / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return format(date, 'MMM d');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] bg-red-500"
              variant="destructive"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[350px] max-h-[70vh] overflow-auto" align="end">
        <DropdownMenuLabel className="font-normal flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-xs"
                onClick={clearAll}
              >
                Clear all
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto opacity-20 mb-2" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-0 focus:bg-transparent">
                <div 
                  className={cn(
                    "flex gap-3 p-3 py-4 w-full cursor-pointer",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                >
                  <NotificationIcon type={notification.type} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                    
                    {notification.link && (
                      <div className="mt-1 flex items-center text-xs text-blue-600">
                        <span className="mr-1">{notification.actionText || "View"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem asChild className="py-2 flex justify-center">
              <Link to="/notifications" className="text-sm text-center text-blue-600 w-full">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
