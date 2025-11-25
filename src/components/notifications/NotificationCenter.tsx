
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import NotificationItem from "./NotificationItem";
import AutoGiftNotificationItem from "./AutoGiftNotificationItem";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Handle closing the notification center
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when closing the notification center
      markAllAsRead();
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative p-2 ${className}`}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 px-4 pt-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="auto-gifts">AI Gifting</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="gifts">Gifts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex-1 overflow-auto">
            {notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map(notification => {
                  // Use specialized auto-gift notification component
                  if (notification.type === 'auto_gift_approval' || 
                      notification.type === 'auto_gift_approved' || 
                      notification.type === 'auto_gift_failed') {
                    return (
                      <AutoGiftNotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={() => markAsRead(notification.id)}
                        onQuickApprove={notification.quickActions?.approve}
                        onReview={notification.quickActions?.review}
                      />
                    );
                  }
                  
                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <p>You're all caught up! No new notifications.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="auto-gifts" className="flex-1 overflow-auto">
            {notifications.filter(n => n.type.startsWith('auto_gift')).length > 0 ? (
              <div className="divide-y">
                {notifications
                  .filter(n => n.type.startsWith('auto_gift'))
                  .map(notification => (
                    <AutoGiftNotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onQuickApprove={notification.quickActions?.approve}
                      onReview={notification.quickActions?.review}
                    />
                  ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <p>No auto-gift notifications.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="connections" className="flex-1 overflow-auto">
            {notifications.filter(n => n.type === 'connection').length > 0 ? (
              <div className="divide-y">
                {notifications
                  .filter(n => n.type === 'connection')
                  .map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                    />
                  ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <p>No connection notifications.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="gifts" className="flex-1 overflow-auto">
            {notifications.filter(n => n.type === 'gift').length > 0 ? (
              <div className="divide-y">
                {notifications
                  .filter(n => n.type === 'gift')
                  .map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                    />
                  ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <p>No gift notifications.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
