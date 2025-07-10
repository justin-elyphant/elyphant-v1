import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Package, Truck, CheckCircle2, Users, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

interface TrackingNotification {
  id: string;
  type: 'shipped' | 'in_transit' | 'delivered' | 'delayed';
  title: string;
  message: string;
  orderId: string;
  projectId?: string;
  projectName?: string;
  contributors?: Array<{
    id: string;
    name: string;
    profile_image?: string;
  }>;
  created_at: string;
  is_read: boolean;
}

interface GroupTrackingNotificationsProps {
  onNotificationRead?: (notificationId: string) => void;
  onNotificationDismiss?: (notificationId: string) => void;
}

const GroupTrackingNotifications = ({ 
  onNotificationRead, 
  onNotificationDismiss 
}: GroupTrackingNotificationsProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TrackingNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Demo notifications
  const demoNotifications: TrackingNotification[] = [
    {
      id: '1',
      type: 'shipped',
      title: 'Group Gift Shipped!',
      message: 'Your group gift "Premium Bluetooth Headphones" for Sarah has been shipped and is on its way.',
      orderId: 'ORD-GRP-12345',
      projectId: 'proj-1',
      projectName: 'Sarah\'s Birthday Gift',
      contributors: [
        { id: '1', name: 'Mike Chen' },
        { id: '2', name: 'Emma Davis' },
        { id: '3', name: 'Alex Kumar' }
      ],
      created_at: '2025-01-10T08:30:00Z',
      is_read: false
    },
    {
      id: '2',
      type: 'in_transit',
      title: 'Package in Transit',
      message: 'Your group gift is currently in transit and expected to arrive by January 15th.',
      orderId: 'ORD-GRP-12345',
      projectId: 'proj-1',
      projectName: 'Sarah\'s Birthday Gift',
      contributors: [
        { id: '1', name: 'Mike Chen' },
        { id: '2', name: 'Emma Davis' }
      ],
      created_at: '2025-01-09T15:45:00Z',
      is_read: true
    },
    {
      id: '3',
      type: 'delivered',
      title: 'Gift Delivered Successfully!',
      message: 'Great news! Your group gift "Coffee Maker" for Mom has been delivered successfully.',
      orderId: 'ORD-GRP-67890',
      projectId: 'proj-2',
      projectName: 'Mom\'s Holiday Gift',
      contributors: [
        { id: '4', name: 'John Smith' },
        { id: '5', name: 'Lisa Wong' }
      ],
      created_at: '2025-01-08T12:20:00Z',
      is_read: false
    }
  ];

  useEffect(() => {
    // In a real app, fetch from database
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setNotifications(demoNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      onNotificationRead?.(notificationId);
      
      // In real app, update database
      // await supabase
      //   .from('tracking_notifications')
      //   .update({ is_read: true })
      //   .eq('id', notificationId);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      onNotificationDismiss?.(notificationId);
      
      // In real app, delete from database or mark as dismissed
      
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shipped':
        return <Package className="h-5 w-5" />;
      case 'in_transit':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'in_transit':
        return 'text-yellow-600 bg-yellow-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'delayed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No Tracking Updates</h3>
        <p className="text-sm text-muted-foreground">
          You'll see notifications here when there are updates on your group gifts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={cn(
            "relative transition-all hover:shadow-md",
            !notification.is_read && "border-l-4 border-l-primary bg-primary/5"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  getNotificationColor(notification.type)
                )}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    {!notification.is_read && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  {notification.projectName && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {notification.projectName}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleDismiss(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notification.contributors && (
                  <div className="flex -space-x-2">
                    {notification.contributors.slice(0, 3).map((contributor) => (
                      <Avatar key={contributor.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={contributor.profile_image} alt={contributor.name} />
                        <AvatarFallback className="text-xs">
                          {contributor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {notification.contributors.length > 3 && (
                      <div className="h-6 w-6 border-2 border-background rounded-full bg-muted text-xs flex items-center justify-center">
                        +{notification.contributors.length - 3}
                      </div>
                    )}
                  </div>
                )}
                
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/orders/${notification.orderId}`, '_blank')}
                >
                  View Order
                </Button>
                
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GroupTrackingNotifications;