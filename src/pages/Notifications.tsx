
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import NotificationItem from "@/components/notifications/NotificationItem";
import { Bell, Gift, Calendar, Heart, MessageSquare } from "lucide-react";

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll, addTestNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);
  
  // For development testing
  const handleAddTestNotification = () => {
    const types = ["connection", "gift", "wishlist", "event", "system"];
    const randomType = types[Math.floor(Math.random() * types.length)] as any;
    addTestNotification(randomType);
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` 
              : 'All caught up!'}
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
      </div>
      
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="all" className="flex gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Connections</span>
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Wishlists</span>
          </TabsTrigger>
          <TabsTrigger value="gift" className="flex gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Gifts</span>
          </TabsTrigger>
          <TabsTrigger value="event" className="flex gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="bg-white rounded-md shadow">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                />
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">No notifications</h3>
              <p className="text-sm">
                {activeTab === "all"
                  ? "You don't have any notifications yet"
                  : `You don't have any ${activeTab} notifications`}
              </p>
              
              {/* For development purposes only - remove in production */}
              <div className="mt-6 opacity-75">
                <Button variant="outline" onClick={handleAddTestNotification}>
                  Add test notification
                </Button>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Notifications;
