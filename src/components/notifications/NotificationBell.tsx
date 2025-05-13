
import React, { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/notifications/NotificationsContext';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-1 h-9 w-9">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <Badge 
                className="absolute top-0 right-0 h-4 min-w-[1rem] px-1 text-[10px] flex items-center justify-center bg-red-500"
                variant="destructive"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto text-xs hover:bg-transparent hover:underline p-0"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                  </div>
                </DropdownMenuItem>
              ))}
              
              {notifications.length > 5 && (
                <div className="p-2 text-center">
                  <Link 
                    to="/notifications" 
                    className="text-xs text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    View all {notifications.length} notifications
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t text-center">
          <Link 
            to="/notifications" 
            className="text-xs text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            Manage notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
