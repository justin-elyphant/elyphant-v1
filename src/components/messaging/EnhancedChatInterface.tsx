import React, { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  Gift
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDirectMessaging, useUnifiedPresence } from "@/hooks/useUnifiedMessaging";
import type { UnifiedMessage } from "@/services/UnifiedMessagingService";
import { useAuth } from "@/contexts/auth";
import TypingIndicator from "./TypingIndicator";
import ChatGiftModal from "./ChatGiftModal";
import FileAttachment from "./FileAttachment";
import AttachmentDisplay from "./AttachmentDisplay";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const [newMessage, setNewMessage] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesStartRef = useRef<HTMLDivElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  
  // Use unified messaging hooks
  const { 
    messages, 
    loading, 
    hasMore,
    sendMessage: sendUnifiedMessage, 
    loadMoreMessages,
    addReaction, 
    markAsRead,
    presence,
    isTyping: otherUserTyping,
    startTyping,
    stopTyping,
    isOnline
  } = useDirectMessaging(connectionId);
  
  const { getUserStatus, subscribeToUserPresence } = useUnifiedPresence();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const userStatus = getUserStatus(connectionId);

  // Handle gift thank you context from URL
  useEffect(() => {
    const giftContext = searchParams.get('context');
    const giftorName = searchParams.get('giftor');
    const orderNumber = searchParams.get('order');

    if (giftContext === 'gift_thankyou' && giftorName && !messages.length) {
      const thankYouMessage = `Hi ${giftorName}! Thank you so much for the thoughtful gift${orderNumber ? ` (Order #${orderNumber})` : ''}! I'm so excited to receive it! 🎁❤️`;
      setNewMessage(thankYouMessage);
      
      toast.info(`Message pre-filled! Edit and send your thank you to ${giftorName} ✨`);
    }
  }, [searchParams, messages.length]);

  // Set up intersection observer for automatic infinite scroll
  useEffect(() => {
    if (!messagesStartRef.current || !hasMore) return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMoreMessages();
        }
      },
      { threshold: 0.1 }
    );

    intersectionObserverRef.current.observe(messagesStartRef.current);

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [hasMore, loadMoreMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile)) return;

    const messageContent = newMessage.trim() || (selectedFile ? `📎 ${selectedFile.name}` : "");
    setNewMessage("");
    setUploading(!!selectedFile);

    // Stop typing indicator
    await stopTyping();

    try {
      await sendUnifiedMessage({
        content: messageContent,
        attachment: selectedFile || undefined
      });
      
      setSelectedFile(null);
      setUploadProgress(0);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setUploading(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value.trim()) {
      await startTyping();
    } else {
      await stopTyping();
    }
  };

  const handleSendGift = async (giftData: any) => {
    try {
      const giftMessage = `🎁 ${giftData.itemName}${giftData.message ? ` - ${giftData.message}` : ''}`;
      
      await sendUnifiedMessage({
        content: giftMessage,
        messageType: 'gift',
        ...(giftData.type === 'wishlist' && { wishlistLinkId: giftData.itemId }),
        ...(giftData.type === 'marketplace' && { productLinkId: parseInt(giftData.itemId) })
      });

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending gift:", error);
      toast.error("Failed to send gift");
    }
  };

  // Subscribe to user presence
  useEffect(() => {
    const unsubscribePresence = subscribeToUserPresence(connectionId);
    return unsubscribePresence;
  }, [connectionId, subscribeToUserPresence]);

  // Mark messages as read when they come in
  useEffect(() => {
    const unreadMessageIds = messages
      .filter(msg => !msg.is_read && msg.recipient_id === user?.id)
      .map(msg => msg.id);
    
    if (unreadMessageIds.length > 0) {
      markAsRead(unreadMessageIds);
    }
  }, [messages, user?.id, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

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
    <div className="flex flex-col h-full bg-background">
      {/* Enhanced Chat Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted/20 min-h-[60px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={connectionImage} alt={connectionName} />
              <AvatarFallback className="bg-purple-100 text-purple-800 font-medium text-sm">
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
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{connectionName}</h3>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Badge variant="secondary" className={cn("text-xs hidden sm:inline-flex", relationshipBadgeColor)}>
                {relationshipType}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {userStatus.status === "online" ? "Online" : 
                 userStatus.status === "away" ? "Away" : 
                 userStatus.lastSeen ? `Last seen ${formatDistanceToNow(new Date(userStatus.lastSeen), { addSuffix: true })}` : 
                 "Offline"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation hidden sm:flex">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation hidden sm:flex">
            <Video className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0 touch-manipulation"
            onClick={() => setShowGiftModal(true)}
          >
            <Gift className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 touch-manipulation">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area with Infinite Scroll */}
      <ScrollArea className="flex-1 p-2 sm:p-4">
        <div className="space-y-2 sm:space-y-4">
          {/* Infinite scroll trigger - invisible div at top */}
          {hasMore && (
            <div 
              ref={messagesStartRef} 
              className="h-4 flex items-center justify-center"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                Loading more...
              </div>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Start your conversation with {connectionName}</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = user && message.sender_id === user.id;
              const showTimestamp = index === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 minutes
              
              return (
                <div key={message.id} className={cn("flex gap-2 sm:gap-3", isCurrentUser && "flex-row-reverse")}>
                  {!isCurrentUser && (
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mt-1 flex-shrink-0">
                      <AvatarImage src={connectionImage} alt={connectionName} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn("flex flex-col max-w-[85%] sm:max-w-[70%]", isCurrentUser && "items-end")}>
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
                        
                        {/* File attachments */}
                        {message.attachment_url && message.attachment_type && message.attachment_name && (
                          <div className="mt-2">
                            <AttachmentDisplay
                              attachmentUrl={message.attachment_url}
                              attachmentType={message.attachment_type}
                              attachmentName={message.attachment_name}
                            />
                          </div>
                        )}
                        
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
                                className="h-6 px-2 text-xs cursor-pointer hover:bg-secondary/80 touch-manipulation"
                                onClick={() => handleReaction(message.id, emoji)}
                              >
                                {emoji} {Array.isArray(users) ? users.length : 0}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      
                      {/* Quick reaction buttons - Mobile optimized */}
                      <div className={cn(
                        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 p-1 bg-background border rounded-md shadow-sm z-10",
                        isCurrentUser ? "-left-16" : "-right-16"
                      )}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-xs touch-manipulation"
                          onClick={() => handleReaction(message.id, "👍")}
                        >
                          👍
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-xs touch-manipulation"
                          onClick={() => handleReaction(message.id, "❤️")}
                        >
                          ❤️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-xs touch-manipulation"
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
      <div className="p-2 sm:p-4 border-t bg-background">
        {/* File attachment preview */}
        {selectedFile && (
          <div className="mb-2">
            <FileAttachment
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onFileRemove={() => setSelectedFile(null)}
              uploading={uploading}
              uploadProgress={uploadProgress}
              disabled={false}
            />
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message ${connectionName}...`}
              className="pr-20 resize-none min-h-[48px] sm:min-h-[44px] touch-manipulation text-base sm:text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <FileAttachment
                onFileSelect={setSelectedFile}
                onFileRemove={() => setSelectedFile(null)}
                selectedFile={selectedFile}
                uploading={uploading}
                uploadProgress={uploadProgress}
                disabled={false}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 touch-manipulation"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={(!newMessage.trim() && !selectedFile)}
            className="h-12 w-12 sm:h-11 sm:w-11 p-0 touch-manipulation"
          >
            <Send className="h-5 w-5 sm:h-4 sm:w-4" />
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