
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConnectionsAdapter } from "@/hooks/useConnectionsAdapter";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedChatInterface from "@/components/messaging/EnhancedChatInterface";
import MessageThread from "@/components/messaging/MessageThread";
import StreamlinedMessageSystem from "@/components/messaging/StreamlinedMessageSystem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Plus, Users } from "lucide-react";
import { useUserPresence } from "@/hooks/useUserPresence";
import CreateGroupModal from "@/components/messaging/CreateGroupModal";
import { getUserGroupChats } from "@/services/groupChatService";
import { useQuery } from "@tanstack/react-query";

// Mock conversation data for demo purposes - this will be enhanced with real message data
const mockConversations = [
  {
    lastMessage: "Thanks for the gift recommendation! I'll definitely check it out.",
    lastMessageTime: '2024-01-15T10:30:00Z',
    unreadCount: 2
  },
  {
    lastMessage: "Hey! How was your weekend?",
    lastMessageTime: '2024-01-15T09:15:00Z',
    unreadCount: 0
  },
  {
    lastMessage: "Perfect! I added that item to my wishlist.",
    lastMessageTime: '2024-01-14T16:45:00Z',
    unreadCount: 1
  },
  {
    lastMessage: "Looking forward to catching up soon!",
    lastMessageTime: '2024-01-14T14:20:00Z',
    unreadCount: 0
  },
  {
    lastMessage: "Thanks for thinking of me! ❤️",
    lastMessageTime: '2024-01-13T11:10:00Z',
    unreadCount: 0
  },
  {
    lastMessage: "That gift idea is perfect for mom's birthday!",
    lastMessageTime: '2024-01-12T15:22:00Z',
    unreadCount: 3
  }
];

const Messages = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    connections, 
    friends, 
    following, 
    loading 
  } = useConnectionsAdapter();
  
  const [selectedConnection, setSelectedConnection] = useState<string | null>(connectionId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [conversationType, setConversationType] = useState<'all' | 'direct' | 'groups'>('all');

  // Get group chats for current user
  const { data: groupChats = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['group-chats', user?.id],
    queryFn: () => user ? getUserGroupChats() : [],
    enabled: !!user
  });

  // Create message threads from real connection data
  const allConnections = [...friends, ...following].filter(conn => 
    conn.type === 'friend' || conn.type === 'following'
  );

  // Direct message threads
  const directMessageThreads = allConnections.length > 0
    ? allConnections.map((connection, index) => {
        // Use mock data for message content until we implement real messaging
        const mockData = mockConversations[index % mockConversations.length];
        
        return {
          threadId: connection.id,
          connectionName: connection.name,
          connectionImage: connection.imageUrl,
          connectionUsername: connection.username,
          lastMessage: mockData.lastMessage,
          lastMessageTime: mockData.lastMessageTime,
          unreadCount: mockData.unreadCount,
          relationshipType: connection.relationship,
          status: connection.type === 'friend' ? 'accepted' : 'following',
          mutualFriends: connection.mutualFriends,
          type: 'direct' as const
        };
      })
    : // Fallback to mock data for demo if no real connections
      mockConversations.map((mock, index) => ({
        threadId: `mock-${index + 1}`,
        connectionName: `Demo User ${index + 1}`,
        connectionImage: '/placeholder.svg',
        connectionUsername: `@demo${index + 1}`,
        lastMessage: mock.lastMessage,
        lastMessageTime: mock.lastMessageTime,
        unreadCount: mock.unreadCount,
        relationshipType: 'friend' as const,
        status: 'accepted' as const,
        mutualFriends: Math.floor(Math.random() * 5),
        type: 'direct' as const
      }));

  // Group chat threads
  const groupThreads = groupChats.map(group => ({
    threadId: group.id,
    connectionName: group.name,
    connectionImage: group.avatar_url,
    connectionUsername: `${group.member_count || 0} members`,
    lastMessage: 'Group conversation',
    lastMessageTime: group.updated_at,
    unreadCount: 0,
    relationshipType: 'group' as const,
    status: 'active' as const,
    mutualFriends: 0,
    type: 'group' as const,
    memberCount: group.member_count || 0
  }));

  // Combine all threads
  const allThreads = [...directMessageThreads, ...groupThreads];
  
  // Filter based on conversation type
  const messageThreads = allThreads.filter(thread => {
    if (conversationType === 'direct') return thread.type === 'direct';
    if (conversationType === 'groups') return thread.type === 'group';
    return true; // 'all'
  });

  const filteredThreads = messageThreads.filter(thread =>
    thread.connectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.connectionUsername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check URL params for create group action
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'create-group') {
      setShowCreateGroup(true);
      // Clean up URL
      window.history.replaceState({}, '', '/messages');
    }
  }, []);

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

  // Show streamlined interface if no specific conversation selected
  if (!connectionId) {
    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <StreamlinedMessageSystem />
        </div>
    );
  }

  if (loading || groupsLoading) {
    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateGroup(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              New Group
            </Button>
            <Button onClick={() => navigate('/connections')}>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Enhanced Threads Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <CardDescription>Recent chats with your connections</CardDescription>
              
              {/* Conversation type filter */}
              <div className="flex gap-1 mb-3">
                <Button
                  variant={conversationType === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setConversationType('all')}
                >
                  All ({allThreads.length})
                </Button>
                <Button
                  variant={conversationType === 'direct' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setConversationType('direct')}
                >
                  Direct ({directMessageThreads.length})
                </Button>
                <Button
                  variant={conversationType === 'groups' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setConversationType('groups')}
                >
                  Groups ({groupThreads.length})
                </Button>
              </div>
              
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
                      <div key={thread.threadId} className="relative">
                        <MessageThread
                          threadId={thread.threadId}
                          connectionName={thread.connectionName}
                          connectionImage={thread.connectionImage}
                          connectionUsername={thread.connectionUsername}
                          lastMessage={thread.lastMessage}
                          lastMessageTime={thread.lastMessageTime}
                          unreadCount={thread.unreadCount}
                          isActive={selectedConnection === thread.threadId}
                          mutualFriends={thread.mutualFriends}
                          onClick={() => handleSelectConnection(thread.threadId)}
                        />
                        {thread.type === 'group' && thread.memberCount && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {thread.memberCount}
                          </div>
                        )}
                      </div>
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
                selectedConnectionData.type === 'group' ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Group chat interface coming soon...</p>
                  </div>
                ) : (
                  <EnhancedChatInterface 
                    connectionId={selectedConnection}
                    connectionName={selectedConnectionData.connectionName}
                    connectionImage={selectedConnectionData.connectionImage}
                    relationshipType={selectedConnectionData.relationshipType}
                  />
                )
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
        
        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(groupId) => {
            setShowCreateGroup(false);
            navigate(`/messages/${groupId}`);
          }}
          connections={friends.filter(f => f.type === 'friend')}
        />
      </div>
  );
};

export default Messages;
