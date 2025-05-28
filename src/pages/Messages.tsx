import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConnections } from "@/hooks/useConnections";
import { useAuth } from "@/contexts/AuthContext";
import ChatInterface from "@/components/messaging/ChatInterface";
import MessageThread from "@/components/messaging/MessageThread";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Plus } from "lucide-react";

const Messages = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connections, filteredConnections } = useConnections();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(connectionId || null);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock message threads data - in real app this would come from API
  const mockThreads = filteredConnections.map(connection => ({
    threadId: connection.id,
    connectionName: connection.name,
    lastMessage: "Hey! How are you doing?",
    lastMessageTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    unreadCount: Math.floor(Math.random() * 5),
  }));

  const filteredThreads = mockThreads.filter(thread =>
    thread.connectionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If we have a connectionId in the URL, use that
  useEffect(() => {
    if (connectionId) {
      setSelectedConnection(connectionId);
    } else if (filteredConnections.length > 0 && !selectedConnection) {
      // If no connection is selected but we have connections, select the first one
      setSelectedConnection(filteredConnections[0].id);
      navigate(`/messages/${filteredConnections[0].id}`);
    }
  }, [connectionId, filteredConnections, navigate, selectedConnection]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  const handleSelectConnection = (id: string) => {
    setSelectedConnection(id);
    navigate(`/messages/${id}`);
  };

  const selectedConnectionData = filteredConnections.find(c => c.id === selectedConnection);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Enhanced Threads Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <CardDescription>Recent chats with your connections</CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-4 pt-0">
                {filteredThreads.length > 0 ? (
                  filteredThreads.map((thread) => (
                    <MessageThread
                      key={thread.threadId}
                      threadId={thread.threadId}
                      connectionName={thread.connectionName}
                      lastMessage={thread.lastMessage}
                      lastMessageTime={thread.lastMessageTime}
                      unreadCount={thread.unreadCount}
                      isActive={selectedConnection === thread.threadId}
                      onClick={() => handleSelectConnection(thread.threadId)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "No conversations found" : "No conversations yet"}
                    </p>
                    {!searchTerm && (
                      <Button 
                        variant="link" 
                        onClick={() => navigate('/connections')}
                        className="mt-2"
                      >
                        Find connections
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Enhanced Chat Area */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0 h-full">
            {selectedConnection && selectedConnectionData ? (
              <ChatInterface 
                connectionId={selectedConnection}
                connectionName={selectedConnectionData.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Select a conversation from the sidebar to start chatting, or create a new message to connect with friends and family.
                </p>
                {filteredConnections.length === 0 && (
                  <Button onClick={() => navigate('/connections')}>
                    Find connections
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
