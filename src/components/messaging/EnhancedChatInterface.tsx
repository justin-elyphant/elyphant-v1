import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, MoreVertical, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMessages, sendMessage, subscribeToMessages, Message } from "@/utils/messageService";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import MessageSearch from "./MessageSearch";
import ProductShareButton from "./ProductShareButton";
import WishlistShareButton from "./WishlistShareButton";
import AttachmentButton from "./AttachmentButton";
import ReplyPreview from "./ReplyPreview";
import ConnectionStatusIndicator from "./ConnectionStatusIndicator";
import { toast } from "sonner";
import { useUserPresence } from "@/hooks/useUserPresence";

interface EnhancedChatInterfaceProps {
  connectionId: string;
  connectionName: string;
}

const EnhancedChatInterface = ({ connectionId, connectionName }: EnhancedChatInterfaceProps) => {
  const { user } = useAuth();
  const { getUserStatus } = useUserPresence();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get real-time status for the connection
  const connectionStatus = getUserStatus(connectionId);

  useEffect(() => {
    const loadMessages = async () => {
      const fetchedMessages = await fetchMessages(connectionId);
      setMessages(fetchedMessages);
    };
    
    loadMessages();
    
    const unsubscribe = subscribeToMessages(connectionId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });
    
    return unsubscribe;
  }, [connectionId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage;
    setNewMessage("");
    
    await sendMessage({
      recipientId: connectionId,
      content: messageContent,
      replyToId: replyingTo?.id
    });
    
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleReact = (messageId: string, emoji: string) => {
    toast.success("Reaction added!");
  };

  const handleSearchResultClick = (messageId: string) => {
    // Scroll to the message with the given ID
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAttachFile = (type: "file" | "image" | "camera") => {
    toast.success("Attachment feature coming soon!");
  };

  const handleShareProduct = (product: any) => {
    toast.success("Product sharing coming soon!");
  };

  const handleShareWishlist = (wishlist: any) => {
    toast.success("Wishlist sharing coming soon!");
  };

  const connectionInitials = connectionName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-purple-100 text-purple-800 font-medium">
              {connectionInitials}
            </AvatarFallback>
            <AvatarImage src="" alt={connectionName} />
          </Avatar>
          <div>
            <h3 className="font-semibold">{connectionName}</h3>
            <ConnectionStatusIndicator 
              status={connectionStatus.status} 
              lastSeen={connectionStatus.lastSeen}
              showText={true} 
              className="text-xs"
              size="sm"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/profile/${connectionId}`, '_blank')}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem>Block User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <MessageSearch 
          onClose={() => setShowSearch(false)}
          messages={messages}
          onSearchResultClick={handleSearchResultClick}
        />
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onReply={handleReply}
              onReact={handleReact}
            />
          ))}
          {isTyping && <TypingIndicator userName={connectionName} />}
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyingTo && (
        <ReplyPreview
          replyingTo={replyingTo}
          onCancel={() => setReplyingTo(null)}
        />
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <AttachmentButton onAttachFile={handleAttachFile} />
            <ProductShareButton onShareProduct={handleShareProduct} />
            <WishlistShareButton onShareWishlist={handleShareWishlist} />
          </div>
          
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
