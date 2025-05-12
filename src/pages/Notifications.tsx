
import React from "react";
import { Button } from "@/components/ui/button";
import { useNotifications, NotificationType } from "@/contexts/notifications/NotificationsContext";

const NotificationsPage = () => {
  const { notifications, unreadCount, markAllAsRead, clearAll, addTestNotification } = useNotifications();
  
  const notificationTypes: NotificationType[] = [
    'connection', 'wishlist', 'gift', 'event', 'system'
  ];

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
          <Button 
            variant="outline" 
            onClick={clearAll}
            disabled={notifications.length === 0}
          >
            Clear all
          </Button>
        </div>
      </div>
      
      {/* Debug section for developers */}
      <div className="bg-slate-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-medium mb-2">Developer Tools</h2>
        <div className="flex flex-wrap gap-2">
          {notificationTypes.map(type => (
            <Button 
              key={type}
              variant="outline" 
              size="sm"
              onClick={() => addTestNotification(type)}
            >
              Add {type} notification
            </Button>
          ))}
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-white">
          <p className="text-muted-foreground">You don't have any notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 border rounded-lg ${!notification.read ? 'bg-blue-50' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-muted-foreground">{notification.message}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
