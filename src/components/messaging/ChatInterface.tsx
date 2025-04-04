
import React, { useState, useEffect, useRef } from "react";
import { Message, fetchMessages, sendMessage, markMessagesAsRead, subscribeToMessages } from "@/utils/messageService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useConnection } from "@/hooks/useConnection";

interface ChatInterfaceProps {
  connectionId: string;
  connectionName: string;
}

const ChatInterface = ({ connectionId, connectionName }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
    if (!newMessage.trim() || !connectionId) return;

    const sent = await sendMessage({
      recipientId: connectionId,
      content: newMessage
    });
    
    if (sent) {
      setMessages(prev => [...prev, sent]);
      setNewMessage("");
    }
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
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Chat with {connectionName}</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
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
      
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
