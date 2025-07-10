import React, { useState, useEffect } from "react";
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
import { Bell, Users, Gift, Heart, Settings } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GroupNotification {
  id: string;
  title: string;
  message: string;
  type: 'group_gift' | 'group_invite' | 'group_mention' | 'group_vote';
  read: boolean;
  createdAt: string;
  groupChatId?: string;
  groupName?: string;
  projectId?: string;
  link?: string;
  actionText?: string;
}

interface NotificationWithGroup extends GroupNotification {
  groupName?: string;
}

interface EnhancedNotificationCenterProps {
  className?: string;
}

const EnhancedNotificationCenter: React.FC<EnhancedNotificationCenterProps> = ({ className }) => {
  const { notifications, markAllAsRead, markAsRead, addNotification } = useNotifications();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [groupNotifications, setGroupNotifications] = useState<GroupNotification[]>([]);
  const [loading, setLoading] = useState(false);
  
  const totalUnreadCount = notifications.filter(n => !n.read).length + 
    groupNotifications.filter(n => !n.read).length;
  
  const groupUnreadCount = groupNotifications.filter(n => !n.read).length;
  const giftUnreadCount = notifications.filter(n => n.type === 'gift' && !n.read).length + 
    groupNotifications.filter(n => n.type === 'group_gift' && !n.read).length;
  const connectionUnreadCount = notifications.filter(n => n.type === 'connection' && !n.read).length +
    groupNotifications.filter(n => ['group_invite', 'group_mention'].includes(n.type) && !n.read).length;

  useEffect(() => {
    if (user && open) {
      fetchGroupNotifications();
    }
  }, [user, open]);

  const fetchGroupNotifications = async () => {
    setLoading(true);
    try {
      // Fetch group gift project updates
      const { data: projects, error: projectsError } = await supabase
        .from('group_gift_projects')
        .select(`
          *,
          group_chats(name),
          group_chat_members!inner(user_id)
        `)
        .eq('group_chat_members.user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (projectsError) throw projectsError;

      // Fetch group messages with mentions
      const { data: mentions, error: mentionsError } = await supabase
        .from('message_mentions')
        .select(`
          *,
          messages(
            content,
            created_at,
            group_chat_id,
            group_chats(name)
          )
        `)
        .eq('mentioned_user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (mentionsError) throw mentionsError;

      // Convert to notifications
      const notifications: GroupNotification[] = [];

      // Add project notifications
      projects?.forEach(project => {
        if (project.status === 'ready_to_purchase' && project.coordinator_id !== user?.id) {
          notifications.push({
            id: `project-${project.id}`,
            title: 'Group Gift Ready',
            message: `"${project.project_name}" in ${project.group_chats?.name} is ready to purchase!`,
            type: 'group_gift',
            read: false,
            createdAt: project.updated_at || '',
            groupChatId: project.group_chat_id,
            groupName: project.group_chats?.name,
            projectId: project.id,
            link: `/group-chats/${project.group_chat_id}`,
            actionText: 'View Project'
          });
        }
      });

      // Add mention notifications
      mentions?.forEach(mention => {
        notifications.push({
          id: `mention-${mention.id}`,
          title: 'You were mentioned',
          message: `In ${mention.messages?.group_chats?.name}: "${mention.messages?.content?.substring(0, 50)}..."`,
          type: 'group_mention',
          read: false,
          createdAt: mention.created_at || '',
          groupChatId: mention.messages?.group_chat_id,
          groupName: mention.messages?.group_chats?.name,
          link: `/group-chats/${mention.messages?.group_chat_id}`,
          actionText: 'View Message'
        });
      });

      setGroupNotifications(notifications);
    } catch (error) {
      console.error('Error fetching group notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && totalUnreadCount > 0) {
      markAllAsRead();
      // Mark group notifications as read
      setGroupNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markGroupNotificationAsRead = (id: string) => {
    setGroupNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const allGiftNotifications = [
    ...notifications.filter(n => n.type === 'gift'),
    ...groupNotifications.filter(n => n.type === 'group_gift')
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allConnectionNotifications = [
    ...notifications.filter(n => n.type === 'connection'),
    ...groupNotifications.filter(n => ['group_invite', 'group_mention'].includes(n.type))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative p-2 ${className}`}
          aria-label={`Notifications ${totalUnreadCount > 0 ? `(${totalUnreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] p-0 flex items-center justify-center text-xs"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Notifications</SheetTitle>
            {totalUnreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => {
                markAllAsRead();
                setGroupNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}>
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 px-4 pt-2">
            <TabsTrigger value="all" className="relative">
              All
              {totalUnreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                  {totalUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="relative">
              <Users className="h-3 w-3 mr-1" />
              Groups
              {groupUnreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                  {groupUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="gifts" className="relative">
              <Gift className="h-3 w-3 mr-1" />
              Gifts
              {giftUnreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                  {giftUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="social" className="relative">
              <Heart className="h-3 w-3 mr-1" />
              Social
              {connectionUnreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs px-1">
                  {connectionUnreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex-1 overflow-auto">
            {(notifications.length > 0 || groupNotifications.length > 0) ? (
              <div className="divide-y">
                {[...notifications, ...groupNotifications]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(notification => (
                    'type' in notification && ['group_gift', 'group_invite', 'group_mention', 'group_vote'].includes(notification.type) ? (
                      <div key={notification.id} className="p-4 hover:bg-muted/50 cursor-pointer"
                           onClick={() => {
                             markGroupNotificationAsRead(notification.id);
                             if (notification.link) window.open(notification.link, '_blank');
                           }}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" 
                               style={{ opacity: notification.read ? 0.3 : 1 }} />
                          <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              {'groupName' in notification && notification.groupName && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.groupName}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      'id' in notification && 'title' in notification && 'message' in notification && 'type' in notification && 'read' in notification && 'createdAt' in notification ? (
                        <NotificationItem
                          key={notification.id}
                          notification={notification as any}
                          onRead={() => markAsRead(notification.id)}
                        />
                       ) : (
                         <NotificationItem
                           key={notification.id}
                           notification={notification as any}
                           onRead={() => markAsRead(notification.id)}
                         />
                       )
                    )
                  ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <div>
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You're all caught up!</p>
                  <p className="text-sm mt-1">No new notifications.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="flex-1 overflow-auto">
            {groupNotifications.length > 0 ? (
              <div className="divide-y">
                {groupNotifications.map(notification => (
                  <div key={notification.id} className="p-4 hover:bg-muted/50 cursor-pointer"
                       onClick={() => {
                         markGroupNotificationAsRead(notification.id);
                         if (notification.link) window.open(notification.link, '_blank');
                       }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" 
                           style={{ opacity: notification.read ? 0.3 : 1 }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {notification.groupName && (
                            <Badge variant="outline" className="text-xs">
                              {notification.groupName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <div>
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No group notifications.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gifts" className="flex-1 overflow-auto">
            {allGiftNotifications.length > 0 ? (
              <div className="divide-y">
                {allGiftNotifications.map(notification => (
                  'type' in notification && notification.type === 'group_gift' ? (
                    <div key={notification.id} className="p-4 hover:bg-muted/50 cursor-pointer"
                         onClick={() => {
                           markGroupNotificationAsRead(notification.id);
                           if (notification.link) window.open(notification.link, '_blank');
                         }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" 
                             style={{ opacity: notification.read ? 0.3 : 1 }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              Group Gift
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    'id' in notification && 'title' in notification && 'message' in notification && 'type' in notification && 'read' in notification && 'createdAt' in notification ? (
                      <NotificationItem
                        key={notification.id}
                        notification={notification as any}
                        onRead={() => markAsRead(notification.id)}
                      />
                    ) : null
                  )
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <div>
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No gift notifications.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="social" className="flex-1 overflow-auto">
            {allConnectionNotifications.length > 0 ? (
              <div className="divide-y">
                {allConnectionNotifications.map(notification => (
                  'type' in notification && ['group_invite', 'group_mention'].includes(notification.type) ? (
                    <div key={notification.id} className="p-4 hover:bg-muted/50 cursor-pointer"
                         onClick={() => {
                           markGroupNotificationAsRead(notification.id);
                           if (notification.link) window.open(notification.link, '_blank');
                         }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" 
                             style={{ opacity: notification.read ? 0.3 : 1 }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {notification.type === 'group_mention' ? 'Mention' : 'Invite'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    'id' in notification && 'title' in notification && 'message' in notification && 'type' in notification && 'read' in notification && 'createdAt' in notification ? (
                      <NotificationItem
                        key={notification.id}
                        notification={notification as any}
                        onRead={() => markAsRead(notification.id)}
                      />
                    ) : null
                  )
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <div>
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No social notifications.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default EnhancedNotificationCenter;