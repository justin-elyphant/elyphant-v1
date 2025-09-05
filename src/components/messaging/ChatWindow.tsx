
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { type UnifiedMessage, type UserPresence } from "@/services/UnifiedMessagingService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SecurityStatus } from "@/components/security/SecurityStatus";
import { useSecurityRateLimit } from "@/hooks/useSecurityRateLimit";

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
  const { checkRateLimit, logSecurityEvent, rateLimitStatus } = useSecurityRateLimit();
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

    // Enhanced security checks
    if (rateLimitStatus.isLimited) {
      logSecurityEvent('blocked_message_attempt', { 
        userId: user.id, 
        reason: 'rate_limited',
        attemptedContent: newMessage.substring(0, 50) + '...' 
      });
      toast.error("Rate limit exceeded. Please wait before sending more messages.");
      return;
    }

    // Check database rate limit before sending
    const canSend = await checkRateLimit(user.id);
    if (!canSend) {
      return; // Rate limit check will show appropriate error
    }

    setSending(true);
    try {
      const sentMessage = await onSendMessage(newMessage.trim());
      
      if (sentMessage) {
        setNewMessage("");
        logSecurityEvent('message_sent', { 
          userId: user.id, 
          messageId: sentMessage.id,
          contentLength: newMessage.length 
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      logSecurityEvent('message_send_failed', { 
        userId: user.id, 
        error: error instanceof Error ? error.message : 'unknown' 
      });
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
      {/* Fixed Chat Header */}
      <div className="flex-shrink-0 border-b bg-background p-4 fixed top-[80px] left-0 right-0 md:sticky md:top-[80px] z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/messages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={connectionImage} />
            <AvatarFallback>
              {connectionName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">{connectionName}</h1>
            <p className="text-sm text-muted-foreground">
              {presence ? (
                presence.status === 'online' ? 'Online' : 
                presence.status === 'away' ? 'Away' : 
                `Last seen ${formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}`
              ) : messages.length > 0 ? `${messages.length} messages` : "Start a conversation"}
            </p>
          </div>
        </div>
      </div>

      {/* Security Status */}
      {user && (
        <div className="flex-shrink-0 border-b">
          <div className="px-3 py-2">
            <SecurityStatus userId={user.id} />
          </div>
        </div>
      )}

      {/* Messages Area - Takes remaining height */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 pb-24 pt-20 md:pt-4 md:pb-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Sort messages chronologically (oldest first) for proper display order */}
              {[...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((message, index, sortedMessages) => {
                const isOwn = message.sender_id === user?.id;
                const showTimestamp = shouldShowTimestamp(message, index);
                const isConsecutive = isConsecutiveMessage(message, index);

                return (
                  <div key={message.id} className={`flex ${getMessageAlignment(message)}`}>
                    <div className={`max-w-[70%] ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}>
                      {showTimestamp && (
                        <div className={`text-xs text-muted-foreground text-center mb-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </div>
                      )}
                      
                      <div className={`px-3 py-2 rounded-2xl ${getMessageStyle(message)} ${
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
                  <div className="max-w-[70%] mt-2">
                    <div className="px-3 py-2 rounded-2xl bg-muted rounded-bl-md">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Auto-scroll target */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Message Input */}
      <div className="flex-shrink-0 border-t bg-background p-4 fixed bottom-[60px] left-0 right-0 md:sticky md:bottom-0 z-40">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={rateLimitStatus.isLimited ? "Rate limit exceeded..." : "Type a message..."}
            className="flex-1 rounded-full"
            disabled={sending || rateLimitStatus.isLimited}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || sending || rateLimitStatus.isLimited}
            className="rounded-full h-10 w-10"
          >
            {rateLimitStatus.isLimited ? <Shield className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
