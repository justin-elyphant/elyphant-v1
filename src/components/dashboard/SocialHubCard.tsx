import React from "react";
import { Link } from "react-router-dom";
import { Users, MessageSquare, UserPlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { Skeleton } from "@/components/ui/skeleton";

const SocialHubCard = () => {
  const { connections, loading } = useEnhancedConnections();

  // Enhanced: Filter and enrich connection data
  const friends = React.useMemo(() => {
    return connections
      .filter(conn => 
        conn.status === 'accepted' && 
        (conn.relationship_type === 'friend' || conn.relationship_type === 'follow')
      )
      .slice(0, 2); // Show only 2 friends to save space
  }, [connections]);

  // TODO: Replace with real messages data when implemented
  const recentMessages = [
    {
      id: '1',
      sender: 'Sarah Johnson',
      avatar: null,
      message: 'Thanks for the birthday gift suggestion!',
      time: '2h ago',
      unread: true,
      isGroup: false
    },
    {
      id: '2', 
      sender: 'Mike Chen',
      avatar: null,
      message: 'Hey, I updated my wishlist',
      time: '1d ago',
      unread: false,
      isGroup: false
    }
  ];

  // TODO: Replace with real group chats data when implemented
  const recentGroupChats = [
    {
      id: '3',
      name: 'Family Birthday Planning',
      avatar: null,
      message: 'Sarah: Perfect! Let\'s get that for mom',
      time: '30m ago',
      unread: true,
      memberCount: 4,
      isGroup: true
    }
  ];

  const allConversations = [...recentMessages, ...recentGroupChats];
  const unreadCount = allConversations.filter(conv => conv.unread).length;

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            Social Hub
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Your connections and conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Social Hub
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Your connections and conversations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Friends Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Friends ({connections.filter(c => c.status === 'accepted').length})
              </h4>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/connections" className="flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="text-xs">Find</span>
                </Link>
              </Button>
            </div>
            {friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((connection) => {
                  const connectedUserId = connection.user_id !== connection.connected_user_id 
                    ? (connection.user_id === connection.id ? connection.connected_user_id : connection.user_id)
                    : connection.connected_user_id;
                  
                  return (
                    <div key={connection.id} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={connection.profile_image} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {connection.profile_name?.substring(0, 2).toUpperCase() || 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {connection.profile_name || 'Unknown User'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/user/${connectedUserId}`} className="text-xs">View</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No friends yet</p>
            )}
          </div>

          {/* Messages & Groups Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">Recent Conversations</h4>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/messages?action=create-group" className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs">Group</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/messages" className="flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    <span className="text-xs">New</span>
                  </Link>
                </Button>
              </div>
            </div>
            {allConversations.length > 0 ? (
              <div className="space-y-2">
                {allConversations.slice(0, 3).map((conversation) => (
                  <div key={conversation.id} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {conversation.isGroup 
                            ? (conversation as any).name?.substring(0, 2).toUpperCase() || 'GR'
                            : (conversation as any).sender?.split(' ').map((n: string) => n[0]).join('') || 'UN'
                          }
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isGroup && (conversation as any).memberCount && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                          {(conversation as any).memberCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xs font-medium truncate ${conversation.unread ? 'text-gray-900' : 'text-muted-foreground'}`}>
                          {conversation.isGroup ? (conversation as any).name : (conversation as any).sender}
                        </p>
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                        {conversation.unread && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs truncate ${conversation.unread ? 'text-gray-700' : 'text-muted-foreground'}`}>
                        {conversation.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No conversations yet</p>
            )}
          </div>
          
          <Button className="w-full" asChild>
            <Link to="/messages">View All Conversations</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialHubCard;