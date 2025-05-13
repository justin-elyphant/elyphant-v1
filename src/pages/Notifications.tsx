
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  ChevronLeft, 
  Filter, 
  Trash2,
  Bell,
  User,
  Gift,
  Calendar,
  Settings
} from "lucide-react";
import { useNotifications, NotificationType } from "@/contexts/notifications/NotificationsContext";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearAll, 
    addTestNotification, 
    markAsRead,
    deleteNotification 
  } = useNotifications();
  
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    connectionRequests: true,
    wishlistUpdates: true,
    giftPurchases: true,
    upcomingEvents: true,
  });
  
  const notificationTypes: Record<string, { label: string, type?: NotificationType }> = {
    all: { label: "All" },
    connection: { label: "Connections", type: "connection" },
    wishlist: { label: "Wishlists", type: "wishlist" },
    gift: { label: "Gifts", type: "gift" },
    event: { label: "Events", type: "event" },
    system: { label: "System", type: "system" },
  };
  
  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(n => n.type === notificationTypes[activeTab].type);
  
  const handleMarkAsRead = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      // In a real app, we would navigate to the link
      console.log(`Navigate to: ${link}`);
    }
  };
  
  const saveSettings = () => {
    toast.success("Notification settings saved");
    setShowSettings(false);
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "connection":
        return <User className="h-5 w-5 text-blue-500" />;
      case "wishlist":
        return <Gift className="h-5 w-5 text-purple-500" />;
      case "gift":
        return <Gift className="h-5 w-5 text-green-500" />;
      case "event":
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "connection": return "bg-blue-100 text-blue-700";
      case "wishlist": return "bg-purple-100 text-purple-700";
      case "gift": return "bg-green-100 text-green-700";
      case "event": return "bg-yellow-100 text-yellow-700";
      case "system": return "bg-gray-100 text-gray-700";
    }
  };
  
  // Test notification types
  const testNotificationTypes: NotificationType[] = [
    'connection', 'wishlist', 'gift', 'event', 'system'
  ];
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hidden md:flex">
            <Link to="/dashboard">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(notificationTypes).map(([key, { label }]) => (
                <DropdownMenuItem 
                  key={key} 
                  onClick={() => setActiveTab(key)}
                  className={activeTab === key ? "bg-muted" : ""}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowSettings(!showSettings)}
            title="Notification Settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            {!isMobile && "Settings"}
          </Button>
          
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              onClick={markAllAsRead}
              title="Mark All as Read"
            >
              <Check className="h-4 w-4 mr-2" />
              {!isMobile && "Mark all read"}
            </Button>
          )}
          
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              onClick={clearAll}
              title="Clear All Notifications"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {!isMobile && "Clear all"}
            </Button>
          )}
        </div>
      </div>
      
      {showSettings ? (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Manage how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Delivery Methods</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, email: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notificationSettings.push}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, push: checked})
                    }
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="connection-notifications" className="font-medium">
                      Connection Requests
                    </Label>
                  </div>
                  <Switch
                    id="connection-notifications"
                    checked={notificationSettings.connectionRequests}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, connectionRequests: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-500" />
                    <Label htmlFor="wishlist-notifications" className="font-medium">
                      Wishlist Updates
                    </Label>
                  </div>
                  <Switch
                    id="wishlist-notifications"
                    checked={notificationSettings.wishlistUpdates}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, wishlistUpdates: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-500" />
                    <Label htmlFor="gift-notifications" className="font-medium">
                      Gift Purchases
                    </Label>
                  </div>
                  <Switch
                    id="gift-notifications"
                    checked={notificationSettings.giftPurchases}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, giftPurchases: checked})
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-500" />
                    <Label htmlFor="event-notifications" className="font-medium">
                      Upcoming Events
                    </Label>
                  </div>
                  <Switch
                    id="event-notifications"
                    checked={notificationSettings.upcomingEvents}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, upcomingEvents: checked})
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={saveSettings}>Save Changes</Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-6">
              {Object.entries(notificationTypes).map(([key, { label }]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No notifications</p>
              <p className="text-sm text-muted-foreground">
                You don't have any {activeTab !== "all" ? `${activeTab} ` : ""}notifications yet.
              </p>
              
              {/* Dev tools section for adding test notifications */}
              <div className="mt-8 p-4 border rounded-lg max-w-md mx-auto">
                <h3 className="font-medium mb-2">Developer Tools</h3>
                <p className="text-sm text-muted-foreground mb-3">Generate test notifications:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {testNotificationTypes.map(type => (
                    <Button 
                      key={type}
                      variant="outline" 
                      size="sm"
                      onClick={() => addTestNotification(type)}
                    >
                      Add {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`border rounded-lg p-4 ${!notification.read ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${getTypeColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <h3 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1">{notification.message}</p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-8"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          
                          {notification.link && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-8"
                            >
                              <Link to={notification.link}>
                                {notification.actionText || "View"}
                              </Link>
                            </Button>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
