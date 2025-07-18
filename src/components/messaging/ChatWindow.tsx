
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Message, sendMessage, subscribeToMessages, markMessagesAsRead } from "@/utils/messageService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ChatWindowProps {
  connectionId: string;
  connectionName: string;
  connectionImage?: string;
  messages: Message[];
  onMessagesUpdate: (messages: Message[]) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  connectionId,
  connectionName,
  connectionImage,
  messages,
  onMessagesUpdate
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!connectionId || !user) return;

    const unsubscribe = subscribeToMessages(connectionId, (message: Message) => {
      onMessagesUpdate([...messages, message]);
    });

    return unsubscribe;
  }, [connectionId, user, messages, onMessagesUpdate]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    const unreadMessages = messages.filter(msg => 
      !msg.is_read && msg.recipient_id === user?.id
    );
    
    if (unreadMessages.length > 0) {
      markMessagesAsRead(unreadMessages.map(msg => msg.id));
    }
  }, [messages, user?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    try {
      const sentMessage = await sendMessage({
        recipientId: connectionId,
        content: newMessage.trim()
      });

      if (sentMessage) {
        onMessagesUpdate([...messages, sentMessage]);
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getMessageAlignment = (message: Message) => {
    return message.sender_id === user?.id ? "justify-end" : "justify-start";
  };

  const getMessageStyle = (message: Message) => {
    return message.sender_id === user?.id 
      ? "bg-primary text-primary-foreground" 
      : "bg-muted";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={connectionImage} />
            <AvatarFallback>
              {connectionName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{connectionName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {messages.length > 0 ? `${messages.length} messages` : "Start a conversation"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${getMessageAlignment(message)}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-lg ${getMessageStyle(message)}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatWindow;
