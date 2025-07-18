
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Plus, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import MessageThread from "@/components/messaging/MessageThread";
import ChatWindow from "@/components/messaging/ChatWindow";
import { fetchMessages, Message } from "@/utils/messageService";
import { Link } from "react-router-dom";

const Messages = () => {
  const { user } = useAuth();
  const { connections } = useConnectionsAdapter();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);

  // Get accepted connections only
  const acceptedConnections = connections.filter(conn => 
    conn.type === 'friend' && !conn.isPending
  );

  const filteredConnections = acceptedConnections.filter(conn =>
    conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const loadMessages = async () => {
      if (!user || acceptedConnections.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const messagePromises = acceptedConnections.map(async (conn) => {
          const connMessages = await fetchMessages(conn.id);
          return { connectionId: conn.id, messages: connMessages };
        });

        const results = await Promise.all(messagePromises);
        const messagesMap: { [key: string]: Message[] } = {};
        
        results.forEach(({ connectionId, messages: connMessages }) => {
          messagesMap[connectionId] = connMessages;
        });

        setMessages(messagesMap);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [user, acceptedConnections.length]);

  const getLastMessage = (connectionId: string) => {
    const connMessages = messages[connectionId] || [];
    return connMessages.length > 0 ? connMessages[connMessages.length - 1] : null;
  };

  const getUnreadCount = (connectionId: string) => {
    const connMessages = messages[connectionId] || [];
    return connMessages.filter(msg => !msg.is_read && msg.recipient_id === user?.id).length;
  };

  const selectedConnectionData = acceptedConnections.find(conn => conn.id === selectedConnection);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Connections List */}
        <div className="md:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {acceptedConnections.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No connections yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with friends to start messaging
                  </p>
                  <Button asChild>
                    <Link to="/connections">Find Friends</Link>
                  </Button>
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No conversations found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConnections.map((connection) => {
                    const lastMessage = getLastMessage(connection.id);
                    return (
                      <MessageThread
                        key={connection.id}
                        threadId={connection.id}
                        connectionName={connection.name}
                        connectionImage={connection.imageUrl}
                        connectionUsername={connection.username}
                        lastMessage={lastMessage?.content || "No messages yet"}
                        lastMessageTime={lastMessage?.created_at || new Date().toISOString()}
                        unreadCount={getUnreadCount(connection.id)}
                        isActive={selectedConnection === connection.id}
                        mutualFriends={connection.mutualFriends}
                        onClick={() => setSelectedConnection(connection.id)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2">
          {selectedConnection && selectedConnectionData ? (
            <ChatWindow
              connectionId={selectedConnection}
              connectionName={selectedConnectionData.name}
              connectionImage={selectedConnectionData.imageUrl}
              messages={messages[selectedConnection] || []}
              onMessagesUpdate={(newMessages) => {
                setMessages(prev => ({
                  ...prev,
                  [selectedConnection]: newMessages
                }));
              }}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a connection from the list to start messaging
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
