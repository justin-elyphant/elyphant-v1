
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Users } from "lucide-react";
import { useConnections } from "@/hooks/profile/useConnections";
import { formatDistanceToNow } from "date-fns";

// Mock recent messages data
const mockRecentMessages = [
  {
    id: "1",
    connectionName: "Alex Johnson",
    lastMessage: "Thanks for the gift recommendation!",
    lastMessageTime: new Date(Date.now() - 1800000), // 30 minutes ago
    unreadCount: 2,
    isOnline: true
  },
  {
    id: "2", 
    connectionName: "Jamie Smith",
    lastMessage: "How was your weekend?",
    lastMessageTime: new Date(Date.now() - 3600000), // 1 hour ago
    unreadCount: 0,
    isOnline: false
  },
  {
    id: "3",
    connectionName: "Taylor Wilson", 
    lastMessage: "Perfect! Added to my wishlist.",
    lastMessageTime: new Date(Date.now() - 7200000), // 2 hours ago
    unreadCount: 1,
    isOnline: true
  }
];

const MessagesCard = () => {
  const { connections, loading } = useConnections();
  
  const totalUnread = mockRecentMessages.reduce((sum, msg) => sum + msg.unreadCount, 0);
  const activeConnections = connections.filter(conn => conn.status === 'accepted');

  return (
    <Card className="h-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Messages</CardTitle>
            {totalUnread > 0 && (
              <Badge variant="default" className="bg-red-500 text-white">
                {totalUnread}
              </Badge>
            )}
          </div>
          <Button size="sm" asChild>
            <Link to="/messages">
              <Send className="h-4 w-4 mr-1" />
              View All
            </Link>
          </Button>
        </div>
        <CardDescription>
          Recent conversations with your connections
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        ) : mockRecentMessages.length > 0 ? (
          <>
            <div className="space-y-2">
              {mockRecentMessages.slice(0, 3).map((message) => {
                const initials = message.connectionName
                  .split(' ')
                  .map(name => name[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={message.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-purple-100 text-purple-800 text-sm font-medium">
                          {initials}
                        </AvatarFallback>
                        <AvatarImage src="" alt={message.connectionName} />
                      </Avatar>
                      {message.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{message.connectionName}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(message.lastMessageTime, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{message.lastMessage}</p>
                    </div>
                    
                    {message.unreadCount > 0 && (
                      <Badge variant="default" className="bg-primary text-primary-foreground min-w-[20px] h-5 text-xs flex-shrink-0">
                        {message.unreadCount}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{activeConnections.length} connections</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/messages">
                    Start Conversation
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No Messages Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 px-2">
              Connect with friends and family to start messaging
            </p>
            <div className="space-y-2">
              <Button size="sm" asChild>
                <Link to="/connections">
                  <Users className="h-4 w-4 mr-2" />
                  Find Connections
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessagesCard;
