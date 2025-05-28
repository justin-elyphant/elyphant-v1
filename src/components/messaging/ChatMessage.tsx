
import React from "react";
import { Message } from "@/utils/messageService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import MessageStatusIndicator from "./MessageStatusIndicator";
import ProductSharePreview from "./ProductSharePreview";
import WishlistSharePreview from "./WishlistSharePreview";
import { Wishlist } from "@/types/profile";

interface ChatMessageProps {
  message: Message;
  productDetails?: { name: string; id: number } | null;
  wishlistDetails?: Wishlist | null;
  showStatus?: boolean;
}

const ChatMessage = ({ 
  message, 
  productDetails, 
  wishlistDetails, 
  showStatus = true 
}: ChatMessageProps) => {
  const { user } = useAuth();
  const isOwn = user?.id === message.sender_id;

  // Mock status for demo - in real app this would come from message data
  const getMessageStatus = () => {
    if (!isOwn) return "read";
    
    // Mock logic based on message age
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    if (messageAge < 1000) return "sending";
    if (messageAge < 5000) return "sent";
    if (messageAge < 30000) return "delivered";
    return "read";
  };

  return (
    <div className={`flex items-start gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback>{isOwn ? 'Me' : 'U'}</AvatarFallback>
        <AvatarImage src="" alt="" />
      </Avatar>

      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn 
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-muted rounded-tl-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          
          {message.product_link_id && productDetails && (
            <div className="mt-2">
              <ProductSharePreview
                productId={productDetails.id}
                productName={productDetails.name}
                productImage="/placeholder.svg"
                productPrice={99.99}
                productBrand="Demo Brand"
                onViewProduct={() => {
                  // Navigate to product in marketplace
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
                  // Navigate to wishlist
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
