
import React from "react";
import { Message } from "@/utils/messageService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface ChatMessageProps {
  message: Message;
  productDetails?: { name: string; id: number } | null;
}

const ChatMessage = ({ message, productDetails }: ChatMessageProps) => {
  const { user } = useAuth();
  const isOwn = user?.id === message.sender_id;

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
            <Link 
              to={`/marketplace?productId=${productDetails.id}`}
              className="mt-2 text-xs underline block hover:opacity-80"
            >
              View product: {productDetails.name}
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
