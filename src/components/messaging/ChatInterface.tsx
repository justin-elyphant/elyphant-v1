import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatMessage from "./ChatMessage";
import ProductShareButton from "./ProductShareButton";
import WishlistShareButton from "./WishlistShareButton";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlists } from "@/components/gifting/hooks/useWishlists";
import { toast } from "sonner";
import { Wishlist } from "@/types/profile";
import { useDirectMessaging } from "@/hooks/useUnifiedMessaging";

interface ChatInterfaceProps {
  connectionId: string;
  connectionName: string;
}

const ChatInterface = ({ connectionId, connectionName }: ChatInterfaceProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlists } = useWishlists();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<string, { name: string; id: string }>>({});
  const [wishlistDetails, setWishlistDetails] = useState<Record<string, Wishlist>>({});

  // Use unified messaging hook
  const { 
    messages, 
    loading: isLoading, 
    sendMessage, 
    markAsRead,
    presence,
    isTyping
  } = useDirectMessaging(connectionId);

  // Mark unread messages as read when component loads
  useEffect(() => {
    const unreadMessageIds = messages
      .filter(msg => !msg.is_read && msg.recipient_id === user?.id)
      .map(msg => msg.id);
      
    if (unreadMessageIds.length > 0) {
      markAsRead(unreadMessageIds);
    }
  }, [messages, user?.id, markAsRead]);

  // Fetch product and wishlist details for messages
  useEffect(() => {
    // Fetch product details for messages with product links
    const productIds = messages
      .filter(msg => msg.product_link_id)
      .map(msg => msg.product_link_id?.toString())
      .filter((id): id is string => id !== undefined);
    
    // Mock product details - in real app, fetch from marketplace
    const uniqueProductIds = [...new Set(productIds)];
    const productDetailsMap: Record<string, { name: string; id: string }> = {};
    uniqueProductIds.forEach(id => {
      productDetailsMap[id] = { 
        name: `Product #${id}`, 
        id: id
      };
    });
    setProductDetails(productDetailsMap);

    // Fetch wishlist details for messages with wishlist links
    const wishlistIds = messages
      .filter(msg => msg.wishlist_link_id)
      .map(msg => msg.wishlist_link_id)
      .filter((id): id is string => id !== null);
    
    const uniqueWishlistIds = [...new Set(wishlistIds)];
    const wishlistDetailsMap: Record<string, Wishlist> = {};
    uniqueWishlistIds.forEach(id => {
      const wishlist = wishlists.find(w => w.id === id);
      if (wishlist) {
        wishlistDetailsMap[id] = wishlist;
      }
    });
    setWishlistDetails(wishlistDetailsMap);
  }, [messages, wishlists]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !connectionId || isSending) return;

    setIsSending(true);
    try {
      const sent = await sendMessage({
        content: newMessage
      });
      
      if (sent) {
        setNewMessage("");
        toast.success("Message sent!");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleShareProduct = async (product: any) => {
    if (!connectionId || isSending) return;

    setIsSending(true);
    try {
      const sent = await sendMessage({
        content: `Check out this product: ${product.name}`,
        messageType: 'product_share'
      });
      
      if (sent) {
        // Add product details for immediate display
        setProductDetails(prev => ({
          ...prev,
          [product.id]: { name: product.name, id: product.id }
        }));
        toast.success("Product shared!");
      }
    } catch (error) {
      toast.error("Failed to share product");
    } finally {
      setIsSending(false);
    }
  };

  const handleShareWishlist = async (wishlist: Wishlist) => {
    if (!connectionId || isSending) return;

    setIsSending(true);
    try {
      const sent = await sendMessage({
        content: `Check out my wishlist: ${wishlist.title}`,
        messageType: 'text'
      });
      
      if (sent) {
        // Add wishlist details for immediate display
        setWishlistDetails(prev => ({
          ...prev,
          [wishlist.id]: wishlist
        }));
        toast.success("Wishlist shared!");
      }
    } catch (error) {
      toast.error("Failed to share wishlist");
    } finally {
      setIsSending(false);
    }
  };

  const handleViewProfile = () => {
    navigate(`/profile/${connectionId}`);
  };

  const handleMuteNotifications = () => {
    toast.success("Notifications muted (feature coming soon)");
  };

  const handleClearChat = () => {
    toast.success("Chat cleared (feature coming soon)");
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
              <p className="text-sm text-muted-foreground">
                {presence?.status === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewProfile}>
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMuteNotifications}>
                  Mute Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearChat}>
                  Clear Chat
                </DropdownMenuItem>
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
                message={message as any}
                productDetails={message.product_link_id ? productDetails[message.product_link_id.toString()] : null}
                wishlistDetails={message.wishlist_link_id ? wishlistDetails[message.wishlist_link_id] : null}
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
            <WishlistShareButton onShareWishlist={handleShareWishlist} />
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