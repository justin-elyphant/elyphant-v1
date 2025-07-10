import React, { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  Heart,
  ThumbsUp,
  Gift
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  fetchMessages, 
  sendMessage, 
  markMessagesAsRead, 
  subscribeToMessages,
  addMessageReaction,
  removeMessageReaction,
  setTypingStatus,
  subscribeToTyping,
  type Message 
} from "@/utils/enhancedMessageService";
import { useEnhancedPresence } from "@/hooks/useEnhancedPresence";
import { useAuth } from "@/contexts/auth";
import TypingIndicator from "./TypingIndicator";
import ChatGiftModal from "./ChatGiftModal";
import { toast } from "sonner";

interface EnhancedChatInterfaceProps {
  connectionId: string;
  connectionName: string;
  connectionImage?: string;
  relationshipType?: string;
}

const EnhancedChatInterface = ({ 
  connectionId, 
  connectionName,
  connectionImage,
  relationshipType = 'friend'
}: EnhancedChatInterfaceProps) => {
  const { user } = useAuth();
  const { getUserStatus, subscribeToUserPresence } = useEnhancedPresence();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const userStatus = getUserStatus(connectionId);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMessages = await fetchMessages(connectionId);
      setMessages(fetchedMessages);
      
      // Mark unread messages as read
      const unreadMessageIds = fetchedMessages
        .filter(msg => !msg.is_read && msg.recipient_id === user?.id)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        await markMessagesAsRead(unreadMessageIds);
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [connectionId, scrollToBottom, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Clear typing status
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    setIsTyping(false);
    await setTypingStatus(connectionId, false);

    try {
      const sentMessage = await sendMessage({
        recipientId: connectionId,
        content: messageContent
      });

      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const message = messages.find(m => m.id === messageId);
      const hasReacted = message?.reactions[emoji]?.includes(user.id);

      if (hasReacted) {
        await removeMessageReaction(messageId, emoji);
      } else {
        await addMessageReaction(messageId, emoji);
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      await setTypingStatus(connectionId, true);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to clear typing status
    const timeout = setTimeout(async () => {
      setIsTyping(false);
      await setTypingStatus(connectionId, false);
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleSendGift = async (giftData: any) => {
    try {
      const giftMessage = `🎁 ${giftData.itemName}${giftData.message ? ` - ${giftData.message}` : ''}`;
      
      const sentMessage = await sendMessage({
        recipientId: connectionId,
        content: giftMessage,
        messageType: 'gift',
        ...(giftData.type === 'wishlist' && { wishlistLinkId: giftData.itemId }),
        ...(giftData.type === 'marketplace' && { productLinkId: parseInt(giftData.itemId) })
      });

      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error sending gift:", error);
      toast.error("Failed to send gift");
    }
  };

  useEffect(() => {
    if (!user) return;

    loadMessages();
    
    // Set up real-time subscriptions
    const unsubscribeMessages = subscribeToMessages(
      user.id,
      connectionId,
      (newMessage: Message) => {
        setMessages(prev => [...prev, newMessage]);
        setTimeout(scrollToBottom, 100);
        
        // Mark message as read if chat is active
        if (newMessage.recipient_id === user.id) {
          markMessagesAsRead([newMessage.id]);
        }
      },
      (updatedMessage: Message) => {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ));
      }
    );

    // Subscribe to typing indicators
    const unsubscribeTyping = subscribeToTyping(
      user.id,
      connectionId,
      (typing: boolean) => {
        setOtherUserTyping(typing);
      }
    );

    // Subscribe to user presence
    const unsubscribePresence = subscribeToUserPresence(connectionId);

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
      unsubscribePresence();
      
      // Clear typing status on unmount
      if (isTyping) {
        setTypingStatus(connectionId, false);
      }
    };
  }, [connectionId, loadMessages, scrollToBottom, user, isTyping, subscribeToUserPresence]);

  const initials = connectionName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const relationshipBadgeColor = relationshipType === 'spouse' ? 'bg-pink-100 text-pink-800' :
                                relationshipType === 'family' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={connectionImage} alt={connectionName} />
              <AvatarFallback className="bg-purple-100 text-purple-800 font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            {userStatus.status === 'online' && (
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
            {userStatus.status === 'away' && (
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-yellow-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{connectionName}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-xs", relationshipBadgeColor)}>
                {relationshipType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {userStatus.status === "online" ? "Online" : 
                 userStatus.status === "away" ? "Away" : 
                 userStatus.lastSeen ? `Last seen ${formatDistanceToNow(new Date(userStatus.lastSeen), { addSuffix: true })}` : 
                 "Offline"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setShowGiftModal(true)}
          >
            <Gift className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Start your conversation with {connectionName}</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.sender_id === "current-user";
              const showTimestamp = index === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 minutes

              return (
                <div key={message.id} className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}>
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={connectionImage} alt={connectionName} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn("flex flex-col max-w-[70%]", isCurrentUser && "items-end")}>
                    {showTimestamp && (
                      <span className="text-xs text-muted-foreground mb-1 px-2">
                        {format(new Date(message.created_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                    
                    <Card className={cn(
                      "relative group",
                      isCurrentUser 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted",
                      message.message_type === 'gift' && "border-2 border-purple-200"
                    )}>
                      <CardContent className="p-3">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        
                        {/* Delivery status for current user messages */}
                        {isCurrentUser && (
                          <div className="flex items-center justify-end mt-1">
                            <span className="text-xs opacity-70">
                              {message.delivery_status === 'read' && '✓✓'}
                              {message.delivery_status === 'delivered' && '✓✓'}
                              {message.delivery_status === 'sent' && '✓'}
                              {message.delivery_status === 'sending' && '⏳'}
                            </span>
                          </div>
                        )}
                        
                        {/* Message reactions */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              <Button
                                key={emoji}
                                variant="secondary"
                                size="sm"
                                className="h-6 px-2 text-xs cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleReaction(message.id, emoji)}
                              >
                                {emoji} {Array.isArray(users) ? users.length : 0}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      
                      {/* Quick reaction buttons */}
                      <div className={cn(
                        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 p-1 bg-background border rounded-md shadow-sm z-10",
                        isCurrentUser ? "-left-16" : "-right-16"
                      )}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-xs"
                          onClick={() => handleReaction(message.id, "👍")}
                        >
                          👍
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-xs"
                          onClick={() => handleReaction(message.id, "❤️")}
                        >
                          ❤️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-xs"
                          onClick={() => handleReaction(message.id, "😂")}
                        >
                          😂
                        </Button>
                      </div>
                    </Card>
                    
                    <span className="text-xs text-muted-foreground mt-1 px-2">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing indicator */}
          {otherUserTyping && (
            <TypingIndicator userName={connectionName} />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message ${connectionName}...`}
              className="pr-20 resize-none"
              disabled={sending}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Gift Modal */}
      <ChatGiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        recipientName={connectionName}
        recipientId={connectionId}
        onSendGift={handleSendGift}
      />
    </div>
  );
};

export default EnhancedChatInterface;
