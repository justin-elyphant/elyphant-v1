
import React from "react";
import { Message } from "@/utils/messageService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import MessageStatusIndicator from "./MessageStatusIndicator";
import ProductSharePreview from "./ProductSharePreview";
import WishlistSharePreview from "./WishlistSharePreview";
import MessageContextMenu from "./MessageContextMenu";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import { useProductContext } from "@/contexts/ProductContext";

interface ChatMessageProps {
  message: Message;
  productDetails?: { name: string; id: number } | null;
  wishlistDetails?: Wishlist | null;
  showStatus?: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  isConsecutive?: boolean;
  showTimestamp?: boolean;
}

const ChatMessage = ({ 
  message, 
  productDetails, 
  wishlistDetails, 
  showStatus = true,
  onReply,
  onReact,
  isConsecutive = false,
  showTimestamp = true
}: ChatMessageProps) => {
  const { user } = useAuth();
  const { allProducts } = useProductContext();
  const isOwn = user?.id === message.sender_id;

  // Find the actual product from our marketplace data
  const actualProduct = message.product_link_id ? 
    allProducts.find(p => 
      p.product_id === message.product_link_id || 
      p.id === message.product_link_id
    ) : null;

  const getMessageStatus = () => {
    if (!isOwn) return "read";
    
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    if (messageAge < 1000) return "sending";
    if (messageAge < 5000) return "sent";
    if (messageAge < 30000) return "delivered";
    return "read";
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard");
  };

  const handlePin = (messageId: string) => {
    toast.success("Message pinned (feature coming soon)");
  };

  const handleArchive = (messageId: string) => {
    toast.success("Message archived (feature coming soon)");
  };

  const handleDelete = (messageId: string) => {
    toast.success("Message deleted (feature coming soon)");
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (onReact) {
      onReact(messageId, emoji);
    } else {
      toast.success("Reaction added (feature coming soon)");
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  return (
    <div className={`group flex items-start gap-2 ${isConsecutive ? 'mb-1' : 'mb-3'} ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isConsecutive && (
        <Avatar className="h-6 w-6 mt-1">
          <AvatarFallback className="text-xs">{isOwn ? 'Me' : 'U'}</AvatarFallback>
          <AvatarImage src="" alt="" />
        </Avatar>
      )}
      
      {isConsecutive && !isOwn && <div className="w-6" />}

      <div className={`max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showTimestamp && (
          <div className={`text-xs text-muted-foreground mb-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </div>
        )}

        <div
          className={`group relative px-2.5 py-1.5 rounded-2xl ${
            isOwn 
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          <div className={`absolute top-1 ${isOwn ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <MessageContextMenu
              message={message}
              isOwn={isOwn}
              onReply={handleReply}
              onReact={handleReact}
              onCopy={handleCopy}
              onPin={handlePin}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </div>

          <p className="text-sm leading-relaxed pr-6">{message.content}</p>
          
          {message.product_link_id && actualProduct && (
            <div className="mt-2">
              <ProductSharePreview
                productId={parseInt(actualProduct.product_id || actualProduct.id || "0")}
                productName={actualProduct.title || actualProduct.name || ""}
                productImage={actualProduct.image}
                productPrice={actualProduct.price}
                productBrand={actualProduct.brand}
                onViewProduct={() => {
                  window.open(`/marketplace?productId=${actualProduct.product_id || actualProduct.id}`, '_blank');
                }}
              />
            </div>
          )}

          {message.wishlist_link_id && wishlistDetails && (
            <div className="mt-2">
              <WishlistSharePreview
                wishlist={wishlistDetails}
                onViewWishlist={() => {
                  window.open(`/wishlists`, '_blank');
                }}
              />
            </div>
          )}
        </div>
        
        {!isConsecutive && isOwn && showStatus && (
          <div className="flex items-center justify-end mt-1">
            <MessageStatusIndicator status={getMessageStatus()} />
          </div>
        )}
      </div>
      
      {isConsecutive && isOwn && <div className="w-6" />}
    </div>
  );
};

export default ChatMessage;
