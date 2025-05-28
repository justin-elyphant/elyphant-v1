import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConnections } from "@/hooks/profile/useConnections";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedChatInterface from "@/components/messaging/EnhancedChatInterface";
import MessageThread from "@/components/messaging/MessageThread";
import Header from "@/components/home/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Plus, Users } from "lucide-react";
import { useUserPresence } from "@/hooks/useUserPresence";

// Mock conversation data with additional IDs to ensure some match
const mockConversations = [
  {
    connectionName: 'Alex Johnson',
    lastMessage: "Thanks for the gift recommendation! I'll definitely check it out.",
    lastMessageTime: '2024-01-15T10:30:00Z',
    unreadCount: 2
  },
  {
    connectionName: 'Jamie Smith',
    lastMessage: "Hey! How was your weekend?",
    lastMessageTime: '2024-01-15T09:15:00Z',
    unreadCount: 0
  },
  {
    connectionName: 'Taylor Wilson',
    lastMessage: "Perfect! I added that item to my wishlist.",
    lastMessageTime: '2024-01-14T16:45:00Z',
    unreadCount: 1
  },
  {
    connectionName: 'Jordan Parks',
    lastMessage: "Looking forward to catching up soon!",
    lastMessageTime: '2024-01-14T14:20:00Z',
    unreadCount: 0
  },
  {
    connectionName: 'Casey Morgan',
    lastMessage: "Thanks for thinking of me! ❤️",
    lastMessageTime: '2024-01-13T11:10:00Z',
    unreadCount: 0
  },
  {
    connectionName: 'Sam Chen',
    lastMessage: "That gift idea is perfect for mom's birthday!",
    lastMessageTime: '2024-01-12T15:22:00Z',
    unreadCount: 3
  }
];

const Messages = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connections, loading } = useConnections();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(connectionId || null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create message threads - if no real connections, use mock data
  const messageThreads = connections.length > 0 
    ? connections.map((connection, index) => {
        const otherUser = connection.user_id === user?.id 
          ? { 
              id: connection.connected_user_id, 
              name: `User ${connection.connected_user_id.slice(0, 8)}` 
            }
          : { 
              id: connection.user_id, 
              name: `User ${connection.user_id.slice(0, 8)}` 
            };
        
        // Use mock conversation data for display
        const mockData = mockConversations[index % mockConversations.length];
        
        return {
          threadId: otherUser.id,
          connectionName: mockData.connectionName,
          lastMessage: mockData.lastMessage,
          lastMessageTime: mockData.lastMessageTime,
          unreadCount: mockData.unreadCount,
          relationshipType: connection.relationship_type,
          status: connection.status
        };
      })
    : // If no real connections, create mock threads for demo
      mockConversations.map((mock, index) => ({
        threadId: `mock-${index + 1}`,
        connectionName: mock.connectionName,
        lastMessage: mock.lastMessage,
        lastMessageTime: mock.lastMessageTime,
        unreadCount: mock.unreadCount,
        relationshipType: 'friend' as const,
        status: 'accepted' as const
      }));

  const filteredThreads = messageThreads.filter(thread =>
    thread.connectionName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    thread.status === 'accepted'
  );

  useEffect(() => {
    if (connectionId) {
      setSelectedConnection(connectionId);
    } else if (filteredThreads.length > 0 && !selectedConnection) {
      setSelectedConnection(filteredThreads[0].threadId);
      navigate(`/messages/${filteredThreads[0].threadId}`);
    }
  }, [connectionId, filteredThreads, navigate, selectedConnection]);

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Initialize presence tracking
  useUserPresence();

  const handleSelectConnection = (id: string) => {
    setSelectedConnection(id);
    navigate(`/messages/${id}`);
  };

  const selectedConnectionData = messageThreads.find(t => t.threadId === selectedConnection);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading connections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Button onClick={() => navigate('/connections')}>
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
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {searchTerm ? "No conversations found" : "No connections yet"}
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
                <EnhancedChatInterface 
                  connectionId={selectedConnection}
                  connectionName={selectedConnectionData.connectionName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Select a conversation from the sidebar to start chatting, or create a new message to connect with friends and family.
                  </p>
                  {filteredThreads.length === 0 && (
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
    </div>
  );
};

export default Messages;
