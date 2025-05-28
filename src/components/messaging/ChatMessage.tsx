
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

interface ChatMessageProps {
  message: Message;
  productDetails?: { name: string; id: number } | null;
  wishlistDetails?: Wishlist | null;
  showStatus?: boolean;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const ChatMessage = ({ 
  message, 
  productDetails, 
  wishlistDetails, 
  showStatus = true,
  onReply,
  onReact
}: ChatMessageProps) => {
  const { user } = useAuth();
  const isOwn = user?.id === message.sender_id;

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
    <div className={`group flex items-start gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback>{isOwn ? 'Me' : 'U'}</AvatarFallback>
        <AvatarImage src="" alt="" />
      </Avatar>

      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-2 rounded-lg ${
            isOwn 
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-muted rounded-tl-none'
          }`}
        >
          <div className={`absolute top-2 ${isOwn ? 'left-2' : 'right-2'}`}>
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

          <p className="text-sm pr-8">{message.content}</p>
          
          {message.product_link_id && productDetails && (
            <div className="mt-2">
              <ProductSharePreview
                productId={productDetails.id}
                productName={productDetails.name}
                productImage="/placeholder.svg"
                productPrice={99.99}
                productBrand="Demo Brand"
                onViewProduct={() => {
                  window.open(`/marketplace?productId=${productDetails.id}`, '_blank');
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
        
        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </p>
          {isOwn && showStatus && (
            <MessageStatusIndicator status={getMessageStatus()} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
