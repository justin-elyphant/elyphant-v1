
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { formatDistanceToNow } from "date-fns";

interface ConversationItem {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    try {
      // Get all messages involving the current user
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          sender_id,
          recipient_id,
          content,
          created_at,
          is_read
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation partner
      const conversationMap = new Map<string, ConversationItem>();

      for (const message of messages || []) {
        const partnerId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          // Get partner's profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, username, profile_image')
            .eq('id', partnerId)
            .single();

          conversationMap.set(partnerId, {
            userId: partnerId,
            userName: profile?.name || profile?.username || 'Unknown User',
            userAvatar: profile?.profile_image || undefined,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: 0,
            isOnline: false
          });
        }

        // Count unread messages
        if (message.recipient_id === user?.id && !message.is_read) {
          const conversation = conversationMap.get(partnerId)!;
          conversation.unreadCount += 1;
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Chat with your connections</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <Card key={conversation.userId} className="hover:bg-muted/50 transition-colors">
                <Link to={`/messages/${conversation.userId}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.userAvatar} />
                          <AvatarFallback>
                            {conversation.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">{conversation.userName}</h3>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="bg-primary text-primary-foreground min-w-[20px] h-5 text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-6">
                Start chatting with your connections to see conversations here.
              </p>
              <Button asChild>
                <Link to="/connections">
                  <Users className="h-4 w-4 mr-2" />
                  View Connections
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Messages;
