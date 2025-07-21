
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import ChatWindow from "@/components/messaging/ChatWindow";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Message, fetchMessages } from "@/utils/messageService";

interface ConnectionInfo {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
}

const Chat = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !user) return;
    
    loadConnectionInfo();
    loadMessages();
  }, [userId, user]);

  const loadConnectionInfo = async () => {
    if (!userId) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, username, profile_image')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setConnection(profile);
    } catch (error) {
      console.error('Error loading connection info:', error);
    }
  };

  const loadMessages = async () => {
    if (!userId) return;

    try {
      const messageData = await fetchMessages(userId);
      setMessages(messageData);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessagesUpdate = (newMessages: Message[]) => {
    setMessages(newMessages);
  };

  if (!userId) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Invalid conversation</p>
        </div>
      </SidebarLayout>
    );
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </SidebarLayout>
    );
  }

  if (!connection) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Connection not found</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/messages">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">
              Chat with {connection.name || connection.username}
            </h1>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 p-4">
          <ChatWindow
            connectionId={userId}
            connectionName={connection.name || connection.username}
            connectionImage={connection.profile_image}
            messages={messages}
            onMessagesUpdate={handleMessagesUpdate}
          />
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Chat;
