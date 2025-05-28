
import React, { useState, useEffect, useRef } from "react";
import { Message, fetchMessages, sendMessage, markMessagesAsRead, subscribeToMessages } from "@/utils/messageService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MoreVertical, Phone, Video } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatMessage from "./ChatMessage";
import ProductShareButton from "./ProductShareButton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ChatInterfaceProps {
  connectionId: string;
  connectionName: string;
}

const ChatInterface = ({ connectionId, connectionName }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [productDetails, setProductDetails] = useState<Record<number, { name: string; id: number }>>({});

  // Load messages when the component mounts or the connection changes
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      const data = await fetchMessages(connectionId);
      setMessages(data);
      setIsLoading(false);

      // Mark unread messages as read
      const unreadMessageIds = data
        .filter(msg => !msg.is_read && msg.recipient_id === user?.id)
        .map(msg => msg.id);
        
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }

      // Fetch product details for messages with product links
      const productIds = data
        .filter(msg => msg.product_link_id)
        .map(msg => msg.product_link_id)
        .filter((id): id is number => id !== null);
      
      // Here you would fetch the product details
      // This is a placeholder for now
      const uniqueProductIds = [...new Set(productIds)];
      const productDetailsMap: Record<number, { name: string; id: number }> = {};
      uniqueProductIds.forEach(id => {
        productDetailsMap[id] = { 
          name: `Product #${id}`, 
          id 
        };
      });
      setProductDetails(productDetailsMap);
    };

    if (connectionId && user?.id) {
      loadMessages();
    }
  }, [connectionId, user?.id]);

  // Subscribe to new messages
  useEffect(() => {
    if (!connectionId || !user?.id) return;

    const unsubscribe = subscribeToMessages(user.id, (newMsg) => {
      if (newMsg.sender_id === connectionId) {
        setMessages(prev => [...prev, newMsg]);
        markMessagesAsRead([newMsg.id]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [connectionId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !connectionId || isSending) return;

    setIsSending(true);
    const sent = await sendMessage({
      recipientId: connectionId,
      content: newMessage
    });
    
    if (sent) {
      setMessages(prev => [...prev, sent]);
      setNewMessage("");
    }
    setIsSending(false);
  };

  const handleShareProduct = async (product: any) => {
    if (!connectionId || isSending) return;

    setIsSending(true);
    const sent = await sendMessage({
      recipientId: connectionId,
      content: `Check out this product: ${product.name}`,
      productLinkId: product.id
    });
    
    if (sent) {
      setMessages(prev => [...prev, sent]);
      // Add product details for immediate display
      setProductDetails(prev => ({
        ...prev,
        [product.id]: { name: product.name, id: product.id }
      }));
      toast.success("Product shared!");
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-md">
      {/* Enhanced Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{connectionName.charAt(0)}</AvatarFallback>
              <AvatarImage src="" alt={connectionName} />
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{connectionName}</h3>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No messages yet.</p>
              <p className="text-sm text-muted-foreground">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                productDetails={message.product_link_id ? productDetails[message.product_link_id] : null}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Enhanced Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/30">
        <div className="flex gap-2 items-end">
          <div className="flex-1 min-w-0">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="resize-none"
              disabled={isSending}
            />
          </div>
          <div className="flex gap-1">
            <ProductShareButton onShareProduct={handleShareProduct} />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
