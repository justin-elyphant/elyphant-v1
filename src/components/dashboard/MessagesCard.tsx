
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { fetchMessages, Message } from "@/utils/messageService";

const MessagesCard = () => {
  const { user } = useAuth();
  const { connections } = useConnectionsAdapter();
  const [recentMessages, setRecentMessages] = useState<Array<{
    id: string;
    sender: string;
    avatar: string | null;
    message: string;
    time: string;
    unread: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const acceptedConnections = connections.filter(conn => 
    conn.type === 'friend' && !conn.isPending
  );

  useEffect(() => {
    const loadRecentMessages = async () => {
      if (!user || acceptedConnections.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const messagePromises = acceptedConnections.slice(0, 3).map(async (conn) => {
          const connMessages = await fetchMessages(conn.id);
          const lastMessage = connMessages.length > 0 ? connMessages[connMessages.length - 1] : null;
          
          if (lastMessage) {
            return {
              id: lastMessage.id,
              sender: conn.name,
              avatar: conn.imageUrl,
              message: lastMessage.content,
              time: new Date(lastMessage.created_at).toLocaleTimeString(),
              unread: !lastMessage.is_read && lastMessage.recipient_id === user.id
            };
          }
          return null;
        });

        const results = await Promise.all(messagePromises);
        const validMessages = results.filter(Boolean) as Array<{
          id: string;
          sender: string;
          avatar: string | null;
          message: string;
          time: string;
          unread: boolean;
        }>;

        setRecentMessages(validMessages);
      } catch (error) {
        console.error('Error loading recent messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentMessages();
  }, [user, acceptedConnections.length]);

  const unreadCount = recentMessages.filter(msg => msg.unread).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
              Messages
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Chat with friends about gifts and events
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/messages" className="flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">New</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {message.sender.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium truncate ${message.unread ? 'text-gray-900' : 'text-muted-foreground'}`}>
                        {message.sender}
                      </p>
                      <span className="text-xs text-muted-foreground">{message.time}</span>
                      {message.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${message.unread ? 'text-gray-700' : 'text-muted-foreground'}`}>
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h4 className="font-medium mb-2">No messages yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Start conversations about gifts and special occasions
              </p>
            </div>
          )}
          
          <Button className="w-full" asChild>
            <Link to="/messages">View All Messages</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagesCard;
