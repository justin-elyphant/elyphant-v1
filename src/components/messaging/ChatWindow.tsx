
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { type UnifiedMessage, type UserPresence } from "@/services/UnifiedMessagingService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ChatWindowProps {
  connectionId: string;
  connectionName: string;
  connectionImage?: string;
  messages: UnifiedMessage[];
  onSendMessage: (content: string) => Promise<UnifiedMessage | null>;
  onMarkAsRead: (messageIds: string[]) => Promise<void>;
  presence?: UserPresence | null;
  isTyping?: boolean;
  loading?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  connectionId,
  connectionName,
  connectionImage,
  messages,
  onSendMessage,
  onMarkAsRead,
  presence,
  isTyping = false,
  loading = false
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    const unreadMessages = messages.filter(msg => 
      !msg.is_read && msg.sender_id !== user?.id
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      onMarkAsRead(messageIds);
    }
  }, [messages, user?.id, onMarkAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    try {
      const sentMessage = await onSendMessage(newMessage.trim());
      
      if (sentMessage) {
        setNewMessage("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getMessageAlignment = (message: UnifiedMessage) => {
    return message.sender_id === user?.id ? "justify-end" : "justify-start";
  };

  const getMessageStyle = (message: UnifiedMessage) => {
    return message.sender_id === user?.id 
      ? "bg-primary text-primary-foreground" 
      : "bg-muted";
  };

  const shouldShowTimestamp = (message: UnifiedMessage, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
    
    // Show timestamp if more than 5 minutes apart or different sender
    return timeDiff > 5 * 60 * 1000 || prevMessage.sender_id !== message.sender_id;
  };

  const isConsecutiveMessage = (message: UnifiedMessage, index: number) => {
    if (index === 0) return false;
    
    const prevMessage = messages[index - 1];
    const timeDiff = new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime();
    
    // Group if less than 2 minutes apart and same sender
    return timeDiff < 2 * 60 * 1000 && prevMessage.sender_id === message.sender_id;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Compact Header */}
      <div className="flex-shrink-0 border-b bg-background p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={connectionImage} />
            <AvatarFallback className="text-xs">
              {connectionName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-sm truncate">{connectionName}</h2>
            <p className="text-xs text-muted-foreground">
              {presence ? (
                presence.status === 'online' ? 'Online' : 
                presence.status === 'away' ? 'Away' : 
                `Last seen ${formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}`
              ) : messages.length > 0 ? `${messages.length} messages` : "Start a conversation"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showTimestamp = shouldShowTimestamp(message, index);
              const isConsecutive = isConsecutiveMessage(message, index);

              return (
                <div key={message.id} className={`flex ${getMessageAlignment(message)}`}>
                  <div className={`max-w-[60%] ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}>
                    {showTimestamp && (
                      <div className={`text-xs text-muted-foreground text-center mb-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </div>
                    )}
                    
                    <div className={`px-2.5 py-1.5 rounded-2xl ${getMessageStyle(message)} ${
                      isOwn ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[60%] mt-2">
                  <div className="px-2.5 py-1.5 rounded-2xl bg-muted rounded-bl-md">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 border-t bg-background p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full"
            disabled={sending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="rounded-full h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
